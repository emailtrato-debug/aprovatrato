"use client";

import { useEffect, useRef, useState } from "react";
import type { Post } from "@/lib/types";
import { SetaDiagonal } from "./ui";

const TIPOS = ["Arte", "Legenda", "Data"] as const;

type Props = {
  post: Post;
  ocupado: boolean;
  erro: string | null;
  onEnviar: (tipos: string[], texto: string) => void;
  onCancelar: () => void;
};

/** Gaveta que sobe de baixo no celular; janela centralizada no computador. */
export function AjusteSheet({ post, ocupado, erro, onEnviar, onCancelar }: Props) {
  const [tipos, setTipos] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const [tentou, setTentou] = useState(false);
  const campo = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    campo.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && !ocupado && onCancelar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCancelar, ocupado]);

  const alternar = (t: string) => setTipos((atual) => (atual.includes(t) ? atual.filter((x) => x !== t) : [...atual, t]));
  const semTipo = tentou && tipos.length === 0;
  const semTexto = tentou && !texto.trim();

  const enviar = () => {
    setTentou(true);
    if (tipos.length === 0 || !texto.trim()) return;
    onEnviar(tipos, texto);
  };

  return (
    <div
      className="fundo-entra fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 md:items-center md:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && !ocupado && onCancelar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ajuste-titulo"
        className="gaveta-entra max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 md:max-w-[480px] md:rounded-3xl md:px-7 md:pb-7 md:pt-7"
      >
        <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-line md:hidden" aria-hidden />
        <p className="rotulo">
          {post.numero ? `Post ${String(post.numero).padStart(2, "0")}` : "Post"}
          {post.formato && ` · ${post.formato}`}
        </p>
        <h2 id="ajuste-titulo" className="mt-1 text-[24px] font-semibold uppercase leading-tight">
          O que precisa mudar?
        </h2>

        <fieldset className="mt-5">
          <legend className="rotulo">O ajuste é na</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIPOS.map((t) => {
              const marcado = tipos.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  role="checkbox"
                  aria-checked={marcado}
                  onClick={() => alternar(t)}
                  className={`toque flex items-center gap-2 rounded-full border px-4 text-[16px] transition-colors duration-200 ${
                    marcado ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white text-ink hover:border-ink/60"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-[4px] border text-[11px] ${
                      marcado ? "border-brand bg-brand text-white" : "border-mute/50"
                    }`}
                    aria-hidden
                  >
                    {marcado && "✓"}
                  </span>
                  {t}
                </button>
              );
            })}
          </div>
          {semTipo && <p className="mt-2 text-[14px] text-ajuste-ink">Marque pelo menos uma opção.</p>}
        </fieldset>

        <label htmlFor="ajuste-texto" className="rotulo mt-5 block">
          Seu comentário (obrigatório)
        </label>
        <textarea
          id="ajuste-texto"
          ref={campo}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Conte com detalhes o que você quer mudar"
          className={`mt-2 block w-full resize-none rounded-xl border px-4 py-3 text-[17px] transition-colors duration-200 placeholder:text-mute/70 ${
            semTexto ? "border-ajuste-ink" : "border-line hover:border-ink/40 focus:border-brand"
          }`}
        />
        {semTexto && <p className="mt-2 text-[14px] text-ajuste-ink">Escreva o que precisa mudar.</p>}
        <p className="mt-2 text-[13px] text-mute">A equipe da Trato recebe seu pedido na hora e te avisa quando a nova versão estiver aqui.</p>

        {erro && (
          <p role="alert" className="mt-3 rounded-xl bg-ajuste-bg px-4 py-3 text-[14px] text-ajuste-ink">
            {erro}
          </p>
        )}

        <button
          onClick={enviar}
          disabled={ocupado}
          className="toque btn-solido grupo mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black py-3.5 text-[17px] font-semibold text-white disabled:opacity-60"
        >
          {ocupado ? "Enviando…" : <>Enviar pedido de ajuste <SetaDiagonal /></>}
        </button>
        <button onClick={onCancelar} disabled={ocupado} className="toque mt-1 w-full py-3 text-[16px] transition-colors duration-200 hover:text-brand disabled:opacity-60">
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function ConfirmaAprovacao({
  quantidade, ocupado, erro, onConfirmar, onCancelar,
}: { quantidade: number; ocupado: boolean; erro: string | null; onConfirmar: () => void; onCancelar: () => void }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && !ocupado && onCancelar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCancelar, ocupado]);

  return (
    <div
      className="fundo-entra fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 md:items-center md:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && !ocupado && onCancelar()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirma-titulo"
        className="gaveta-entra w-full rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 md:max-w-[440px] md:rounded-3xl md:px-7 md:pb-7 md:pt-7"
      >
        <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-line md:hidden" aria-hidden />
        <h2 id="confirma-titulo" className="text-[22px] font-semibold uppercase leading-tight">
          {quantidade === 1 ? "Aprovar o post pendente?" : `Aprovar os ${quantidade} posts pendentes?`}
        </h2>
        <p className="mt-3 text-[16px] text-mute">
          Confira a legenda e a arte de cada um antes de continuar. Se mudar de ideia depois, você pode voltar o post para aprovação ou pedir um ajuste.
        </p>
        {erro && (
          <p role="alert" className="mt-3 rounded-xl bg-ajuste-bg px-4 py-3 text-[14px] text-ajuste-ink">
            {erro}
          </p>
        )}
        <button onClick={onConfirmar} disabled={ocupado} className="toque btn-solido grupo mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black py-3.5 text-[17px] font-semibold text-white disabled:opacity-60">
          {ocupado ? "Aprovando…" : <>{quantidade === 1 ? "Aprovar" : `Aprovar ${quantidade} posts`} <SetaDiagonal /></>}
        </button>
        <button onClick={onCancelar} disabled={ocupado} className="toque mt-1 w-full py-3 text-[16px] transition-colors duration-200 hover:text-brand disabled:opacity-60">
          Cancelar
        </button>
      </div>
    </div>
  );
}
