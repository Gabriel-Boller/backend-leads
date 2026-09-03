import "server-only";
import { prisma } from "@/lib/db";
import { isoDate, fromIsoDate, fmtTime, diffDays } from "@/lib/dates";
import { carregarTarefasAtivasDaLoja, tarefasEsperadasParaUsuario } from "@/lib/tarefas";
import { tarefaAtrasadaAgora } from "@/lib/schedule";

export type RegistroFeito = {
  data: string;
  colaboradorNome: string;
  tarefaTitulo: string;
  hora: string;
  comFoto: boolean;
};

export type RegistroPendente = {
  data: string;
  colaboradorNome: string;
  tarefaTitulo: string;
};

export type DadosRelatorio = {
  de: string;
  ate: string;
  lojaNomes: string[];
  feitos: RegistroFeito[];
  pendentes: RegistroPendente[];
};

export async function gerarDadosRelatorio(params: {
  lojaIds: string[];
  usuarioId?: string;
  de: string;
  ate: string;
}): Promise<DadosRelatorio> {
  const { lojaIds, usuarioId, de, ate } = params;

  const lojas = await prisma.loja.findMany({ where: { id: { in: lojaIds } }, orderBy: { nome: "asc" } });

  const colaboradores = await prisma.usuario.findMany({
    where: {
      papel: "COLABORADOR",
      lojaId: { in: lojaIds },
      ...(usuarioId ? { id: usuarioId } : {}),
    },
    orderBy: { nome: "asc" },
  });

  const registrosDb = await prisma.tarefaInstancia.findMany({
    where: {
      usuario: { lojaId: { in: lojaIds }, ...(usuarioId ? { id: usuarioId } : {}) },
      data: { gte: fromIsoDate(de), lte: fromIsoDate(ate) },
    },
    include: { usuario: true },
    orderBy: { data: "asc" },
  });

  const feitos: RegistroFeito[] = registrosDb.map((r) => ({
    data: isoDate(r.data),
    colaboradorNome: r.usuario.nome,
    tarefaTitulo: r.tituloSnapshot,
    hora: fmtTime(r.concluidoEm),
    comFoto: !!r.fotoPath,
  }));
  const feitosSet = new Set(registrosDb.map((r) => `${r.tarefaId}__${r.usuarioId}__${isoDate(r.data)}`));

  const tarefasPorLoja = new Map<string, Awaited<ReturnType<typeof carregarTarefasAtivasDaLoja>>>();
  for (const lojaId of lojaIds) {
    tarefasPorLoja.set(lojaId, await carregarTarefasAtivasDaLoja(lojaId));
  }

  const hoje = new Date();
  const inicio = fromIsoDate(de);
  const fim = fromIsoDate(ate) < hoje ? fromIsoDate(ate) : hoje;
  const totalDias = Math.max(0, diffDays(fim, inicio));

  const pendentes: RegistroPendente[] = [];
  for (let i = 0; i <= totalDias; i++) {
    const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    if (d > hoje) break;
    const iso = isoDate(d);
    const ehHoje = iso === isoDate(hoje);

    for (const colaborador of colaboradores) {
      if (!colaborador.lojaId) continue;
      const tarefasDaLoja = tarefasPorLoja.get(colaborador.lojaId) || [];
      const esperadas = tarefasEsperadasParaUsuario(colaborador, d, tarefasDaLoja);
      for (const t of esperadas) {
        if (ehHoje && !tarefaAtrasadaAgora(t, hoje)) continue;
        if (!feitosSet.has(`${t.id}__${colaborador.id}__${iso}`)) {
          pendentes.push({ data: iso, colaboradorNome: colaborador.nome, tarefaTitulo: t.titulo });
        }
      }
    }
  }

  return {
    de,
    ate,
    lojaNomes: lojas.map((l) => l.nome),
    feitos,
    pendentes: pendentes.sort((a, b) => a.data.localeCompare(b.data)),
  };
}
