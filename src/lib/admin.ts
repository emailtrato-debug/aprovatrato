import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Acesso da equipe à página /admin: senha (ADMIN_SENHA) + cookie assinado (chave ADMIN_CHAVE).

export const COOKIE_ADMIN = "admin";
export const DIAS_SESSAO = 7;

const assinar = (exp: number) => createHmac("sha256", process.env.ADMIN_CHAVE ?? "").update(String(exp)).digest("hex");

const igual = (a: string, b: string) => {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
};

export function configurado(): boolean {
  return (process.env.ADMIN_CHAVE ?? "").length >= 16 && (process.env.ADMIN_SENHA ?? "").length >= 10;
}

export function senhaCerta(tentativa: string): boolean {
  return configurado() && igual(tentativa, process.env.ADMIN_SENHA as string);
}

export function criarSessao(): string {
  const exp = Date.now() + DIAS_SESSAO * 24 * 60 * 60 * 1000;
  return `${exp}.${assinar(exp)}`;
}

export function sessaoValida(valor: string | undefined): boolean {
  if (!valor || !configurado()) return false;
  const [e, s] = valor.split(".");
  const exp = Number(e);
  if (!exp || exp < Date.now() || !s) return false;
  return igual(s, assinar(exp));
}
