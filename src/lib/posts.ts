import "server-only";
import type { Cliente } from "./clients";
import { listarComentarios, listarTasks, type CuComentario, type CuTask } from "./clickup";
import { dataISO } from "./datas";
import { urlDaMidia } from "./midia";
import { ordenarPorNumero } from "./ordem";
import type { DadosMes, EstadoPost, Mensagem, Midia, Post } from "./types";

// ---------------------------------------------------------------------------
// Regras de negócio (ver README): o que o cliente vê e de onde vem cada dado.
// ---------------------------------------------------------------------------

/** Status do ClickUp (em minúsculas) → estado no portal. O que não está aqui fica invisível. */
export const ESTADOS: Record<string, EstadoPost> = {
  "em aprovação (cliente)": "aguardando",
  aprovado: "aprovado",
  ajuste: "ajuste",
  publicado: "no-ar",
  finalizado: "no-ar",
};

const MARCADOR_ARTE = "#arte";
const MARCADOR_REEL = "#reels?"; // #reel (ou #reels): vídeo + capa de um Reels
const MARCADOR_EQUIPE = "#cliente";
const PREFIXO_CLIENTE = "comentário do cliente via portal";
const MAX_NO_AR = 9;

const FORMATOS: Record<string, string> = {
  carrossel: "Carrossel", carrosel: "Carrossel",
  estatico: "Estático", reels: "Reels", reel: "Reels",
  story: "Story", stories: "Story", video: "Vídeo", motion: "Motion",
};

const TAGS_DE_REDE = new Set([
  "instagram", "facebook", "linkedin", "tiktok", "youtube", "pinterest", "whatsapp", "twitter", "x",
]);

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function limparTitulo(nome: string, tags: string[]) {
  let formato: string | null = null;
  let editoria: string | null = null;
  let titulo = nome.trim();

  // "Carrossel | Gestão | Gasto da obra" → formato | editoria | título.  "Estático: Tema" também vale.
  const m = titulo.match(/^([^|:]{3,14}?)\s*[|:]\s*(.+)$/s);
  if (m && FORMATOS[sem(m[1])]) {
    formato = FORMATOS[sem(m[1])];
    titulo = m[2].trim();
    const partes = titulo.split("|").map((p) => p.trim());
    if (partes.length >= 2) {
      editoria = partes[0];
      titulo = partes.slice(1).join(" | ");
    }
  }

  for (const tag of tags) {
    const t = sem(tag);
    if (FORMATOS[t]) formato = FORMATOS[t];
    else if (!TAGS_DE_REDE.has(t) && !editoria) editoria = tag.charAt(0).toUpperCase() + tag.slice(1);
  }
  return { formato, editoria, titulo };
}

function extrairLegenda(task: CuTask): string {
  const texto = task.text_content ?? task.description ?? "";
  const m = texto.match(/LEGENDA\s*:\s*([\s\S]*)$/i);
  return m ? m[1].trim() : "";
}

function dataDePublicacao(task: CuTask): string | null {
  const campo = task.custom_fields?.find((f) => sem(f.name) === "data de publicacao");
  return campo?.value ? dataISO(campo.value) : null;
}

const EXT_VIDEO = /\.(mp4|mov|m4v|webm)(\?|$)/i;

