import { readFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";
import { podeAcessar, type AppChave } from "@/lib/apps";

// Os 4 painéis financeiros (vindos do repositório CLOUD) são HTML estático. Ficam em
// src/financeiro — fora de public/ — pra só serem entregues depois de checar login e
// acesso. Os arquivos entram no deploy via outputFileTracingIncludes (next.config.ts).
const PAINEIS: Record<string, AppChave> = {
  compras: "compras",
  despesas: "despesas",
  dre: "dre",
  "fluxo-caixa": "fluxo-caixa",
};

export async function GET(_req: Request, ctx: RouteContext<"/financeiro/[painel]">) {
  const { painel } = await ctx.params;
  const chave = PAINEIS[painel];
  if (!chave) return new Response("Página não encontrada", { status: 404 });

  const user = await getUsuarioAtual();
  if (!user) redirect("/login");
  if (!podeAcessar(user, chave)) redirect("/");

  const html = await readFile(path.join(process.cwd(), "src", "financeiro", `${painel}.html`), "utf-8");
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
