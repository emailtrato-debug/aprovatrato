import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// O ClickUp passou a exigir o token da API para baixar anexos (sem ele, o navegador é mandado para a
// tela de login do ClickUp e a imagem fica quebrada). Por isso as mídias passam por /api/midia, que busca
// o arquivo com o token no servidor. O link é assinado (ADMIN_CHAVE): só serve o que o portal mesmo gerou,
// então a rota não vira um proxy aberto.

const HOST_ANEXOS = /^[a-z0-9-]+\.p\.clickup-attachments\.com$/i;

const chave = () => process.env.ADMIN_CHAVE ?? "";
const assinar = (url: string) => createHmac("sha256", chave()).update(`midia:${url}`).digest("hex");

function ehAnexoDoClickUp(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && HOST_ANEXOS.test(u.hostname);
  } catch {
    return false;
  }
}

/** Endereço que o navegador deve usar para uma mídia do ClickUp. Outros endereços ficam como estão. */
export function urlDaMidia<T extends string | null>(url: T): T | string {
  if (!url || !ehAnexoDoClickUp(url) || chave().length < 16) return url;
  return `/api/midia?u=${encodeURIComponent(url)}&s=${assinar(url)}`;
}

export function midiaAutorizada(url: string, assinatura: string): boolean {
  if (chave().length < 16 || !ehAnexoDoClickUp(url)) return false;
  const a = Buffer.from(assinatura);
  const b = Buffer.from(assinar(url));
  return a.length === b.length && timingSafeEqual(a, b);
}
