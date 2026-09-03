import "server-only";
import { prisma } from "@/lib/db";
import { isoDate, fromIsoDate, diffDays } from "@/lib/dates";
import { carregarTarefasAtivasDaLoja, tarefasEsperadasParaUsuario } from "@/lib/tarefas";
import { tarefaAtrasadaAgora } from "@/lib/schedule";

export type Pendencia = {
  usuarioId: string;
  usuarioNome: string;
  tarefaId: string;
  tarefaTitulo: string;
  data: string;
};

/**
 * Tarefas esperadas num período que não têm instância de conclusão.
 * O dia de hoje só entra depois do horário-fim da tarefa (quando ela tem um definido) —
 * antes disso ela ainda está no prazo, não é pendência.
 */
export async function calcPendencias(params: {
  lojaIds: string[];
  usuarioId?: string;
  de: string;
  ate: string;
}): Promise<Pendencia[]> {
  const { lojaIds, usuarioId, de, ate } = params;
  if (lojaIds.length === 0) return [];

  const colaboradores = await prisma.usuario.findMany({
    where: {
      papel: "COLABORADOR",
      ativo: true,
      lojaId: { in: lojaIds },
      ...(usuarioId ? { id: usuarioId } : {}),
    },
  });
  if (colaboradores.length === 0) return [];

  const tarefasPorLoja = new Map<string, Awaited<ReturnType<typeof carregarTarefasAtivasDaLoja>>>();
  for (const lojaId of lojaIds) {
    tarefasPorLoja.set(lojaId, await carregarTarefasAtivasDaLoja(lojaId));
  }

  const instancias = await prisma.tarefaInstancia.findMany({
    where: {
      usuarioId: { in: colaboradores.map((c) => c.id) },
      data: { gte: fromIsoDate(de), lte: fromIsoDate(ate) },
    },
    select: { tarefaId: true, usuarioId: true, data: true },
  });
  const feitos = new Set(instancias.map((i) => `${i.tarefaId}__${i.usuarioId}__${isoDate(i.data)}`));

  const agora = new Date();
  const inicio = fromIsoDate(de);
  const fim = fromIsoDate(ate) < agora ? fromIsoDate(ate) : agora;
  const totalDias = Math.max(0, diffDays(fim, inicio));

  const pendencias: Pendencia[] = [];
  for (let i = 0; i <= totalDias; i++) {
    const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    if (d > agora) break;
    const iso = isoDate(d);
    const ehHoje = iso === isoDate(agora);

    for (const colaborador of colaboradores) {
      if (!colaborador.lojaId) continue;
      const tarefasDaLoja = tarefasPorLoja.get(colaborador.lojaId) || [];
      const esperadas = tarefasEsperadasParaUsuario(colaborador, d, tarefasDaLoja);
      for (const t of esperadas) {
        if (ehHoje && !tarefaAtrasadaAgora(t, agora)) continue;
        if (!feitos.has(`${t.id}__${colaborador.id}__${iso}`)) {
          pendencias.push({
            usuarioId: colaborador.id,
            usuarioNome: colaborador.nome,
            tarefaId: t.id,
            tarefaTitulo: t.titulo,
            data: iso,
          });
        }
      }
    }
  }

  return pendencias.sort((a, b) => b.data.localeCompare(a.data));
}
