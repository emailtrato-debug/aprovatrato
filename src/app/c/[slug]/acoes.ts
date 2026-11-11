"use server";

import { updateTag } from "next/cache";
import { clientePorSlug, type Cliente } from "@/lib/clients";
import {
  atualizarResponsaveis, atualizarStatus, comentariosSemCache, criarComentario, obterTask, statusDaLista, tagLista, tagTask, type CuTaskResumo,
} from "@/lib/clickup";
import { DESIGNERS } from "@/lib/equipe";
import { registrar, type EventoLog } from "@/lib/log";
import { ESTADOS, estadoParaCliente, marcosDaArte } from "@/lib/posts";
import type { EstadoPost, Mensagem } from "@/lib/types";

// Ações do cliente. Toda validação acontece AQUI, no servidor: o navegador só pede.

export type Resultado =
  | { ok: true; estado?: EstadoPost; mensagem?: Mensagem; aprovados?: string[]; falhas?: number }
  | { ok: false; erro: string };

const TIPOS = ["Arte", "Legenda", "Data"] as const;
const LIMITE_TEXTO = 2000;
const ERRO_GENERICO = "Não conseguimos concluir agora. A equipe da Trato já foi avisada, tente de novo em instantes.";

// Freio simples contra abuso (por instância do servidor): 60 ações por minuto por link.
const janela = new Map<string, number[]>();
function limitado(slug: string): boolean {
  const agora = Date.now();
  const recentes = (janela.get(slug) ?? []).filter((t) => agora - t < 60_000);
  recentes.push(agora);
  janela.set(slug, recentes);
  return recentes.length > 60;
}

class ErroAmigavel extends Error {}

const limpar = (s: unknown) =>
  typeof s === "string" ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, LIMITE_TEXTO) : "";

/** Confere o link, a task e o status atual. Qualquer falha vira mensagem amigável. */
async function validar(slug: string, taskId: string, permitidos: EstadoPost[]) {
  const cliente = clientePorSlug(slug);
  if (!cliente || typeof taskId !== "string" || !/^[a-z0-9]{6,20}$/i.test(taskId)) throw new ErroAmigavel("Post não encontrado.");
  if (limitado(slug)) throw new ErroAmigavel("Muitas ações em pouco tempo. Aguarde um minuto e tente de novo.");

  const task = await obterTask(taskId);
  if (task.list.id !== cliente.listaId) {
    await registrar({ cliente: cliente.nome, postId: taskId, acao: "bloqueado", resultado: "erro", detalhe: "task de outra lista" });
    throw new ErroAmigavel("Post não encontrado.");
  }
  // Mesma regra da tela: o que o cliente não vê (sem #arte, ou arte velha após um ajuste) ele não pode aprovar.
  const comentarios = await comentariosSemCache(task.id);
  const { arteEm, ajusteEm } = marcosDaArte(comentarios);
  const base = ESTADOS[task.status.status.trim().toLowerCase()];
  const estado = base ? estadoParaCliente(base, arteEm, ajusteEm) : null;
  if (!estado) throw new ErroAmigavel("Post não encontrado.");
  if (!permitidos.includes(estado)) {
    const nome = estado === "aprovado" ? "já foi aprovado" : estado === "ajuste" ? "já está em ajuste" : "não está mais aguardando sua resposta";
    throw new ErroAmigavel(`Este post ${nome}. Atualize a página para ver a situação atual.`);
  }
  return { cliente, task, comentarios };
}

/** Garante que o nome do status existe na lista antes de mudar. Devolve o nome exato do ClickUp. */
async function nomeDoStatus(cliente: Cliente, task: CuTaskResumo, destino: "aprovado" | "ajuste"): Promise<string> {
  const nomes = await statusDaLista(cliente.listaId);
  const achado = nomes.find((n) => n.trim().toLowerCase() === destino);
  if (!achado) {
    await registrar({
      cliente: cliente.nome, postId: task.id, postTitulo: task.name, acao: destino === "aprovado" ? "aprovar" : "pedir-ajuste",
      resultado: "erro", detalhe: `status "${destino.toUpperCase()}" não existe na lista ${cliente.listaId}`,
    });
    throw new ErroAmigavel(`Não encontramos o passo "${destino.toUpperCase()}" no fluxo deste post. A equipe da Trato já foi avisada.`);
  }
  return achado;
}

function atualizarCache(cliente: Cliente, taskId: string) {
  updateTag(tagLista(cliente.listaId));
  updateTag(tagTask(taskId));
}

async function executar(
  base: Pick<EventoLog, "cliente" | "postId" | "acao"> & Partial<EventoLog>,
  fn: () => Promise<Resultado>,
): Promise<Resultado> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ErroAmigavel) return { ok: false, erro: e.message };
    await registrar({ ...base, resultado: "erro", detalhe: e instanceof Error ? e.message : String(e) });
    return { ok: false, erro: ERRO_GENERICO };
  }
}

function novaMensagem(id: string | number, cliente: Cliente, texto: string): Mensagem {
  return { id: String(id), autor: "cliente", nome: cliente.nome, data: new Date().toISOString(), texto };
}

// ------------------------------------------------------------------------------------

