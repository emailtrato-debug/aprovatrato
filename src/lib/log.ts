import "server-only";
import { appendFile, mkdir } from "node:fs/promises";

// Registro de cada ação feita no portal: data, hora, cliente, post, ação, tipo de ajuste.
// Sempre vai para o log do servidor (Vercel guarda). Se UPSTASH_REDIS_REST_URL/TOKEN existirem,
// também vai para um banco gratuito (lista "portal:acoes"). Em desenvolvimento, grava em .data/.

export type EventoLog = {
  cliente: string;
  postId: string;
  postTitulo?: string;
  acao: "aprovar" | "aprovar-pendentes" | "pedir-ajuste" | "comentar" | "bloqueado";
  tiposAjuste?: string[];
  resultado: "ok" | "erro";
  detalhe?: string;
};

export async function registrar(evento: EventoLog): Promise<void> {
  const agora = new Date();
  const linha = {
    quando: agora.toISOString(),
    dataHora: agora.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    ...evento,
  };
  const json = JSON.stringify(linha);
  console.log(`[acao] ${json}`);

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const tk = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && tk) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" },
        body: JSON.stringify(["LPUSH", "portal:acoes", json]),
        cache: "no-store",
      });
    } catch (e) {
      console.error("[log] falha ao gravar no banco:", e instanceof Error ? e.message : e);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    try {
      await mkdir(".data", { recursive: true });
      await appendFile(".data/log-acoes.jsonl", json + "\n");
    } catch {
      /* ambiente somente leitura: tudo bem */
    }
  }
}
