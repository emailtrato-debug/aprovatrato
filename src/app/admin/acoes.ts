"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ADMIN, criarSessao, DIAS_SESSAO, senhaCerta, sessaoValida } from "@/lib/admin";
import { clientePorSlug } from "@/lib/clients";
import { postsParaEquipe } from "@/lib/posts";

const tentativas: number[] = [];

export async function entrar(_anterior: { erro?: string } | undefined, dados: FormData): Promise<{ erro?: string }> {
  // Freio: no máximo 10 tentativas por minuto (por instância do servidor).
  const agora = Date.now();
  while (tentativas.length && agora - tentativas[0] > 60_000) tentativas.shift();
  if (tentativas.length >= 10) return { erro: "Muitas tentativas. Espere um minuto." };
  tentativas.push(agora);

  const senha = String(dados.get("senha") ?? "").trim();
  if (!senhaCerta(senha)) {
    await new Promise((r) => setTimeout(r, 800));
    return { erro: "Senha incorreta." };
  }
  (await cookies()).set(COOKIE_ADMIN, criarSessao(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: DIAS_SESSAO * 24 * 60 * 60,
  });
  redirect("/admin");
}

export async function sair() {
  (await cookies()).delete({ name: COOKIE_ADMIN, path: "/admin" });
  redirect("/admin");
}

export type PostLink = { id: string; titulo: string; formato: string | null; dataPublicacao: string; estado: string };

/** Posts do cliente para a equipe copiar o link individual. Só com a sessão do admin. */
export async function listarPostsDoCliente(slug: string): Promise<{ ok: true; posts: PostLink[] } | { ok: false; erro: string }> {
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) return { ok: false, erro: "Sessão expirada. Entre de novo." };
  const cliente = clientePorSlug(slug);
  if (!cliente) return { ok: false, erro: "Cliente não encontrado." };
  try {
    return { ok: true, posts: await postsParaEquipe(cliente) };
  } catch {
    return { ok: false, erro: "Não consegui ler o ClickUp agora. Tente de novo." };
  }
}
