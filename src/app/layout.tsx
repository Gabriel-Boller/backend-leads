import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

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
    <html lang="pt-BR" className={`${manrope.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
