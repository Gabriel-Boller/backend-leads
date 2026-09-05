import "server-only";
import { prisma } from "@/lib/db";
import { isoDate, fromIsoDate, fmtTime } from "@/lib/dates";
import { calcPendencias } from "@/lib/pendencias";

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

export type TipoConfirmacao = "FOTO" | "LINK" | "SIMPLES";

export type RegistroDetalhado = {
  id: string;
  data: string;
  hora: string;
  colaboradorNome: string;
  lojaNome: string;
  tarefaTitulo: string;
  categoria: string | null;
  tipoConfirmacao: TipoConfirmacao;
  link: string | null;
  fotoPath: string | null;
};

/** Lista as conclusões de tarefa no período com o suficiente pra líder/dono conferir a evidência (foto/link/marcação simples). */
export async function listarRegistrosDetalhados(params: {
  lojaIds: string[];
  de: string;
  ate: string;
  limite?: number;
}): Promise<RegistroDetalhado[]> {
  const { lojaIds, de, ate, limite = 200 } = params;

  const registros = await prisma.tarefaInstancia.findMany({
    where: {
      usuario: { lojaId: { in: lojaIds } },
      data: { gte: fromIsoDate(de), lte: fromIsoDate(ate) },
    },
    include: { usuario: { include: { loja: true } }, tarefa: true },
    orderBy: { concluidoEm: "desc" },
    take: limite,
  });

  return registros.map((r) => ({
    id: r.id,
    data: isoDate(r.data),
    hora: fmtTime(r.concluidoEm),
    colaboradorNome: r.usuario.nome,
    lojaNome: r.usuario.loja?.nome || "—",
    tarefaTitulo: r.tituloSnapshot,
    categoria: r.tarefa.categoria,
    tipoConfirmacao: r.tarefa.link ? "LINK" : r.tarefa.requerFoto ? "FOTO" : "SIMPLES",
    link: r.tarefa.link,
    fotoPath: r.fotoPath,
  }));
}

export async function gerarDadosRelatorio(params: {
  lojaIds: string[];
  usuarioId?: string;
  de: string;
  ate: string;
}): Promise<DadosRelatorio> {
  const { lojaIds, usuarioId, de, ate } = params;

  const lojas = await prisma.loja.findMany({ where: { id: { in: lojaIds } }, orderBy: { nome: "asc" } });

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

  const pendencias = await calcPendencias({ lojaIds, usuarioId, de, ate });
  const pendentes: RegistroPendente[] = pendencias.map((p) => ({
    data: p.data,
    colaboradorNome: p.usuarioNome,
    tarefaTitulo: p.tarefaTitulo,
  }));

  return {
    de,
    ate,
    lojaNomes: lojas.map((l) => l.nome),
    feitos,
    pendentes,
  };
}
