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
