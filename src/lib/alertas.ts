import "server-only";
import { prisma } from "@/lib/db";
import { isoDate, daysAgo } from "@/lib/dates";
import { carregarTarefasAtivasDaLoja, tarefasEsperadasParaUsuario } from "@/lib/tarefas";

export type Alerta = {
  usuarioId: string;
  usuarioNome: string;
  tarefaId: string;
  tarefaTitulo: string;
  data: string;
};

const DIAS_PARA_TRAS = 5;

/** Pendências: tarefas esperadas nos últimos dias que não têm instância de conclusão. */
export async function calcAlertas(lojaIds: string[]): Promise<Alerta[]> {
  if (lojaIds.length === 0) return [];

  const colaboradores = await prisma.usuario.findMany({
    where: { papel: "COLABORADOR", ativo: true, lojaId: { in: lojaIds } },
  });
  if (colaboradores.length === 0) return [];

  const tarefasPorLoja = new Map<string, Awaited<ReturnType<typeof carregarTarefasAtivasDaLoja>>>();
  for (const lojaId of lojaIds) {
    tarefasPorLoja.set(lojaId, await carregarTarefasAtivasDaLoja(lojaId));
  }

  const desde = daysAgo(DIAS_PARA_TRAS);
  desde.setHours(0, 0, 0, 0);

  const instancias = await prisma.tarefaInstancia.findMany({
    where: {
      usuarioId: { in: colaboradores.map((c) => c.id) },
      data: { gte: desde },
    },
    select: { tarefaId: true, usuarioId: true, data: true },
  });
  const feitos = new Set(instancias.map((i) => `${i.tarefaId}__${i.usuarioId}__${isoDate(i.data)}`));

  const alertas: Alerta[] = [];
  for (let i = 1; i <= DIAS_PARA_TRAS; i++) {
    const d = daysAgo(i);
    const iso = isoDate(d);
    for (const colaborador of colaboradores) {
      if (!colaborador.lojaId) continue;
      const tarefasDaLoja = tarefasPorLoja.get(colaborador.lojaId) || [];
      const esperadas = tarefasEsperadasParaUsuario(colaborador, d, tarefasDaLoja);
      for (const t of esperadas) {
        if (!feitos.has(`${t.id}__${colaborador.id}__${iso}`)) {
          alertas.push({
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

  return alertas.sort((a, b) => b.data.localeCompare(a.data));
}
