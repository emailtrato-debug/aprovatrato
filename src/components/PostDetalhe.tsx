"use client";

import { useEffect, useRef, useState } from "react";
import { dataHora, diaSemanaEData } from "@/lib/datas";
import type { Midia, Post } from "@/lib/types";
import type { ClienteResumo } from "@/lib/types";
import { LogoCirculo, rotuloTipo, Selo, Seta, TituloDuplo } from "./ui";

type Props = {
  post: Post;
  anterior: Post | null;
  proximo: Post | null;
  /** "04 de 5" — só para posts do mês */
  posicao: { atual: number; total: number } | null;
  onFechar: () => void;
  onIr: (id: string) => void;
  onAprovar: () => void;
  onAjuste: () => void;
  /** Devolve true se o comentário foi enviado (aí a caixa é limpa). */
  onComentar: (texto: string) => Promise<boolean>;
  onAviso: (texto: string) => void;
  ocupado: boolean;
  /** Link individual: sem fechar nem navegar; mostra a marca do cliente no topo. */
  unico?: ClienteResumo;
};

const NOTA: Record<string, string> = {
  aprovado: "Post aprovado. A equipe da Trato cuida do resto.",
  ajuste: "Pedido de ajuste enviado. A equipe da Trato avisa quando a nova versão estiver aqui.",
  "no-ar": "Este post já está no ar.",
};

