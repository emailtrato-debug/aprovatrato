import { midiaAutorizada } from "@/lib/midia";

// Entrega ao navegador uma imagem ou vídeo anexado no ClickUp, buscando com o token no servidor.
// Repassa o cabeçalho Range para o vídeo poder avançar e carregar aos poucos (iPhone exige).

export const dynamic = "force-dynamic";

const REPASSAR = ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"];

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const url = p.get("u") ?? "";
  if (!midiaAutorizada(url, p.get("s") ?? "")) return new Response("não autorizado", { status: 403 });

  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) return new Response("não configurado", { status: 503 });

  const pedido: Record<string, string> = { Authorization: token };
  const range = req.headers.get("range");
  if (range) pedido.Range = range;

  // redirect "manual": nunca mandar o token para outro endereço.
  const res = await fetch(url, { headers: pedido, redirect: "manual", cache: "no-store" });
  if (res.status !== 200 && res.status !== 206) return new Response("mídia indisponível", { status: res.status === 404 ? 404 : 502 });

  const tipo = res.headers.get("content-type") ?? "";
  if (!/^(image|video)\//i.test(tipo)) return new Response("tipo não permitido", { status: 415 });

  const saida = new Headers();
  for (const h of REPASSAR) {
    const v = res.headers.get(h);
    if (v) saida.set(h, v);
  }
  saida.set("Cache-Control", "public, max-age=86400");
  saida.set("X-Content-Type-Options", "nosniff");
  saida.set("Content-Security-Policy", "default-src 'none'; sandbox");
  return new Response(res.body, { status: res.status, headers: saida });
}
