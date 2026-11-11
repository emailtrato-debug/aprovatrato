// Dados de mentira para conferir o visual sem depender do ClickUp.
// A rota /demo só existe fora de produção (ou com HABILITAR_DEMO=1).
import type { DadosMes, Post } from "./types";

const FUNDOS = ["#212322", "#0040f0", "#8a867e", "#e4e2da"];

function slide(titulo: string, linha: string, i: number): string {
  const fundo = FUNDOS[i % FUNDOS.length];
  const tinta = fundo === "#e4e2da" ? "#212322" : "#ffffff";
  const palavras = titulo.toUpperCase().split(" ");
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    if ((atual + " " + p).trim().length > 18) { linhas.push(atual); atual = p; } else atual = (atual + " " + p).trim();
  }
  linhas.push(atual);
  const texto = linhas
    .map((l, k) => `<text x="80" y="${1010 - (linhas.length - 1 - k) * 78}" font-family="Helvetica,Arial" font-weight="700" font-size="66" fill="${tinta}">${l}</text>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${fundo}"/><text x="80" y="${1010 - linhas.length * 78 - 10}" font-family="Helvetica,Arial" font-size="30" letter-spacing="5" fill="${tinta}" opacity=".75">${linha.toUpperCase()}</text>${texto}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const MES = [
  ["O que muda no planejamento de 2027", "Autoridade", "Carrossel", 7],
  ["5 sinais de que seu post não fala com o seu cliente", "Autoridade", "Carrossel", 7],
  ["Um dia de pauta na Trato", "Bastidores", "Reels", 1],
  ["Antes e depois de um feed", "Cases", "Estático", 1],
  ["Novembro chegou", "Cultura", "Estático", 1],
  ["Três erros na legenda", "Dicas", "Estático", 1],
  ["Como escolher a pauta da semana", "Dicas", "Carrossel", 5],
  ["Quem aprova o quê", "Cultura", "Reels", 1],
  ["Metas que cabem no calendário", "Autoridade", "Carrossel", 6],
  ["Bastidor de uma gravação", "Bastidores", "Reels", 1],
  ["O feed é uma vitrine", "Autoridade", "Estático", 1],
  ["Case: de 3 para 12 posts", "Cases", "Carrossel", 8],
  ["Calendário de dezembro", "Cultura", "Estático", 1],
  ["Retrospectiva do ano", "Cultura", "Carrossel", 9],
] as const;

const NO_AR = [
  ["Dicas · Como aprovar conteúdo sem travar a semana", "Dicas", "Carrossel"],
  ["Quem faz a Trato", "Cultura", "Reels"],
  ["Por que postamos 3 vezes por semana, e não 7", "Autoridade", "Estático"],
  ["Como organizamos 9 marcas no mesmo mês", "Cases", "Carrossel"],
  ["Da copy ao layout em 60 segundos", "Bastidores", "Reels"],
  ["3 jeitos de abrir uma legenda", "Dicas", "Estático"],
  ["Reunião mensal em 1 minuto", "Bastidores", "Reels"],
  ["O que é um bom briefing", "Dicas", "Carrossel"],
  ["Nosso time em 2026", "Cultura", "Estático"],
] as const;

const LEGENDA =
  "Você posta toda semana, o post tem curtida, mas ninguém pergunta preço nem manda mensagem? Pode ser que o conteúdo esteja certo pro algoritmo e errado pra quem compra de você.\n\nSeparamos os 5 sinais que a gente confere antes de aprovar qualquer pauta aqui na Trato.\n\nSalva pra usar na revisão do seu próximo post.";

const ESTADOS = ["aguardando", "aguardando", "aguardando", "ajuste", "aprovado"] as const;

export function dadosDemo(n: number): DadosMes {
  const total = Math.max(0, Math.min(n, MES.length));
  const posts: Post[] = [];
  for (let k = 0; k < total; k++) {
    const [titulo, editoria, formato, slides] = MES[k];
    const estado = total === 5 ? ESTADOS[k] : k % 5 === 3 ? "ajuste" : k % 5 === 4 ? "aprovado" : "aguardando";
    posts.push({
      id: `demo-${k}`,
      numero: total - k,
      titulo, editoria, formato, estado,
      dataPublicacao: `2026-11-${String(28 - k * 2 > 0 ? 28 - k * 2 : 1 + k).padStart(2, "0")}`,
      legenda: LEGENDA,
      midias: Array.from({ length: slides }, (_, s) => ({
        tipo: "imagem" as const,
        url: slide(s === 0 ? titulo : `Sinal ${s}`, `${editoria} · ${formato}`, k + s),
        miniatura: null,
      })).map((m) => ({ ...m, miniatura: m.url })),
      conversa:
        k === 1
          ? [{ id: "c1", autor: "equipe", nome: "Equipe Trato", data: "2026-11-04T16:20:00-03:00", texto: "Arte e legenda prontas. Se quiser trocar a ordem dos slides, é só comentar aqui." }]
          : [],
    });
  }
  const noAr: Post[] = NO_AR.map(([titulo, editoria, formato], k) => ({
    id: `demo-noar-${k}`,
    numero: null,
    titulo, editoria, formato,
    estado: "no-ar" as const,
    dataPublicacao: `2026-10-${String(30 - k * 3).padStart(2, "0")}`,
    legenda: LEGENDA,
    midias: [],
    conversa: [],
  }));
  return { posts, noAr };
}
