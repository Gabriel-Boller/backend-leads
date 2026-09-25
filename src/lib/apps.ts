import type { UsuarioSessao } from "@/lib/auth";

export type AppChave = "checklist" | "compras" | "despesas" | "dre" | "fluxo-caixa";

export type AppInfo = {
  chave: AppChave;
  nome: string;
  descricao: string;
  href: string;
  icone: string;
};

// Todos os apps do ecossistema que abrem a partir do HUB (página inicial).
// Espelha a tabela App de gestao-lojas-core — quando ela estiver em produção, esta
// lista passa a vir do banco.
export const APPS: AppInfo[] = [
  {
    chave: "checklist",
    nome: "Checklist das Lojas",
    descricao: "Tarefas do dia, equipe e relatórios",
    href: "/app",
    icone: "✓",
  },
  {
    chave: "compras",
    nome: "Compras",
    descricao: "Livro de compras e ficha de insumos",
    href: "/financeiro/compras",
    icone: "🛒",
  },
  {
    chave: "despesas",
    nome: "Despesas",
    descricao: "Gestão de despesas",
    href: "/financeiro/despesas",
    icone: "💸",
  },
  {
    chave: "dre",
    nome: "DRE",
    descricao: "Demonstrativo de resultado",
    href: "/financeiro/dre",
    icone: "📊",
  },
  {
    chave: "fluxo-caixa",
    nome: "Fluxo de Caixa",
    descricao: "Entradas e saídas do caixa",
    href: "/financeiro/fluxo-caixa",
    icone: "💰",
  },
];

/**
 * Quais apps o usuário pode abrir. Por enquanto derivado do papel: o Dono vê tudo,
 * Líder e Colaborador só o Checklist. Quando UsuarioAppAcesso (gestao-lojas-core)
 * estiver em produção, esta função passa a consultar essa tabela — o resto do código
 * não muda.
 */
export function appsDoUsuario(user: UsuarioSessao): AppInfo[] {
  if (user.papel === "DONO") return APPS;
  return APPS.filter((a) => a.chave === "checklist");
}

export function podeAcessar(user: UsuarioSessao, chave: AppChave): boolean {
  return appsDoUsuario(user).some((a) => a.chave === chave);
}
