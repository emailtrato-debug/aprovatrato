"use client";

import { useEffect, useState } from "react";

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const CHAVE = "portal-instalar-dispensado";
const SEMANA = 7 * 24 * 60 * 60 * 1000;

type Plataforma = "ios" | "ios-app" | "android" | "outro";

function detectar(): Plataforma {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) {
    // Navegadores dentro do Instagram, WhatsApp etc. não conseguem adicionar à tela inicial.
    return /FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|TikTok|CriOS|FxiOS|EdgiOS/i.test(ua) ? "ios-app" : "ios";
  }
  return /Android/i.test(ua) ? "android" : "outro";
}

/** Faixa (só no celular) que ajuda a colocar o portal na tela inicial, como um aplicativo. */
export function InstalarApp({ nomeCliente }: { nomeCliente: string }) {
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [oculto, setOculto] = useState(true);
  const [ajuda, setAjuda] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

    const instalado = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    const dispensado = Number(localStorage.getItem(CHAVE) ?? 0) > Date.now() - SEMANA;
    const p = detectar();
    setPlataforma(p);
    setOculto(Boolean(instalado) || dispensado || p === "outro");

    const antes = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
    };
    const depois = () => setOculto(true);
    window.addEventListener("beforeinstallprompt", antes);
    window.addEventListener("appinstalled", depois);
    return () => {
      window.removeEventListener("beforeinstallprompt", antes);
      window.removeEventListener("appinstalled", depois);
    };
  }, []);

  if (oculto || !plataforma) return null;

  const dispensar = () => {
    localStorage.setItem(CHAVE, String(Date.now()));
    setOculto(true);
  };

  const instalar = async () => {
    if (evento) {
      await evento.prompt();
      const r = await evento.userChoice;
      if (r.outcome === "accepted") setOculto(true);
      setEvento(null);
    } else {
      setAjuda(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-line bg-soft px-4 py-2.5 md:hidden">
        <p className="min-w-0 flex-1 text-[13px] leading-snug">
          Coloque o portal da {nomeCliente} na tela inicial e abra como um aplicativo.
        </p>
        <button onClick={instalar} className="toque shrink-0 rounded-full bg-black px-4 text-[14px] font-semibold text-white">
          Instalar
        </button>
        <button onClick={dispensar} aria-label="Dispensar" className="toque -mr-2 flex shrink-0 items-center justify-center text-mute">
          ✕
        </button>
      </div>

      {ajuda && (
        <div className="fixed inset-0 z-[70] flex items-end bg-ink/60" onMouseDown={(e) => e.target === e.currentTarget && setAjuda(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="inst-titulo" className="w-full rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
            <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-line" aria-hidden />
            <h2 id="inst-titulo" className="text-[22px] font-semibold uppercase leading-tight">Instalar no celular</h2>
            {plataforma === "ios-app" ? (
              <p className="mt-3 text-[16px] leading-relaxed">
                Este navegador não deixa adicionar à tela inicial. Abra o link no <strong>Safari</strong> (no menu, toque em
                &quot;Abrir no Safari&quot; ou copie o endereço e cole no Safari) e tente de novo.
              </p>
            ) : plataforma === "ios" ? (
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-[16px] leading-relaxed">
                <li>Toque no botão <strong>Compartilhar</strong> (o quadrado com uma seta para cima, na barra do Safari).</li>
                <li>Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.</li>
                <li>Toque em <strong>Adicionar</strong>. O ícone da {nomeCliente} aparece na sua tela inicial.</li>
              </ol>
            ) : (
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-[16px] leading-relaxed">
                <li>Toque no menu <strong>⋮</strong> do Chrome (canto superior direito).</li>
                <li>Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
                <li>Confirme. O ícone da {nomeCliente} aparece na sua tela inicial.</li>
              </ol>
            )}
            <button onClick={() => setAjuda(false)} className="toque mt-5 w-full rounded-full bg-black py-3.5 text-[17px] font-semibold text-white">
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
