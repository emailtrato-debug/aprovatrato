import { cookies, headers } from "next/headers";
import { AdminClientes } from "@/components/AdminClientes";
import { LoginAdmin } from "@/components/LoginAdmin";
import { COOKIE_ADMIN, sessaoValida } from "@/lib/admin";
import { CLIENTES } from "@/lib/clients";

// Página só da equipe Trato: pede senha e lista o portal de cada cliente.
export const dynamic = "force-dynamic";

export default async function Administracao() {
  const sessao = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!sessaoValida(sessao)) return <LoginAdmin />;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const clientes = CLIENTES.map((c) => ({ slug: c.slug, nome: c.nome, logo: c.logo, url: `${proto}://${host}/c/${c.slug}` }));
  return <AdminClientes clientes={clientes} />;
}