function midiasDoComentario(c: CuComentario): Midia[] {
  const achadas: { nome: string; midia: Midia }[] = [];
  for (const parte of c.comment) {
    for (const valor of Object.values(parte)) {
      if (!valor || typeof valor !== "object") continue;
      const obj = valor as Record<string, unknown>;
      const url = typeof obj.url === "string" ? obj.url : null;
      if (!url || !/^https:\/\//.test(url)) continue;
      const nome = String(obj.name ?? obj.title ?? url);
      const video = EXT_VIDEO.test(nome) || String(obj.extension ?? "").startsWith("video");
      const miniatura = (obj.thumbnail_large ?? obj.thumbnail_medium ?? null) as string | null;
      achadas.push({
        nome,
        midia: {
          tipo: video ? "video" : "imagem",
          url: urlDaMidia(url),
          miniatura: urlDaMidia(miniatura ?? (video ? null : url)),
          largura: typeof obj.width === "number" ? obj.width : undefined,
          altura: typeof obj.height === "number" ? obj.height : undefined,
        },
      });
    }
  }
  // Carrossel: a ordem dos slides vem do número no nome do arquivo (arte-1, arte-2...).
  const ordenadas = ordenarPorNumero(achadas, (x) => x.nome).map((x) => x.midia);

  // Reels: o vídeo é o conteúdo e a imagem que vem junto é a CAPA (aparece no player e na grade).
  const videos = ordenadas.filter((m) => m.tipo === "video");
  if (videos.length > 0) {
    const capa = ordenadas.find((m) => m.tipo === "imagem");
    return videos.map((v, i) => (i === 0 && capa ? { ...v, miniatura: capa.miniatura ?? capa.url } : v));
  }
  return ordenadas;
}

function interpretarComentarios(comentarios: CuComentario[], nomeCliente: string) {
  const asc = [...comentarios].sort((a, b) => Number(a.date) - Number(b.date));

  // Arte: o ÚLTIMO comentário que começa com #arte. Postar outro #arte substitui o anterior.
  // O marcador pode vir em qualquer lugar do comentário (o ClickUp põe o nome do arquivo antes do texto).
  const temMarcador = (texto: string, marcador: string) => new RegExp(`(^|\\s)${marcador}(?![\\p{L}\\d_])`, "iu").test(texto);
  // Só vale comentário #arte que tenha imagem ou vídeo anexado (esquecer de anexar não publica nada).
  const arte = [...asc].reverse().find(
    (c) => (temMarcador(c.comment_text, MARCADOR_ARTE) || temMarcador(c.comment_text, MARCADOR_REEL)) && midiasDoComentario(c).length > 0,
  );
  const ehReel = Boolean(arte && temMarcador(arte.comment_text, MARCADOR_REEL));
  const midias = arte ? midiasDoComentario(arte) : [];
  const arteEm = arte ? Number(arte.date) : null;
  // Último pedido de ajuste feito pelo cliente no portal (para saber se a arte ficou velha).
  const ultimoAjuste = [...asc].reverse().find((c) => c.comment_text.trim().toLowerCase().startsWith(`${PREFIXO_CLIENTE} · ajuste`));
  const ajusteEm = ultimoAjuste ? Number(ultimoAjuste.date) : null;

  // Conversa: só o que a equipe marcou com #cliente e o que veio do próprio portal.
  const conversa: Mensagem[] = [];
  for (const c of asc) {
    const texto = c.comment_text.trim();
    const baixo = texto.toLowerCase();
    if (temMarcador(texto, MARCADOR_EQUIPE)) {
      conversa.push({
        id: c.id, autor: "equipe", nome: "Equipe Trato",
        data: new Date(Number(c.date)).toISOString(),
        texto: texto.replace(new RegExp(`(^|\\s)${MARCADOR_EQUIPE}(?![\\p{L}\\d_])[\\s:–-]*`, "iu"), "$1").trim(),
      });
    } else if (baixo.startsWith(PREFIXO_CLIENTE)) {
      conversa.push({
        id: c.id, autor: "cliente", nome: nomeCliente,
        data: new Date(Number(c.date)).toISOString(),
        // O ClickUp põe as marcações (@responsável) no fim do texto; elas não são do cliente.
        texto: texto.replace(/^[^\n]*\n?/, "").replace(/(?:\s*@[^\s@][^@\n]*)+$/u, "").trim(),
      });
    }
  }
  return { midias, conversa, arteEm, ajusteEm, ehReel };
}

/** Quando foi a última arte (#arte) e o último pedido de ajuste do cliente, em milissegundos. */
export function marcosDaArte(comentarios: CuComentario[]) {
  const { arteEm, ajusteEm } = interpretarComentarios(comentarios, "");
  return { arteEm, ajusteEm };
}

/**
 * O que o cliente enxerga de um post, dado o status e os comentários. `null` = invisível.
 * - Sem comentário #arte, o post não aparece (a equipe ainda está na aprovação interna).
 * - Voltou ao status EM APROVAÇÃO (CLIENTE) mas a última arte é anterior ao último pedido de ajuste do
 *   cliente: a nova versão ainda não foi anexada, então o cliente continua vendo "Em ajuste".
 */
export function estadoParaCliente(estado: EstadoPost, arteEm: number | null, ajusteEm: number | null): EstadoPost | null {
  if (estado === "no-ar") return estado;
  if (!arteEm) return null;
  if (estado === "aguardando" && ajusteEm && ajusteEm > arteEm) return "ajuste";
  return estado;
}

async function emLotes<T, R>(itens: T[], tamanho: number, fn: (i: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    out.push(...(await Promise.all(itens.slice(i, i + tamanho).map(fn))));
  }
  return out;
}

type Base = Omit<Post, "midias" | "conversa" | "numero">;

/** Posts do cliente para um mês (AAAA-MM): os do mês primeiro, depois os que já estão no ar. */
export async function carregarMes(cliente: Cliente, mes: string): Promise<DadosMes> {
  const tasks = await listarTasks(cliente.listaId);

  const base: Base[] = [];
  for (const t of tasks) {
    const estado = ESTADOS[t.status.status.trim().toLowerCase()];
    const data = dataDePublicacao(t);
    if (!estado || !data) continue; // status interno ou sem data de publicação: invisível
    const { formato, editoria, titulo } = limparTitulo(t.name, t.tags.map((x) => x.name));
    base.push({ id: t.id, titulo, formato, editoria, estado, dataPublicacao: data, legenda: extrairLegenda(t) });
  }

  const doMes = base
    .filter((p) => p.estado !== "no-ar" && p.dataPublicacao.startsWith(mes))
    .sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao) || a.titulo.localeCompare(b.titulo));

  // Feed já publicado até o fim do mês visto, do mais recente para o mais antigo.
  const noAr = base
    .filter((p) => p.estado === "no-ar" && p.dataPublicacao.slice(0, 7) <= mes)
    .sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao))
    .slice(0, MAX_NO_AR);

  const enriquecer = async (p: Base, numero: number | null): Promise<Post | null> => {
    const exigeArte = p.estado !== "no-ar";
    try {
      const { midias, conversa, arteEm, ajusteEm, ehReel } = interpretarComentarios(
        await listarComentarios(p.id, p.estado === "no-ar"),
        cliente.nome,
      );
      const estado = estadoParaCliente(p.estado, arteEm, ajusteEm);
      if (!estado) return null;
      // Comentário com #reel define o formato, mesmo que o título não diga "Reels |".
      return { ...p, estado, numero, midias, conversa, formato: ehReel ? "Reels" : p.formato };
    } catch (e) {
      console.error(`[portal] falha ao ler comentários da task ${p.id}:`, e instanceof Error ? e.message : e);
      // Post do mês: sem saber se tem arte aprovada, não dá para decidir. Melhor mostrar o erro (com
      // "tentar de novo") do que esconder ou mostrar o que o cliente não deveria ver.
      if (exigeArte) throw e;
      return { ...p, numero, midias: [], conversa: [] };
    }
  };

  // Só posts com arte anexada (#arte) chegam ao cliente. A numeração só conta os visíveis.
  const candidatos = (await emLotes(doMes, 6, (p) => enriquecer(p, 0))).filter((p): p is Post => p !== null);
  const posts = candidatos.map((p, i) => ({ ...p, numero: candidatos.length - i }));
  const publicados = (await emLotes(noAr, 6, (p) => enriquecer(p, null))).filter((p): p is Post => p !== null);
  return { posts, noAr: publicados };
}

