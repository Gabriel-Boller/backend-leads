import { diffDays } from "@/lib/dates";
import type { EscalaTipo, FrequenciaTipo } from "@prisma/client";

type UsuarioEscala = {
  escalaTipo: EscalaTipo;
  diasSemana: number[];
  escalaDataBase: Date | null;
};

/** Regra de escala: o colaborador está escalado para trabalhar no dia `date`? */
export function trabalhaNoDia(usuario: UsuarioEscala, date: Date): boolean {
  if (usuario.escalaTipo === "DIAS_SEMANA") {
    return usuario.diasSemana.includes(date.getDay());
  }
  if (usuario.escalaTipo === "DOZE_POR_TRINTA_SEIS") {
    if (!usuario.escalaDataBase) return true;
    const diff = diffDays(date, usuario.escalaDataBase);
    return ((diff % 2) + 2) % 2 === 0;
  }
  return true; // TODOS
}

type TarefaRecorrencia = {
  frequenciaTipo: FrequenciaTipo;
  diasSemana: number[];
  diaDoMes: number | null;
};

/** Regra de recorrência: a tarefa cai no dia `date`? */
export function tarefaAplicaNoDia(tarefa: TarefaRecorrencia, date: Date): boolean {
  if (tarefa.frequenciaTipo === "DIARIA") return true;
  if (tarefa.frequenciaTipo === "SEMANAL") return tarefa.diasSemana.includes(date.getDay());
  if (tarefa.frequenciaTipo === "MENSAL") return date.getDate() === tarefa.diaDoMes;
  return false;
}

export function freqLabel(tarefa: TarefaRecorrencia): string {
  if (tarefa.frequenciaTipo === "DIARIA") return "Todos os dias";
  if (tarefa.frequenciaTipo === "SEMANAL") {
    return "Semanal · " + tarefa.diasSemana.map((d) => DIAS[d]).join(", ");
  }
  return "Mensal · dia " + tarefa.diaDoMes;
}

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function escalaLabel(u: UsuarioEscala): string {
  if (u.escalaTipo === "DIAS_SEMANA") return u.diasSemana.map((d) => DIAS[d]).join(", ") || "Nenhum dia definido";
  if (u.escalaTipo === "DOZE_POR_TRINTA_SEIS") {
    return "12x36" + (u.escalaDataBase ? ` (desde ${u.escalaDataBase.toLocaleDateString("pt-BR")})` : "");
  }
  return "Todos os dias";
}
