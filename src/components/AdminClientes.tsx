"use client";

import { useState } from "react";
import { listarPostsDoCliente, sair, type PostLink } from "@/app/admin/acoes";
import { diaMes } from "@/lib/datas";
import { LogoCirculo } from "./ui";

type Item = { slug: string; nome: string; logo: string; url: string };

export function AdminClientes({ clientes }: { clientes: Item[] }) {
  const [copiado, setCopiado] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [posts, setPosts] = useState<Record<string, PostLink[]>>({});

  const verPosts = async (c: Item) => {
    if (aberto === c.slug) return setAberto(null);
    setAberto(c.slug);
    setErro(null);
    setCarregando(true);
    try {
      const r = await listarPostsDoCliente(c.slug);
      if (r.ok) setPosts((p) => ({ ...p, [c.slug]: r.posts }));
      else setErro(r.erro);
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  };

  const copiarPost = async (c: Item, p: PostLink) => {
    const url = `${c.url}/p/${p.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(p.id);
      setTimeout(() => setCopiado((atual) => (atual === p.id ? null : atual)), 2000);
    } catch {
      window.prompt("Copie o link:", url);
    }
  };

  const copiar = async (c: Item) => {
    try {
      await navigator.clipboard.writeText(c.url);
      setCopiado(c.nome);
      setTimeout(() => setCopiado((atual) => (atual === c.nome ? null : atual)), 2000);
    } catch {
      window.prompt("Copie o link:", c.url);
    }
  };

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-line px-4 md:px-9">
        <p className="font-display py-4 text-[22px] leading-none text-brand md:text-[26px]">
          TRATO<sup className="text-[0.4em]">®</sup>
        </p>
        <div className="flex items-center gap-4">
          <p className="rotulo">Administração</p>
          <form action={sair}>
            <button className="toque rotulo !text-ink">Sair</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 md:pt-12">
        <h1 className="text-[26px] uppercase leading-tight md:text-[34px]">
          <span className="font-semibold">Portais</span> <span className="font-normal">dos clientes</span>
        </h1>
        <p className="mt-2 text-[15px] text-mute">
          Abra o portal para ver como o cliente vê, ou copie o link para enviar. Guarde esta página só com a equipe.
        </p>

        <ul className="mt-6 divide-y divide-line border-y border-line">
          {clientes.map((c) => (
            <li key={c.nome} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
              <LogoCirculo src={c.logo} nome={c.nome} tamanho={52} />
              <div className="min-w-0 flex-1 basis-40">
                <p className="text-[18px] font-semibold uppercase leading-tight">{c.nome}</p>
                <p className="mt-0.5 truncate text-[13px] text-mute">{c.url.replace(/^https?:\/\//, "")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => verPosts(c)} className="toque rounded-full border border-ink/70 px-4 text-[14px]">
                  {aberto === c.slug ? "Fechar posts" : "Links por post"}
                </button>
                <button onClick={() => copiar(c)} className="toque rounded-full border border-ink/70 px-4 text-[14px]">
                  {copiado === c.nome ? "Copiado" : "Copiar link"}
                </button>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="toque inline-flex items-center rounded-full bg-black px-5 text-[14px] font-semibold text-white"
                >
                  Abrir portal ↗
                </a>
              </div>
              {aberto === c.slug && (
                <div className="basis-full rounded-2xl bg-soft p-4">
                  {carregando && <p className="text-[14px] text-mute">Buscando posts no ClickUp…</p>}
                  {erro && <p className="text-[14px] text-brand">{erro}</p>}
                  {!carregando && !erro && (posts[c.slug] ?? []).length === 0 && (
                    <p className="text-[14px] text-mute">Nenhum post com data de publicação e status do portal.</p>
                  )}
                  <ul className="divide-y divide-line">
                    {(posts[c.slug] ?? []).map((p) => (
                      <li key={p.id} className="flex items-center gap-3 py-2.5">
                        <span className="w-12 shrink-0 text-[13px] font-semibold">{diaMes(p.dataPublicacao)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold">{p.titulo}</span>
                          <span className="block text-[12px] text-mute">
                            {[p.formato, p.estado === "aguardando" ? "Aguardando" : p.estado === "aprovado" ? "Aprovado" : "Em ajuste"].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <button onClick={() => copiarPost(c, p)} className="toque shrink-0 rounded-full border border-ink/70 bg-white px-3.5 text-[13px]">
                          {copiado === p.id ? "Copiado" : "Copiar link"}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[12px] text-mute">
                    Se o post ainda estiver sem a arte (#arte), o cliente vê um aviso de "ainda não disponível" até ela chegar.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
