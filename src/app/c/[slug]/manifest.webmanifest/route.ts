import { clientePorSlug, iconeDe } from "@/lib/clients";

// Manifesto do "app" de cada cliente: ao instalar, o ícone abre direto a página dele.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = clientePorSlug(slug);
  if (!c) return new Response("não encontrado", { status: 404 });

  const manifesto = {
    name: "AprovaTrato",
    short_name: "AprovaTrato",
    description: "Aprove os posts do mês com a Trato.",
    lang: "pt-BR",
    start_url: `/c/${c.slug}`,
    scope: `/c/${c.slug}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: iconeDe(c, 192), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: iconeDe(c, 512), sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
  return new Response(JSON.stringify(manifesto), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" },
  });
}
