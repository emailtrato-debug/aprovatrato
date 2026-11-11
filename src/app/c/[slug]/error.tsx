"use client";

import { useEffect } from "react";

export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[portal] erro na página do cliente:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <p className="font-display text-2xl text-brand">TRATO®</p>
      <h1 className="mt-6 text-xl font-semibold uppercase">Não conseguimos carregar seus posts</h1>
      <p className="mt-3 text-mute">Foi um problema do nosso lado, não da sua conexão. Tente de novo em instantes.</p>
      <button onClick={reset} className="toque mt-6 self-start rounded-full bg-black px-6 py-3 font-semibold text-white">
        Tentar de novo ↗
      </button>
    </main>
  );
}
