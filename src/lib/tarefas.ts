import "server-only";
import { prisma } from "@/lib/db";
import { trabalhaNoDia, tarefaAplicaNoDia } from "@/lib/schedule";
import type { EscalaTipo, FrequenciaTipo } from "@prisma/client";

export type TarefaComAtribuicoes = {
  id: string;
  lojaId: string;
  titulo: string;
  descricao: string | null;
  requerFoto: boolean;
  ativo: boolean;
  frequenciaTipo: FrequenciaTipo;
  diasSemana: number[];
  diaDoMes: number | null;
  atribuidoATodos: boolean;
  atribuicoes: { usuarioId: string }[];
};

export type UsuarioComEscala = {
  id: string;
  lojaId: string | null;
  escalaTipo: EscalaTipo;
  diasSemana: number[];
  escalaDataBase: Date | null;
};

export async function carregarTarefasAtivasDaLoja(lojaId: string): Promise<TarefaComAtribuicoes[]> {
  return prisma.tarefa.findMany({
    where: { lojaId, ativo: true },
    include: { atribuicoes: { select: { usuarioId: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export function tarefaAtribuidaA(tarefa: TarefaComAtribuicoes, usuarioId: string): boolean {
  if (tarefa.atribuidoATodos) return true;
  return tarefa.atribuicoes.some((a) => a.usuarioId === usuarioId);
}

/** Tarefas que deveriam aparecer para esse usuário num dia específico (escala + recorrência + atribuição). */
export function tarefasEsperadasParaUsuario(
  usuario: UsuarioComEscala,
  date: Date,
  tarefasDaLoja: TarefaComAtribuicoes[]
): TarefaComAtribuicoes[] {
  if (!trabalhaNoDia(usuario, date)) return [];
  return tarefasDaLoja.filter(
    (t) => t.ativo && tarefaAplicaNoDia(t, date) && tarefaAtribuidaA(t, usuario.id)
  );
}
