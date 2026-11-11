import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Portal } from "@/components/Portal";
import { clientePorSlug } from "@/lib/clients";
import { mesAtual, nomeMes } from "@/lib/datas";
import { carregarPost } from "@/lib/posts";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string; taskId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const c = clientePorSlug((await params).slug);
  return c ? { title: `${c.nome} · Aprovação de post`, robots: { index: false, follow: false } } : {};
}

// Link individual: o cliente vê só este post, sem o resto do mês.
export default async function PaginaPost({ params }: Params) {
  const { slug, taskId } = await params;
  const cliente = clientePorSlug(slug);
  if (!cliente || !/^[a-z0-9]{6,20}$/i.test(taskId)) notFound();

  const post = await carregarPost(cliente, taskId);
  if (!post) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-[26px] text-brand">TRATO<sup className="text-[0.4em]">®</sup></p>
        <h1 className="mt-6 text-[22px] font-semibold uppercase">Este post ainda não está disponível</h1>
        <p className="mt-3 text-[15px] text-mute">
          A equipe da Trato ainda está finalizando a arte. Assim que ela chegar, este mesmo link passa a mostrar o post para você aprovar.
        </p>
      </main>
    );
  }

  const mes = post.dataPublicacao.slice(0, 7) || mesAtual();
  return (
    <Portal
      unico
      slug={cliente.slug}
      cliente={{ nome: cliente.nome, logo: cliente.logo }}
      mes={mes}
      nomeMes={nomeMes(mes)}
      ano={mes.slice(0, 4)}
      hrefAnterior=""
      hrefProximo=""
      posts={[post]}
      noAr={[]}
    />
  );
}
