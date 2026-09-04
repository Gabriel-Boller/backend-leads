import "server-only";
import { prisma } from "@/lib/db";
import { trabalhaNoDia, tarefaAplicaNoDia } from "@/lib/schedule";
import { isoDate } from "@/lib/dates";
import type { EscalaTipo, FrequenciaTipo } from "@prisma/client";

export type TarefaComAtribuicoes = {
  id: string;
  lojaId: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  requerFoto: boolean;
  link: string | null;
  ativo: boolean;
  createdAt: Date;
  frequenciaTipo: FrequenciaTipo;
  diasSemana: number[];
  diaDoMes: number | null;
  datasEspecificas: Date[];
  horarioInicio: string | null;
  horarioFim: string | null;
  atribuidoATodos: boolean;
  atribuicoes: { usuarioId: string; createdAt: Date }[];
};

export type UsuarioComEscala = {
  id: string;
  lojaId: string | null;
  createdAt: Date;
  escalaTipo: EscalaTipo;
  diasSemana: number[];
  escalaDataBase: Date | null;
};

export async function carregarTarefasAtivasDaLoja(lojaId: string): Promise<TarefaComAtribuicoes[]> {
  return prisma.tarefa.findMany({
    where: { lojaId, ativo: true },
    include: { atribuicoes: { select: { usuarioId: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export function tarefaAtribuidaA(tarefa: TarefaComAtribuicoes, usuarioId: string): boolean {
  if (tarefa.atribuidoATodos) return true;
  return tarefa.atribuicoes.some((a) => a.usuarioId === usuarioId);
}

/**
 * Data a partir da qual essa tarefa vale de verdade pra esse colaborador — o mais tarde
 * entre a criação da tarefa, o cadastro do colaborador e (se for atribuição específica)
 * o momento em que ele foi incluído na lista. Antes disso não é pendência: a pessoa/
 * atribuição simplesmente não existia ainda.
 */
export function inicioValidoParaUsuario(tarefa: TarefaComAtribuicoes, usuario: { id: string; createdAt: Date }): Date {
  const candidatos = [tarefa.createdAt, usuario.createdAt];
  if (!tarefa.atribuidoATodos) {
    const atrib = tarefa.atribuicoes.find((a) => a.usuarioId === usuario.id);
    if (atrib) candidatos.push(atrib.createdAt);
  }
  return new Date(Math.max(...candidatos.map((d) => d.getTime())));
}

/** Tarefas que deveriam aparecer para esse usuário num dia específico (escala + recorrência + atribuição + já existiam nessa data). */
export function tarefasEsperadasParaUsuario(
  usuario: UsuarioComEscala,
  date: Date,
  tarefasDaLoja: TarefaComAtribuicoes[]
): TarefaComAtribuicoes[] {
  if (!trabalhaNoDia(usuario, date)) return [];
  const iso = isoDate(date);
  return tarefasDaLoja.filter(
    (t) =>
      t.ativo &&
      tarefaAplicaNoDia(t, date) &&
      tarefaAtribuidaA(t, usuario.id) &&
      iso >= isoDate(inicioValidoParaUsuario(t, usuario))
  );
}
