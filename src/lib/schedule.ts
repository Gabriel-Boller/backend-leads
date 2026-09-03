import { diffDays, isoDate } from "@/lib/dates";
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
  datasEspecificas: Date[];
};

/** Regra de recorrência: a tarefa cai no dia `date`? */
export function tarefaAplicaNoDia(tarefa: TarefaRecorrencia, date: Date): boolean {
  if (tarefa.frequenciaTipo === "DIARIA") return true;
  if (tarefa.frequenciaTipo === "SEMANAL") return tarefa.diasSemana.includes(date.getDay());
  if (tarefa.frequenciaTipo === "MENSAL") return date.getDate() === tarefa.diaDoMes;
  if (tarefa.frequenciaTipo === "PERSONALIZADA") {
    const iso = isoDate(date);
    return tarefa.datasEspecificas.some((d) => isoDate(d) === iso);
  }
  return false;
}

export function freqLabel(tarefa: TarefaRecorrencia): string {
  if (tarefa.frequenciaTipo === "DIARIA") return "Todos os dias";
  if (tarefa.frequenciaTipo === "SEMANAL") {
    return "Semanal · " + tarefa.diasSemana.map((d) => DIAS[d]).join(", ");
  }
  if (tarefa.frequenciaTipo === "MENSAL") return "Mensal · dia " + tarefa.diaDoMes;
  return `Datas específicas · ${tarefa.datasEspecificas.length} data(s)`;
}

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type TarefaHorario = { horarioInicio: string | null; horarioFim: string | null };

export function horarioLabel(tarefa: TarefaHorario): string | null {
  if (!tarefa.horarioInicio && !tarefa.horarioFim) return null;
  if (tarefa.horarioInicio && tarefa.horarioFim) return `${tarefa.horarioInicio} às ${tarefa.horarioFim}`;
  return `até ${tarefa.horarioInicio || tarefa.horarioFim}`;
}

/** Uma tarefa de hoje só vira "atrasada" depois do horário-fim configurado (antes disso, ainda está no prazo). */
export function tarefaAtrasadaAgora(tarefa: TarefaHorario, agora: Date): boolean {
  if (!tarefa.horarioFim) return false;
  const [h, m] = tarefa.horarioFim.split(":").map(Number);
  const limite = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), h, m);
  return agora > limite;
}

export type EstadoTarefa = "neutra" | "na_hora" | "atrasada";

/**
 * Estado visual de uma tarefa agora: sem horário definido é sempre "neutra";
 * com horário, fica "neutra" antes do início, "na_hora" durante a janela
 * (ou o dia todo até o fim, se não tiver início definido) e "atrasada" depois do fim.
 */
export function estadoTarefaAgora(tarefa: TarefaHorario, agora: Date): EstadoTarefa {
  if (!tarefa.horarioInicio && !tarefa.horarioFim) return "neutra";
  if (tarefaAtrasadaAgora(tarefa, agora)) return "atrasada";
  if (tarefa.horarioInicio) {
    const [h, m] = tarefa.horarioInicio.split(":").map(Number);
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), h, m);
    if (agora < inicio) return "neutra";
  }
  return "na_hora";
}

export function escalaLabel(u: UsuarioEscala): string {
  if (u.escalaTipo === "DIAS_SEMANA") return u.diasSemana.map((d) => DIAS[d]).join(", ") || "Nenhum dia definido";
  if (u.escalaTipo === "DOZE_POR_TRINTA_SEIS") {
    return "12x36" + (u.escalaDataBase ? ` (desde ${u.escalaDataBase.toLocaleDateString("pt-BR")})` : "");
  }
  return "Todos os dias";
}