export async function aprovarPost(slug: string, taskId: string): Promise<Resultado> {
  const base = { cliente: clientePorSlug(slug)?.nome ?? slug, postId: taskId, acao: "aprovar" as const };
  return executar(base, async () => {
    const { cliente, task } = await validar(slug, taskId, ["aguardando"]);
    const status = await nomeDoStatus(cliente, task, "aprovado");
    await atualizarStatus(task.id, status);
    atualizarCache(cliente, task.id);
    await registrar({ cliente: cliente.nome, postId: task.id, postTitulo: task.name, acao: "aprovar", resultado: "ok" });
    return { ok: true, estado: "aprovado" };
  });
}

export async function aprovarPendentes(slug: string, ids: string[]): Promise<Resultado> {
  const base = { cliente: clientePorSlug(slug)?.nome ?? slug, postId: "(vários)", acao: "aprovar-pendentes" as const };
  return executar(base, async () => {
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 40) throw new ErroAmigavel("Não há posts pendentes para aprovar.");
    const aprovados: string[] = [];
    let falhas = 0;
    for (const id of ids) {
      const r = await aprovarPost(slug, id);
      if (r.ok) aprovados.push(id);
      else falhas++;
    }
    await registrar({
      cliente: base.cliente, postId: aprovados.join(","), acao: "aprovar-pendentes",
      resultado: falhas ? "erro" : "ok", detalhe: `${aprovados.length} aprovados, ${falhas} falhas`,
    });
    if (aprovados.length === 0) throw new ErroAmigavel("Não conseguimos aprovar os posts agora. Tente de novo em instantes.");
    return { ok: true, aprovados, falhas };
  });
}

export async function pedirAjuste(slug: string, taskId: string, tipos: string[], texto: string): Promise<Resultado> {
  const base = { cliente: clientePorSlug(slug)?.nome ?? slug, postId: taskId, acao: "pedir-ajuste" as const };
  return executar(base, async () => {
    const escolhidos = TIPOS.filter((t) => Array.isArray(tipos) && tipos.includes(t));
    const comentario = limpar(texto);
    if (escolhidos.length === 0) throw new ErroAmigavel("Marque o que precisa mudar: arte, legenda ou data.");
    if (!comentario) throw new ErroAmigavel("Escreva o que precisa mudar. O comentário é obrigatório.");

    const { cliente, task, comentarios } = await validar(slug, taskId, ["aguardando"]);
    const status = await nomeDoStatus(cliente, task, "ajuste"); // valida ANTES de escrever qualquer coisa

    const cabecalho = `Comentário do cliente via portal · Ajuste em: ${escolhidos.join(", ")}`;
    // Designer da task = quem da lista DESIGNERS comentou por último (entregou o link do layout).
    const doDesigner = [...comentarios].sort((x, y) => Number(y.date) - Number(x.date)).find((m) => DESIGNERS.some((d) => d.id === m.user?.id));
    const designer = DESIGNERS.find((d) => d.id === doDesigner?.user?.id) ?? null;
    const atuais = (task.assignees ?? []).map((x) => x.id).filter((id) => Number.isFinite(id));
    // Marca (@) o designer e quem era responsável (a social), para os dois serem avisados.
    const marcados = [...new Set([...(designer ? [designer.id] : []), ...atuais])];
    const criado = await criarComentario(task.id, cabecalho, comentario, marcados);
    await atualizarStatus(task.id, status);
    let detalhe = designer ? `task devolvida a ${designer.nome}` : "designer não identificado: responsáveis mantidos";
    if (designer) {
      // A task volta para o designer: ele entra como responsável e quem estava (a social) sai.
      try {
        await atualizarResponsaveis(task.id, atuais.includes(designer.id) ? [] : [designer.id], atuais.filter((id) => id !== designer.id));
      } catch (e) {
        detalhe = `designer ${designer.nome} marcado, mas não consegui trocar o responsável: ${e instanceof Error ? e.message : e}`;
      }
    }
    atualizarCache(cliente, task.id);
    await registrar({
      cliente: cliente.nome, postId: task.id, postTitulo: task.name, acao: "pedir-ajuste",
      tiposAjuste: escolhidos, resultado: "ok", detalhe,
    });
    return { ok: true, estado: "ajuste", mensagem: novaMensagem(criado.id, cliente, comentario) };
  });
}

export async function comentarPost(slug: string, taskId: string, texto: string): Promise<Resultado> {
  const base = { cliente: clientePorSlug(slug)?.nome ?? slug, postId: taskId, acao: "comentar" as const };
  return executar(base, async () => {
    const comentario = limpar(texto);
    if (!comentario) throw new ErroAmigavel("Escreva seu comentário antes de enviar.");
    const { cliente, task } = await validar(slug, taskId, ["aguardando", "aprovado", "ajuste"]);
    const criado = await criarComentario(task.id, "Comentário do cliente via portal", comentario);
    updateTag(tagTask(task.id));
    await registrar({ cliente: cliente.nome, postId: task.id, postTitulo: task.name, acao: "comentar", resultado: "ok" });
    return { ok: true, mensagem: novaMensagem(criado.id, cliente, comentario) };
  });
}