function Carrossel({ midias }: { midias: Midia[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const total = midias.length;

  const ir = (n: number) => {
    const el = ref.current;
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };

  if (total === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-white px-8 text-center text-[15px] text-mute">
        A arte deste post ainda não foi anexada.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div
          ref={ref}
          onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="sem-barra flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto rounded-lg bg-white"
        >
          {midias.map((m, i) => (
            <div key={m.url} className="h-full w-full shrink-0 snap-center bg-white">
              {m.tipo === "video" ? (
                <video
                  src={m.url}
                  poster={m.miniatura ?? undefined}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt={`Imagem ${i + 1} de ${total}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          ))}
        </div>
        {total > 1 && (
          <>
            <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-white">
              {atual + 1}/{total}
            </span>
            {atual > 0 && (
              <button
                aria-label="Imagem anterior"
                onClick={() => ir(atual - 1)}
                className="toque absolute -left-5 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md md:flex"
              >
                <Seta dir="esq" />
              </button>
            )}
            {atual < total - 1 && (
              <button
                aria-label="Próxima imagem"
                onClick={() => ir(atual + 1)}
                className="toque absolute -right-5 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md md:flex"
              >
                <Seta dir="dir" />
              </button>
            )}
          </>
        )}
      </div>
      {total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden>
          {midias.map((m, i) => (
            <span key={m.url} className={`h-1.5 rounded-full transition-all ${i === atual ? "w-5 bg-ink" : "w-1.5 bg-ink/25"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PostDetalhe({ post, anterior, proximo, posicao, onFechar, onIr, onAprovar, onAjuste, onComentar, onAviso, ocupado, unico }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [comentario, setComentario] = useState("");
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anteriorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    botaoFechar.current?.focus();
    return () => {
      document.body.style.overflow = anteriorOverflow;
    };
  }, []);

  useEffect(() => {
    setComentario("");
    setCopiado(false);
    painel.current?.scrollTo({ top: 0 });
  }, [post.id]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (unico) return;
      if (e.key === "Escape") return onFechar();
      const alvo = e.target as HTMLElement;
      if (alvo.tagName === "TEXTAREA" || alvo.tagName === "INPUT") return;
      if (e.key === "ArrowLeft" && anterior) onIr(anterior.id);
      if (e.key === "ArrowRight" && proximo) onIr(proximo.id);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [anterior, proximo, onFechar, onIr]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(post.legenda);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      onAviso("Não consegui copiar. Selecione o texto e copie manualmente.");
    }
  };

  const aguardando = post.estado === "aguardando";
  const numero = post.numero ? String(post.numero).padStart(2, "0") : null;
  const rotuloNav = (p: Post | null, fallback: string) => (p?.numero ? `POST ${String(p.numero).padStart(2, "0")}` : fallback);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center md:p-10 ${unico ? "bg-soft" : "bg-ink/75"}`}
      onMouseDown={(e) => !unico && e.target === e.currentTarget && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={post.titulo}
        className="flex h-full w-full flex-col overflow-hidden bg-white md:h-auto md:max-h-[92vh] md:max-w-[1180px] md:rounded-[28px]"
      >
        {/* Barra superior */}
        <div className="flex items-center justify-between border-b border-line px-3 md:px-8">
          {unico ? (
            <div className="flex items-center gap-3 py-2">
              <LogoCirculo src={unico.logo} nome={unico.nome} tamanho={36} />
              <span className="font-display text-[15px] uppercase leading-none">{unico.nome}</span>
            </div>
          ) : (
            <button ref={botaoFechar} onClick={onFechar} className="toque rotulo flex items-center gap-2 !text-ink">
              <Seta dir="fechar" className="hidden md:block" />
              <Seta dir="esq" className="md:hidden" />
              <span className="hidden md:inline">Fechar</span>
              <span className="md:hidden">Feed</span>
            </button>
          )}
          {posicao && (
            <span className="rotulo md:hidden">
              Post {String(posicao.atual).padStart(2, "0")} de {posicao.total}
            </span>
          )}
          {unico ? (
            <p className="font-display text-[18px] leading-none text-brand">
              TRATO<sup className="text-[0.4em]">®</sup>
            </p>
          ) : (
          <div className="flex items-center md:gap-6">
            <button
              onClick={() => anterior && onIr(anterior.id)}
              disabled={!anterior}
              aria-label="Post anterior"
              className="toque rotulo flex items-center justify-center gap-1.5 !text-ink disabled:opacity-30"
            >
              <Seta dir="esq" />
              <span className="hidden md:inline">{rotuloNav(anterior, "Anterior")}</span>
            </button>
            <button
              onClick={() => proximo && onIr(proximo.id)}
              disabled={!proximo}
              aria-label="Próximo post"
              className="toque rotulo flex items-center justify-center gap-1.5 !text-ink disabled:opacity-30"
            >
              <span className="hidden md:inline">{rotuloNav(proximo, "Próximo")}</span>
              <Seta dir="dir" />
            </button>
          </div>
          )}
        </div>

        <div ref={painel} className="min-h-0 flex-1 overflow-y-auto md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:overflow-hidden">
          {/* Arte */}
          <div className="flex items-start justify-center bg-soft px-3 pb-5 pt-3 md:items-center md:px-12 md:py-10">
            <div className="w-full max-w-[460px]">
              <Carrossel key={post.id} midias={post.midias} />
            </div>
          </div>

          {/* Informações */}
          <div className={`px-5 pt-5 md:overflow-y-auto md:px-8 md:py-7 ${aguardando ? "pb-28 md:pb-8" : "pb-8"}`}>
            <p className="rotulo">
              {numero && <>Post {numero} · </>}
              {rotuloTipo(post)}
            </p>
            <h2 className="mt-2 text-[22px] leading-[1.15] md:text-[28px]">
              <TituloDuplo texto={post.titulo} />
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <Selo estado={post.estado} longo />
              <span className="text-[14px] text-mute">
                {post.estado === "no-ar" ? "Foi ao ar" : "Vai ao ar"} {diaSemanaEData(post.dataPublicacao)}
              </span>
            </div>

            {post.legenda && (
              <div className="mt-5 rounded-2xl bg-soft p-5">
                <div className="flex items-center justify-between">
                  <span className="rotulo">Legenda</span>
                  <button onClick={copiar} className="toque -my-2 rounded-full border border-ink/70 px-4 text-[13px]">
                    {copiado ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-line text-[16px] leading-relaxed">{post.legenda}</p>
              </div>
            )}

            {aguardando ? (
              <div className="mt-5 hidden gap-3 md:flex">
                <button onClick={onAprovar} disabled={ocupado} className="toque flex-1 rounded-full bg-black px-6 py-3.5 text-[16px] font-semibold text-white disabled:opacity-60">
                  {ocupado ? "Aprovando…" : "Aprovar post ↗"}
                </button>
                <button onClick={onAjuste} disabled={ocupado} className="toque flex-1 rounded-full border border-ink/70 px-6 py-3.5 text-[16px] disabled:opacity-60">
                  Pedir ajuste
                </button>
              </div>
            ) : (
              NOTA[post.estado] && <p className="mt-5 rounded-2xl border border-line px-5 py-4 text-[15px] text-mute">{NOTA[post.estado]}</p>
            )}

            {post.estado !== "no-ar" && (
              <div className="mt-6">
                <label htmlFor="comentario" className="rotulo">Comentário</label>
                <textarea
                  id="comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Escreva aqui o que você gostou ou o que precisa mudar"
                  rows={3}
                  className="mt-2 block w-full resize-y rounded-xl border border-line px-4 py-3 text-[16px] placeholder:text-mute/70"
                />
                <p className="mt-2 text-[13px] text-mute">Para pedir ajuste, conte o que precisa mudar.</p>
                <button
                  onClick={async () => {
                    if (await onComentar(comentario)) setComentario("");
                  }}
                  disabled={!comentario.trim() || ocupado}
                  className="toque mt-1 px-1 text-[15px] font-semibold text-brand disabled:opacity-40"
                >
                  Enviar comentário ↗
                </button>
              </div>
            )}

            <div className="mt-6 border-t border-line pt-5">
              <p className="rotulo">Conversa sobre este post</p>
              {post.conversa.length === 0 ? (
                <p className="mt-3 text-[15px] text-mute">Ainda não há mensagens neste post.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {post.conversa.map((m) => (
                    <li key={m.id} className="flex gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          m.autor === "equipe" ? "bg-brand text-white" : "bg-soft text-ink"
                        }`}
                      >
                        {m.autor === "equipe" ? "TR" : m.nome.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px]">
                          <span className="font-semibold">{m.nome}</span>
                          <span className="text-mute"> · {dataHora(m.data)}</span>
                        </p>
                        <p className="mt-0.5 whitespace-pre-line text-[15px] leading-snug">{m.texto}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Celular: botões presos no rodapé */}
        {aguardando && (
          <div className="flex gap-3 border-t border-line bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
            <button onClick={onAjuste} disabled={ocupado} className="toque flex-1 rounded-full border border-ink/70 py-3.5 text-[16px] disabled:opacity-60">
              Pedir ajuste
            </button>
            <button onClick={onAprovar} disabled={ocupado} className="toque flex-1 rounded-full bg-black py-3.5 text-[16px] font-semibold text-white disabled:opacity-60">
              {ocupado ? "Aprovando…" : "Aprovar ↗"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
