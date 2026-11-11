import { notFound } from "next/navigation";
import { Portal } from "@/components/Portal";
import { dadosDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";

// Visual de teste com dados fictícios. Ex.: /demo?n=3  ou  /demo?n=14
export default async function Demo({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.HABILITAR_DEMO !== "1") notFound();
  const { n } = await searchParams;
  const dados = dadosDemo(Number(n ?? 5) || 5);
  return (
    <Portal
      slug="demo"
      demo
      cliente={{ nome: "Trato", logo: "/logos/trato.png" }}
      mes="2026-11"
      nomeMes="novembro"
      ano="2026"
      hrefAnterior={`?n=${n ?? 5}`}
      hrefProximo={`?n=${n ?? 5}`}
      posts={dados.posts}
      noAr={dados.noAr}
    />
  );
}
