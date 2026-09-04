import "server-only";
import { prisma } from "@/lib/db";
import { fromIsoDate, todayISO } from "@/lib/dates";
import { carregarTarefasAtivasDaLoja, tarefasEsperadasParaUsuario, type UsuarioComEscala } from "@/lib/tarefas";
import { decimalParaNumero } from "@/lib/dinheiro";
import type { Prisma, TarefaTipoEspecial } from "@prisma/client";

export type CaixaComMovimentos = Prisma.CaixaGetPayload<{
  include: {
    movimentos: true;
    abertoPor: { select: { id: true; nome: true } };
    fechadoPor: { select: { id: true; nome: true } };
  };
}>;

export function resumoCaixa(caixa: CaixaComMovimentos) {
  const entradas = caixa.movimentos.filter((m) => m.tipo === "ENTRADA").reduce((s, m) => s + decimalParaNumero(m.valor), 0);
  const saidas = caixa.movimentos.filter((m) => m.tipo === "SAIDA").reduce((s, m) => s + decimalParaNumero(m.valor), 0);
  const valorAbertura = decimalParaNumero(caixa.valorAbertura);
  const valorEsperado = valorAbertura + entradas - saidas;
  return { entradas, saidas, valorAbertura, valorEsperado };
}

/** Caixa aberto no momento na loja (no máximo um por regra de negócio). */
export async function caixaAbertoDaLoja(lojaId: string): Promise<CaixaComMovimentos | null> {
  return prisma.caixa.findFirst({
    where: { lojaId, status: "ABERTO" },
    include: {
      movimentos: { orderBy: { criadoEm: "asc" } },
      abertoPor: { select: { id: true, nome: true } },
      fechadoPor: { select: { id: true, nome: true } },
    },
  });
}

/**
 * A tarefa de abertura/fechamento de caixa esperada hoje para esse usuário (se existir e
 * ainda não tiver sido concluída) — usada pra saber se marcar automaticamente como feita
 * quando ele abre/fecha o caixa de verdade.
 */
export async function tarefaEspecialPendenteHoje(
  usuario: UsuarioComEscala,
  lojaId: string,
  tipoEspecial: Extract<TarefaTipoEspecial, "ABERTURA_CAIXA" | "FECHAMENTO_CAIXA">
) {
  const tarefasDaLoja = await carregarTarefasAtivasDaLoja(lojaId);
  const especiais = tarefasDaLoja.filter((t) => t.tipoEspecial === tipoEspecial);
  if (especiais.length === 0) return null;

  const hoje = fromIsoDate(todayISO());
  const esperadas = tarefasEsperadasParaUsuario(usuario, hoje, especiais);
  if (esperadas.length === 0) return null;

  const jaFeitas = await prisma.tarefaInstancia.findMany({
    where: { usuarioId: usuario.id, data: hoje, tarefaId: { in: esperadas.map((t) => t.id) } },
    select: { tarefaId: true },
  });
  const feitosIds = new Set(jaFeitas.map((i) => i.tarefaId));
  return esperadas.find((t) => !feitosIds.has(t.id)) || null;
}

/** Marca a tarefa especial de hoje como concluída (chamado após abrir/fechar o caixa de verdade). */
export async function concluirTarefaEspecialHoje(
  usuario: UsuarioComEscala,
  lojaId: string,
  tipoEspecial: Extract<TarefaTipoEspecial, "ABERTURA_CAIXA" | "FECHAMENTO_CAIXA">
) {
  const tarefa = await tarefaEspecialPendenteHoje(usuario, lojaId, tipoEspecial);
  if (!tarefa) return;

  const hoje = fromIsoDate(todayISO());
  await prisma.tarefaInstancia.upsert({
    where: { tarefaId_usuarioId_data: { tarefaId: tarefa.id, usuarioId: usuario.id, data: hoje } },
    create: { tarefaId: tarefa.id, usuarioId: usuario.id, data: hoje, tituloSnapshot: tarefa.titulo },
    update: {},
  });
}
