import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter é a única tipografia do ecossistema (ver gestao-lojas-core/design-system/DESIGN.md).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// App multiusuário com dados sensíveis a permissão (sessão, loja, tarefas do dia) —
// nunca deve cachear/pré-renderizar página nenhuma.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checklist das Lojas",
  description: "Checklist de tarefas para gestão de lojas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
