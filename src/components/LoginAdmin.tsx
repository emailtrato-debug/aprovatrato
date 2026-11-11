"use client";

import { useActionState } from "react";
import { entrar } from "@/app/admin/acoes";

export function LoginAdmin() {
  const [estado, acao, pendente] = useActionState(entrar, undefined);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <p className="font-display text-2xl text-brand">
        TRATO<sup className="text-[0.4em]">®</sup>
      </p>
      <h1 className="mt-6 text-xl font-semibold uppercase">Administração</h1>
      <p className="mt-2 text-mute">Área da equipe. Digite a senha para ver os portais dos clientes.</p>
      <form action={acao} className="mt-6">
        <label htmlFor="senha" className="rotulo">Senha</label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="mt-2 block w-full rounded-xl border border-line px-4 py-3 text-[17px] focus:border-brand"
        />
        {estado?.erro && (
          <p role="alert" className="mt-3 rounded-xl bg-ajuste-bg px-4 py-3 text-[14px] text-ajuste-ink">
            {estado.erro}
          </p>
        )}
        <button disabled={pendente} className="toque mt-5 w-full rounded-full bg-black py-3.5 text-[17px] font-semibold text-white disabled:opacity-60">
          {pendente ? "Entrando…" : "Entrar ↗"}
        </button>
      </form>
    </main>
  );
}
