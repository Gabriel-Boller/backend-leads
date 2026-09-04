import "server-only";
import { prisma } from "@/lib/db";
import { isoDate, fromIsoDate, diffDays } from "@/lib/dates";
import { carregarTarefasAtivasDaLoja, tarefasEsperadasParaUsuario } from "@/lib/tarefas";
import { estadoTarefaAgora } from "@/lib/schedule";

export type StatusBreakdown = {
  naoIniciado: number;
  iniciado: number;
  atrasado: number;
  naoExecutado: number;
  finalizado: number;
  total: number;
};

export type RankingItem = { id: string; nome: string; pct: number; total: number; feitas: number };
export type PontoEvolucao = { data: string; pct: number };

export type DadosDashboard = {
  status: StatusBreakdown;
  rankingColaboradores: RankingItem[];
  rankingLojas: RankingItem[];
  evolucao: PontoEvolucao[];
};

function pct(feitas: number, total: number): number {
  return total ? Math.round((100 * feitas) / total) : 0;
}

export async function gerarDadosDashboard(params: { lojaIds: string[]; de: string; ate: string }): Promise<DadosDashboard> {
  const { lojaIds, de, ate } = params;

  const status: StatusBreakdown = { naoIniciado: 0, iniciado: 0, atrasado: 0, naoExecutado: 0, finalizado: 0, total: 0 };
  if (lojaIds.length === 0) {
    return { status, rankingColaboradores: [], rankingLojas: [], evolucao: [] };
  }

  const lojas = await prisma.loja.findMany({ where: { id: { in: lojaIds } } });
  const lojaNomePorId = new Map(lojas.map((l) => [l.id, l.nome]));

  const colaboradores = await prisma.usuario.findMany({
    where: { papel: "COLABORADOR", ativo: true, lojaId: { in: lojaIds } },
  });
  if (colaboradores.length === 0) {
    return { status, rankingColaboradores: [], rankingLojas: [], evolucao: [] };
  }

  const tarefasPorLoja = new Map<string, Awaited<ReturnType<typeof carregarTarefasAtivasDaLoja>>>();
  for (const lojaId of lojaIds) {
    tarefasPorLoja.set(lojaId, await carregarTarefasAtivasDaLoja(lojaId));
  }

  const instancias = await prisma.tarefaInstancia.findMany({
    where: { usuarioId: { in: colaboradores.map((c) => c.id) }, data: { gte: fromIsoDate(de), lte: fromIsoDate(ate) } },
    select: { tarefaId: true, usuarioId: true, data: true },
  });
  const feitos = new Set(instancias.map((i) => `${i.tarefaId}__${i.usuarioId}__${isoDate(i.data)}`));

  const agora = new Date();
  const inicio = fromIsoDate(de);
  const fim = fromIsoDate(ate) < agora ? fromIsoDate(ate) : agora;
  const totalDias = Math.max(0, diffDays(fim, inicio));

  const porColaborador = new Map<string, { nome: string; total: number; feitas: number }>();
  const porLoja = new Map<string, { nome: string; total: number; feitas: number }>();
  const porDia = new Map<string, { total: number; feitas: number }>();

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
        status.total++;

        const cRec = porColaborador.get(colaborador.id) ?? { nome: colaborador.nome, total: 0, feitas: 0 };
        const lRec = porLoja.get(colaborador.lojaId) ?? { nome: lojaNomePorId.get(colaborador.lojaId) || "—", total: 0, feitas: 0 };
        const dRec = porDia.get(iso) ?? { total: 0, feitas: 0 };
        cRec.total++;
        lRec.total++;
        dRec.total++;

        const feita = feitos.has(`${t.id}__${colaborador.id}__${iso}`);
        if (feita) {
          status.finalizado++;
          cRec.feitas++;
          lRec.feitas++;
          dRec.feitas++;
        } else if (ehHoje) {
          const estado = estadoTarefaAgora(t, agora);
          if (estado === "atrasada") status.atrasado++;
          else if (estado === "na_hora") status.iniciado++;
          else status.naoIniciado++;
        } else {
          status.naoExecutado++;
        }

        porColaborador.set(colaborador.id, cRec);
        porLoja.set(colaborador.lojaId, lRec);
        porDia.set(iso, dRec);
      }
    }
  }

  const rankingColaboradores = [...porColaborador.entries()]
    .map(([id, r]) => ({ id, nome: r.nome, total: r.total, feitas: r.feitas, pct: pct(r.feitas, r.total) }))
    .sort((a, b) => b.pct - a.pct);

  const rankingLojas = [...porLoja.entries()]
    .map(([id, r]) => ({ id, nome: r.nome, total: r.total, feitas: r.feitas, pct: pct(r.feitas, r.total) }))
    .sort((a, b) => b.pct - a.pct);

  const evolucao = [...porDia.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([data, r]) => ({ data, pct: pct(r.feitas, r.total) }));

  return { status, rankingColaboradores, rankingLojas, evolucao };
}
