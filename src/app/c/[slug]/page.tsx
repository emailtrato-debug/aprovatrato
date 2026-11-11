import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Portal } from "@/components/Portal";
import { clientePorSlug, iconeDe } from "@/lib/clients";
import { mesAtual, mesValido, mesVizinho, nomeMes } from "@/lib/datas";
import { carregarMes } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = clientePorSlug(slug);
  if (!c) return {};
  return {
    title: `${c.nome} · Aprovação de conteúdo`,
    manifest: `/c/${c.slug}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: "AprovaTrato", statusBarStyle: "default" },
    icons: { icon: iconeDe(c, 192), apple: iconeDe(c, 180) },
  };
}

export default async function PaginaCliente({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { slug } = await params;
  const cliente = clientePorSlug(slug);
  if (!cliente) notFound();

  const { mes: mesParam } = await searchParams;
  const mes = mesValido(mesParam) ? mesParam : mesAtual();
  const dados = await carregarMes(cliente, mes);

  return (
    <Portal
      slug={cliente.slug}
      cliente={{ nome: cliente.nome, logo: cliente.logo }}
      mes={mes}
      nomeMes={nomeMes(mes)}
      ano={mes.slice(0, 4)}
      hrefAnterior={`?mes=${mesVizinho(mes, -1)}`}
      hrefProximo={`?mes=${mesVizinho(mes, 1)}`}
      posts={dados.posts}
      noAr={dados.noAr}
    />
  );
}