function baseDe(t: CuTask): Base | null {
  const estado = ESTADOS[t.status.status.trim().toLowerCase()];
  const data = dataDePublicacao(t);
  if (!estado || !data) return null;
  const { formato, editoria, titulo } = limparTitulo(t.name, t.tags.map((x) => x.name));
  return { id: t.id, titulo, formato, editoria, estado, dataPublicacao: data, legenda: extrairLegenda(t) };
}

/** Um post só (link individual). Mesmas regras da tela do mês; `null` = não disponível para o cliente. */
export async function carregarPost(cliente: Cliente, taskId: string): Promise<Post | null> {
  const t = (await listarTasks(cliente.listaId)).find((x) => x.id === taskId);
  const base = t ? baseDe(t) : null;
  if (!base) return null;
  const { midias, conversa, arteEm, ajusteEm, ehReel } = interpretarComentarios(
    await listarComentarios(base.id, base.estado === "no-ar"),
    cliente.nome,
  );
  const estado = estadoParaCliente(base.estado, arteEm, ajusteEm);
  if (!estado) return null;
  return { ...base, estado, numero: null, midias, conversa, formato: ehReel ? "Reels" : base.formato };
}

/** Lista leve para a equipe copiar links individuais (não lê comentários: 1 chamada por cliente). */
export async function postsParaEquipe(cliente: Cliente) {
  const tasks = await listarTasks(cliente.listaId);
  return tasks
    .map(baseDe)
    .filter((b): b is Base => b !== null && b.estado !== "no-ar")
    .sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao))
    .slice(0, 40)
    .map((b) => ({ id: b.id, titulo: b.titulo, formato: b.formato, dataPublicacao: b.dataPublicacao, estado: b.estado }));
}
