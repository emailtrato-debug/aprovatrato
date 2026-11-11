// Cadastro dos clientes do portal.
// Para adicionar um cliente: copie uma linha, troque nome, id da lista do ClickUp, logo
// (arquivo em public/logos) e gere um slug novo (nome + 6 caracteres aleatórios).
// Para remover: apague a linha. O link do cliente deixa de funcionar na hora.

export type Cliente = {
  /** Parte final do link: aprovetrato.com.br/c/<slug>. Difícil de adivinhar de propósito. */
  slug: string;
  nome: string;
  /** ID da lista do cliente dentro da pasta Social Media, no ClickUp. */
  listaId: string;
  /** Arquivo em public/logos */
  logo: string;
};

export const CLIENTES: Cliente[] = [
  { slug: "trato-fe56yh", nome: "Trato", listaId: "901327957067", logo: "/logos/trato.png" },
  { slug: "bliq-sjfhz6", nome: "Bliq", listaId: "901327467153", logo: "/logos/bliq.png" },
  { slug: "carriero-r2use4", nome: "Carriero", listaId: "901327469203", logo: "/logos/carriero.png" },
  { slug: "donata-q23axn", nome: "Donata", listaId: "901327469206", logo: "/logos/donata.png" },
  { slug: "aabb-tg68ja", nome: "AABB", listaId: "901327469218", logo: "/logos/aabb.png" },
  { slug: "ludicoz-jnbpzq", nome: "Ludicoz", listaId: "901327469258", logo: "/logos/ludicoz.png" },
  { slug: "montri-sc5wgn", nome: "Montri", listaId: "901327469268", logo: "/logos/montri.png" },
  { slug: "marplast-cksfxq", nome: "Marplast", listaId: "901327469284", logo: "/logos/marplast.png" },
  { slug: "conx-cst5i5", nome: "Conx", listaId: "901327469290", logo: "/logos/conx.png" },
];

/** Ícone do app (gerado a partir da logo por `npm run icones`): 180, 192 ou 512 px. */
export function iconeDe(c: Cliente, tamanho: 180 | 192 | 512): string {
  const base = c.logo.replace(/^\/logos\//, "").replace(/\.png$/, "");
  return `/icons/${base}-${tamanho}.png`;
}

export function clientePorSlug(slug: string): Cliente | undefined {
  return CLIENTES.find((c) => c.slug === slug);
}
