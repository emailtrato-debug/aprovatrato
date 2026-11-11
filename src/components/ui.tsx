import type { EstadoPost, Post } from "@/lib/types";

export const ROTULO_SELO: Record<EstadoPost, string> = {
  aguardando: "Aguardando",
  aprovado: "Aprovado",
  ajuste: "Em ajuste",
  "no-ar": "No ar",
};

export const ROTULO_SELO_LONGO: Record<EstadoPost, string> = {
  aguardando: "Aguardando sua aprovação",
  aprovado: "Aprovado",
  ajuste: "Em ajuste",
  "no-ar": "No ar",
};

export const COR_PONTO: Record<EstadoPost, string> = {
  aguardando: "#0040f0",
  aprovado: "#1f7a4a",
  ajuste: "#c2410c",
  "no-ar": "#9a9a9a",
};

const ESTILO_SELO: Record<EstadoPost, string> = {
  aguardando: "bg-brand text-white ring-1 ring-white/70",
  aprovado: "bg-ok-bg text-ok-ink",
  ajuste: "bg-ajuste-bg text-ajuste-ink",
  "no-ar": "bg-white/90 text-mute",
};

export function Selo({ estado, longo = false }: { estado: EstadoPost; longo?: boolean }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold leading-tight ${ESTILO_SELO[estado]} ${
        longo ? "px-3 py-1 text-[13px]" : "px-2 py-[2px] text-[9px] md:px-2.5 md:py-[3px] md:text-[11px]"
      }`}
    >
      {longo ? ROTULO_SELO_LONGO[estado] : ROTULO_SELO[estado]}
    </span>
  );
}

/** Título em caixa alta: a primeira metade em Semibold, o resto mais leve. */
export function TituloDuplo({ texto, className = "" }: { texto: string; className?: string }) {
  const palavras = texto.split(/\s+/);
  const corte = Math.max(1, Math.ceil(palavras.length * 0.45));
  return (
    <span className={`uppercase ${className}`}>
      <span className="font-semibold">{palavras.slice(0, corte).join(" ")}</span>
      {palavras.length > corte && <span className="font-normal"> {palavras.slice(corte).join(" ")}</span>}
    </span>
  );
}

/** Logo do cliente em círculo: fundo branco, borda fina, a imagem inteira dentro do círculo. */
export function LogoCirculo({ src, nome, tamanho }: { src: string; nome: string; tamanho: number }) {
  return (
    // Padding em px (porcentagem num item flex seria calculada sobre a largura da tela, não do círculo).
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-white"
      style={{ width: tamanho, height: tamanho, padding: Math.round(tamanho * 0.05) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Logo ${nome}`} className="h-full w-full rounded-full object-cover" />
    </span>
  );
}

export function Seta({ dir, className = "" }: { dir: "esq" | "dir" | "fechar"; className?: string }) {
  const d = dir === "esq" ? "M10 3L5 8l5 5" : dir === "dir" ? "M6 3l5 5-5 5" : "M3 3l10 10M13 3L3 13";
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function rotuloTipo(p: Post): string {
  const partes: string[] = [];
  if (p.formato) {
    partes.push(p.midias.length > 1 && p.formato === "Carrossel" ? `${p.formato}, ${p.midias.length} imagens` : p.formato);
  }
  if (p.editoria) partes.push(p.editoria);
  return partes.join(" · ");
}

export const CORES_VAZIAS = ["#212322", "#0040f0", "#8a867e", "#e4e2da"];
export function corVazia(i: number) {
  return CORES_VAZIAS[i % CORES_VAZIAS.length];
}
export function textoSobre(cor: string) {
  return cor === "#e4e2da" ? "text-ink" : "text-white";
}
