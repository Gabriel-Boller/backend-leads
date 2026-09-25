import { getUsuarioAtual } from "@/lib/auth";
import { podeAcessar, type AppChave } from "@/lib/apps";

// Cada aba da planilha Google Sheets e quais painéis dependem dela. O endereço base
// da planilha publicada fica só no servidor (env PLANILHA_PUB_URL) — nunca vai pro
// navegador, então quem só tem acesso ao site não descobre o link da planilha.
const ABAS: Record<string, { gid: string; usadaPor: AppChave[] }> = {
  compras: { gid: "897534124", usadaPor: ["compras", "dre", "fluxo-caixa"] },
  despesas: { gid: "459645239", usadaPor: ["despesas", "dre", "fluxo-caixa"] },
  faturamento: { gid: "1860505990", usadaPor: ["dre", "fluxo-caixa"] },
};

export async function GET(_req: Request, ctx: RouteContext<"/financeiro/dados/[aba]">) {
  const { aba } = await ctx.params;
  const info = ABAS[aba];
  if (!info) return new Response("Não encontrado", { status: 404 });

  const user = await getUsuarioAtual();
  if (!user) return new Response("Não autenticado", { status: 401 });
  if (!info.usadaPor.some((chave) => podeAcessar(user, chave))) {
    return new Response("Sem acesso", { status: 403 });
  }

  const base = process.env.PLANILHA_PUB_URL;
  if (!base) return new Response("PLANILHA_PUB_URL não configurada", { status: 500 });

  const url = `${base}?gid=${info.gid}&single=true&output=csv`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return new Response("Falha ao ler a planilha", { status: 502 });

  return new Response(await res.text(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
