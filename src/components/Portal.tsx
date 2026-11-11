"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { aprovarPendentes, aprovarPost, comentarPost, pedirAjuste, type Resultado } from "@/app/c/[slug]/acoes";
import { diaMes } from "@/lib/datas";
import type { ClienteResumo, EstadoPost, Mensagem, Post } from "@/lib/types";
import { AjusteSheet, ConfirmaAprovacao } from "./AjusteSheet";
import { InstalarApp } from "./InstalarApp";
import { PostDetalhe } from "./PostDetalhe";
import { COR_PONTO, corVazia, LogoCirculo, Selo, Seta, textoSobre, TituloDuplo } from "./ui";

type Filtro = "todos" | EstadoPost;

type Props = {
  slug: string;
  /** Modo de teste: as ações só mudam a tela, não chamam o ClickUp. */
  demo?: boolean;
  /** Link individual: mostra só o primeiro post, sem grade nem navegação. */
  unico?: boolean;
  cliente: ClienteResumo;
  mes: string;
  nomeMes: string;
  ano: string;
  hrefAnterior: string;
  hrefProximo: string;
  posts: Post[];
  noAr: Post[];
  aviso?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/* ----------------------------- peças pequenas ----------------------------- */

function Capa({ post, cor, className = "" }: { post: Post; cor: string; className?: string }) {
  const m = post.midias[0];
  if (!m) return <div className={className} style={{ background: cor }} />;
  if (m.tipo === "video" && !m.miniatura) {
    return <video src={m.url} muted playsInline preload="metadata" className={`object-cover ${className}`} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={m.miniatura ?? m.url} alt="" loading="lazy" className={`object-cover ${className}`} />;
}

function Contador({ n, rotulo, destaque }: { n: number; rotulo: string; destaque?: boolean }) {
  return (
    <div>
      <p className={`text-[34px] font-semibold leading-none md:text-[38px] ${destaque ? "text-brand" : ""}`}>{n}</p>
      <p className="rotulo mt-1.5 !text-ink">{rotulo}</p>
    </div>
  );
}

function Mes({ nomeMes, ano, hrefAnterior, hrefProximo }: Pick<Props, "nomeMes" | "ano" | "hrefAnterior" | "hrefProximo">) {
  return (
    <div className="flex items-center">
      <Link href={hrefAnterior} aria-label="Mês anterior" className="toque flex items-center justify-center" scroll={false}>
        <Seta dir="esq" />
      </Link>
      <span className="rotulo px-1 !text-ink">
        {nomeMes} {ano}
      </span>
      <Link href={hrefProximo} aria-label="Próximo mês" className="toque flex items-center justify-center" scroll={false}>
        <Seta dir="dir" />
      </Link>
    </div>
  );
}

function Filtros({ filtro, onFiltro, contagem }: { filtro: Filtro; onFiltro: (f: Filtro) => void; contagem: Record<Filtro, number> }) {
  const itens: [Filtro, string][] = [
    ["todos", "Todos"],
    ["aguardando", "Aguardando"],
    ["aprovado", "Aprovados"],
    ["ajuste", "Em ajuste"],
  ];
  return (
    <nav aria-label="Filtrar posts" className="sem-barra -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
      {itens.map(([id, nome]) => (
        <button
          key={id}
          onClick={() => onFiltro(id)}
          aria-pressed={filtro === id}
          className={`toque rotulo shrink-0 px-3 !text-[11px] ${filtro === id ? "!text-brand" : "!text-mute"}`}
        >
          {nome} {contagem[id]}
        </button>
      ))}
    </nav>
  );
}

function Tile({ post, indice, onAbrir, esmaecido = false }: { post: Post; indice: number; onAbrir: () => void; esmaecido?: boolean }) {
  const cor = corVazia(indice);
  const semArte = post.midias.length === 0;
  return (
    <button
      onClick={onAbrir}
      aria-label={`${post.titulo}, ${post.estado}`}
      className={`relative block aspect-[4/5] w-full overflow-hidden bg-soft text-left ${semArte ? textoSobre(cor) : "text-white"}`}
    >
      <div className={`absolute inset-0 ${esmaecido ? "opacity-55" : ""}`}>
        <Capa post={post} cor={cor} className="h-full w-full" />
      </div>
      {semArte && (
        <div className={`absolute inset-x-0 bottom-0 p-3 md:p-4 ${esmaecido ? "opacity-70" : ""}`}>
          <p className="text-[9px] uppercase tracking-[0.14em] opacity-75 md:text-[10px]">
            {[post.editoria, post.formato].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 text-[12px] font-semibold uppercase leading-[1.1] md:text-[19px]">{post.titulo}</p>
        </div>
      )}
      <span className="absolute left-1.5 top-1.5 flex items-center gap-1.5 md:left-2.5 md:top-2.5">
        {post.numero && (
          <span className={`hidden text-[11px] font-semibold opacity-90 md:inline ${semArte ? textoSobre(cor) : "text-white"}`}>{pad(post.numero)}</span>
        )}
        <span className="rounded-full bg-white/90 px-2 py-[2px] text-[9px] font-semibold leading-tight text-ink md:px-2.5 md:py-[3px] md:text-[11px]">
          {diaMes(post.dataPublicacao)}
        </span>
      </span>
      {post.midias[0]?.tipo === "video" && (
        <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-[11px] text-white md:bottom-3 md:right-3 md:h-8 md:w-8" aria-hidden>
          ▶
        </span>
      )}
      <span className="absolute right-1.5 top-1.5 md:right-2.5 md:top-2.5">
        <Selo estado={post.estado} />
      </span>
    </button>
  );
}

function Miniatura({ post, indice, className }: { post: Post; indice: number; className: string }) {
  return <Capa post={post} cor={corVazia(indice)} className={className} />;
}

/* --------------------------------- principal -------------------------------- */

export function Portal({ slug, demo = false, unico = false, cliente, mes, nomeMes, ano, hrefAnterior, hrefProximo, posts: postsServidor, noAr, aviso }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState(postsServidor);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [aberto, setAberto] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(aviso ?? null);
  const [ocupado, setOcupado] = useState(false);
  const [ajusteDe, setAjusteDe] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Quando o servidor manda dados novos (troca de mês, atualização), eles valem.
  useEffect(() => setPosts(postsServidor), [postsServidor]);

  useEffect(() => {
    setFiltro("todos");
    setAberto(null);
  }, [mes]);

  useEffect(() => {
    if (!mensagem) return;
    const t = setTimeout(() => setMensagem(null), 4500);
    return () => clearTimeout(t);
  }, [mensagem]);

  const contagem = useMemo<Record<Filtro, number>>(
    () => ({
      todos: posts.length,
      aguardando: posts.filter((p) => p.estado === "aguardando").length,
      aprovado: posts.filter((p) => p.estado === "aprovado").length,
      ajuste: posts.filter((p) => p.estado === "ajuste").length,
      "no-ar": noAr.length,
    }),
    [posts, noAr],
  );

  const visiveis = filtro === "todos" ? posts : posts.filter((p) => p.estado === filtro);
  const mostrarNoAr = filtro === "todos";
  // O calendário vai em ordem crescente (01, 02, 03...); a grade do feed segue a ordem real do Instagram.
  const calendario = [...visiveis].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));

  const tudo = useMemo(() => [...posts, ...noAr], [posts, noAr]);
  const postAberto = tudo.find((p) => p.id === aberto) ?? null;

  // Navegação do detalhe: posts do mês em ordem cronológica; já publicados na ordem da grade.
  const listaNav = useMemo(() => {
    if (!postAberto) return [];
    return postAberto.estado === "no-ar" ? noAr : [...posts].reverse();
  }, [postAberto, posts, noAr]);
  const idx = postAberto ? listaNav.findIndex((p) => p.id === postAberto.id) : -1;

  // ---- Ações: a tela muda na hora e depois o servidor confirma (router.refresh) ----
  const alterar = (id: string, mudar: (p: Post) => Post) => setPosts((ps) => ps.map((p) => (p.id === id ? mudar(p) : p)));
  const sincronizar = () => !demo && router.refresh();
  const mensagemLocal = (texto: string): Mensagem => ({
    id: `local-${Date.now()}`, autor: "cliente", nome: cliente.nome, data: new Date().toISOString(), texto,
  });
  const comResultado = async (chamada: () => Promise<Resultado>): Promise<Resultado> => {
    setOcupado(true);
    try {
      return demo ? { ok: true } : await chamada();
    } catch {
      return { ok: false, erro: "Sem conexão com o portal. Confira sua internet e tente de novo." };
    } finally {
      setOcupado(false);
    }
  };

  const aprovar = async (id: string) => {
    const r = await comResultado(() => aprovarPost(slug, id));
    if (!r.ok) return setMensagem(r.erro);
    alterar(id, (p) => ({ ...p, estado: "aprovado" }));
    setMensagem("Post aprovado. Obrigado!");
    sincronizar();
  };

  const enviarAjuste = async (tipos: string[], texto: string) => {
    if (!ajusteDe) return;
    setErroModal(null);
    const r = await comResultado(() => pedirAjuste(slug, ajusteDe, tipos, texto));
    if (!r.ok) return setErroModal(r.erro);
    const nova = (r.ok && r.mensagem) || mensagemLocal(texto);
    alterar(ajusteDe, (p) => ({ ...p, estado: "ajuste", conversa: [...p.conversa, nova] }));
    setAjusteDe(null);
    setMensagem("Pedido de ajuste enviado. A equipe da Trato já recebeu.");
    sincronizar();
  };

  const comentar = async (id: string, texto: string): Promise<boolean> => {
    const r = await comResultado(() => comentarPost(slug, id, texto));
    if (!r.ok) {
      setMensagem(r.erro);
      return false;
    }
    const nova = r.mensagem ?? mensagemLocal(texto);
    alterar(id, (p) => ({ ...p, conversa: [...p.conversa, nova] }));
    setMensagem("Comentário enviado.");
    sincronizar();
    return true;
  };

  const aprovarTodos = async () => {
    const ids = posts.filter((p) => p.estado === "aguardando").map((p) => p.id);
    setErroModal(null);
    const r = await comResultado(() => aprovarPendentes(slug, ids));
    if (!r.ok) return setErroModal(r.erro);
    const feitos = demo ? ids : (r.aprovados ?? []);
    setPosts((ps) => ps.map((p) => (feitos.includes(p.id) ? { ...p, estado: "aprovado" } : p)));
    setConfirmando(false);
    setMensagem(
      feitos.length === ids.length
        ? feitos.length === 1 ? "Post aprovado. Obrigado!" : `${feitos.length} posts aprovados. Obrigado!`
        : `${feitos.length} aprovados. ${ids.length - feitos.length} não deu para aprovar, tente de novo.`,
    );
    sincronizar();
  };

  const postDoAjuste = posts.find((p) => p.id === ajusteDe) ?? null;
  const pendentes = contagem.aguardando;
  const singular = posts.length === 1 ? "publicação" : "publicações";

  if (unico && posts[0]) {
    const p = posts[0];
    return (
      <div className="min-h-dvh bg-soft">
        <PostDetalhe
          post={p}
          unico={cliente}
          anterior={null}
          proximo={null}
          posicao={null}
          onFechar={() => {}}
          onIr={() => {}}
          onAprovar={() => aprovar(p.id)}
          onAjuste={() => {
            setErroModal(null);
            setAjusteDe(p.id);
          }}
          onComentar={(texto) => comentar(p.id, texto)}
          onAviso={setMensagem}
          ocupado={ocupado}
        />
        {postDoAjuste && (
          <AjusteSheet post={postDoAjuste} ocupado={ocupado} erro={erroModal} onEnviar={enviarAjuste} onCancelar={() => setAjusteDe(null)} />
        )}
        {mensagem && (
          <div role="status" className="fixed inset-x-4 bottom-24 z-[80] mx-auto max-w-md rounded-2xl bg-ink px-5 py-3.5 text-center text-[15px] text-white shadow-lg md:bottom-6">
            {mensagem}
          </div>
        )}
      </div>
    );
  }

  const botaoAprovarTodos = pendentes > 0 && (
    <button
      onClick={() => {
        setErroModal(null);
        setConfirmando(true);
      }}
      className="toque w-full whitespace-nowrap rounded-full bg-black px-6 py-3 text-[15px] font-semibold text-white md:w-auto"
    >
      {pendentes === 1 ? "Aprovar o 1 pendente" : `Aprovar os ${pendentes} pendentes`} ↗
    </button>
  );

  return (
    <div className="min-h-dvh">
      {/* Topo */}
      <header className="flex items-center justify-between border-b border-line px-4 py-2 md:px-9 md:py-5">
        <p className="font-display text-[22px] leading-none text-brand md:text-[26px]">
          TRATO<sup className="text-[0.4em]">®</sup>
        </p>
        <p className="rotulo hidden md:block">Aprovação de conteúdo</p>
        <div className="md:hidden">
          <Mes nomeMes={nomeMes.slice(0, 3)} ano={ano} hrefAnterior={hrefAnterior} hrefProximo={hrefProximo} />
        </div>
      </header>
      <InstalarApp nomeCliente={cliente.nome} />
      <div className="hidden items-center justify-between border-b border-line px-9 md:flex">
        <Filtros filtro={filtro} onFiltro={setFiltro} contagem={contagem} />
        <Mes nomeMes={nomeMes} ano={ano} hrefAnterior={hrefAnterior} hrefProximo={hrefProximo} />
      </div>

      {/* Cabeçalho do cliente */}
      <section className="px-4 pb-4 pt-6 md:flex md:flex-wrap md:items-end md:justify-between md:gap-x-8 md:gap-y-6 md:px-9 md:pb-8 md:pt-12">
        <div className="flex items-center gap-4 md:gap-5">
          <LogoCirculo src={cliente.logo} nome={cliente.nome} tamanho={84} />
          <div className="min-w-0">
            <h1 className="font-display break-words text-[34px] uppercase leading-[0.95] sm:text-[44px] md:text-[48px] lg:text-[64px]">{cliente.nome}</h1>
            <p className="mt-1.5 text-[15px] uppercase md:text-[17px]">
              <span className="font-semibold">Prévia do feed</span> e aprovação de {nomeMes}
            </p>
            <p className="mt-0.5 text-[13px] text-mute">
              {posts.length} {singular} no mês
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-6 md:mt-0 md:justify-end md:gap-8">
          <div className="flex gap-8 md:gap-9">
            <Contador n={contagem.aguardando} rotulo="Aguardando" destaque />
            <Contador n={contagem.aprovado} rotulo="Aprovados" />
            <Contador n={contagem.ajuste} rotulo="Em ajuste" />
          </div>
          <div className="hidden md:block">{botaoAprovarTodos}</div>
        </div>
      </section>

      <div className="border-y border-line px-4 md:hidden">
        <Filtros filtro={filtro} onFiltro={setFiltro} contagem={contagem} />
      </div>
      {pendentes > 0 && <div className="px-4 pt-4 md:hidden">{botaoAprovarTodos}</div>}

      {/* Calendário em faixa (celular) */}
      {visiveis.length > 0 && (
        <section className="px-4 pt-5 md:hidden" aria-label="Conteúdos do mês">
          <p className="rotulo">Conteúdos do mês</p>
          <ul className="sem-barra -mx-4 mt-3 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {calendario.map((p, i) => (
              <li key={p.id} className="w-[68px] shrink-0">
                <button onClick={() => setAberto(p.id)} className="block w-full text-left">
                  <span className="relative block aspect-square overflow-hidden rounded-xl bg-soft">
                    <Miniatura post={p} indice={i} className="h-full w-full" />
                    <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-[4px] border-2 border-white" style={{ background: COR_PONTO[p.estado] }} />
                  </span>
                  <span className="mt-1.5 block text-[13px] font-semibold leading-tight">{diaMes(p.dataPublicacao)}</span>
                  <span className="block truncate text-[11px] text-mute">{p.editoria ?? p.formato ?? "Post"}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="md:grid md:grid-cols-[290px_minmax(0,1fr)] md:gap-10 md:px-9 md:pb-16">
        {/* Calendário lateral (computador) */}
        <aside className="hidden md:block">
          {visiveis.length > 0 && (
            <div className="sticky top-6 rounded-3xl border border-line p-5">
              <p className="rotulo">Conteúdos do mês</p>
              <ul className="mt-4 space-y-3">
                {calendario.map((p, i) => (
                  <li key={p.id}>
                    <button onClick={() => setAberto(p.id)} className="flex w-full items-center gap-3 text-left">
                      <span className="w-5 text-[12px] text-mute">{p.numero ? pad(p.numero) : ""}</span>
                      <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-soft">
                        <Miniatura post={p} indice={i} className="h-full w-full" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold">{p.editoria ?? p.formato ?? "Post"}</span>
                        <span className="block truncate text-[12px] text-mute">
                          {diaMes(p.dataPublicacao)}
                          {p.formato && ` · ${p.formato}`}
                        </span>
                      </span>
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COR_PONTO[p.estado] }} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Grade do feed */}
        <section className="pt-6 md:pt-0" aria-label="Prévia do feed">
          <div className="mb-3 flex items-baseline justify-between px-4 md:mb-4 md:px-0">
            <h2 className="text-[20px] md:text-[24px]">
              <TituloDuplo texto="Como o feed vai ficar" />
            </h2>
            <p className="hidden text-[13px] text-mute md:block">Clique em um post para ver a legenda e aprovar</p>
          </div>

          {visiveis.length === 0 && (
            <p className="mx-4 rounded-2xl bg-soft px-5 py-8 text-center text-[15px] text-mute md:mx-0">
              {posts.length === 0
                ? `Nenhuma publicação para aprovar em ${nomeMes}. Quando a equipe enviar, ela aparece aqui.`
                : "Nenhum post neste filtro."}
            </p>
          )}

          <div className="grid grid-cols-3 gap-[2px] md:gap-1">
            {visiveis.map((p, i) => (
              <Tile key={p.id} post={p} indice={i} onAbrir={() => setAberto(p.id)} />
            ))}
            {mostrarNoAr &&
              noAr.map((p, i) => <Tile key={p.id} post={p} indice={visiveis.length + i + 2} esmaecido onAbrir={() => setAberto(p.id)} />)}
          </div>
        </section>
      </div>

      {postAberto && (
        <PostDetalhe
          post={postAberto}
          anterior={idx > 0 ? listaNav[idx - 1] : null}
          proximo={idx >= 0 && idx < listaNav.length - 1 ? listaNav[idx + 1] : null}
          posicao={postAberto.numero ? { atual: postAberto.numero, total: posts.length } : null}
          onFechar={() => setAberto(null)}
          onIr={setAberto}
          onAprovar={() => aprovar(postAberto.id)}
          onAjuste={() => {
            setErroModal(null);
            setAjusteDe(postAberto.id);
          }}
          onComentar={(texto) => comentar(postAberto.id, texto)}
          onAviso={setMensagem}
          ocupado={ocupado}
        />
      )}

      {postDoAjuste && (
        <AjusteSheet post={postDoAjuste} ocupado={ocupado} erro={erroModal} onEnviar={enviarAjuste} onCancelar={() => setAjusteDe(null)} />
      )}
      {confirmando && (
        <ConfirmaAprovacao quantidade={pendentes} ocupado={ocupado} erro={erroModal} onConfirmar={aprovarTodos} onCancelar={() => setConfirmando(false)} />
      )}

      {mensagem && (
        <div role="status" className="fixed inset-x-4 bottom-6 z-[80] mx-auto max-w-md rounded-2xl bg-ink px-5 py-3.5 text-center text-[15px] text-white shadow-lg">
          {mensagem}
        </div>
      )}
    </div>
  );
}
