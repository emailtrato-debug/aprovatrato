import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const dewi = localFont({
  src: [
    { path: "../fonts/RFDewi-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/RFDewi-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/RFDewi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-dewi",
  display: "swap",
});

const dewiExpandida = localFont({
  src: [{ path: "../fonts/RFDewiExpanded-Black.woff2", weight: "900", style: "normal" }],
  variable: "--font-dewi-exp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aprovação de conteúdo · Trato",
  description: "Portal de aprovação de conteúdo da Trato.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${dewi.variable} ${dewiExpandida.variable}`}>
      <body>{children}</body>
    </html>
  );
}
