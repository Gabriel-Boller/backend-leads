"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePapel } from "@/lib/auth";
import { concluirTarefaEspecialHoje } from "@/lib/caixa";
import { parseValorMonetario, decimalParaNumero } from "@/lib/dinheiro";
import type { CaixaMovimentoTipo } from "@prisma/client";

export type ResultadoCaixa = { ok: true } | { ok: false; erro: string };

async function usuarioComEscala(usuarioId: string) {
  return prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
}

function revalidarTudo() {
  revalidatePath("/app/caixa");
  revalidatePath("/app/minhas");
  revalidatePath("/app/dashboard");
}

export async function abrirCaixa(formData: FormData): Promise<ResultadoCaixa> {
  try {
    const user = await requirePapel(["COLABORADOR", "LIDER"]);
    if (!user.lojaId) return { ok: false, erro: "Usuário sem loja." };

    const valorAbertura = parseValorMonetario(formData.get("valorAbertura"));
    if (valorAbertura < 0) return { ok: false, erro: "O valor de abertura não pode ser negativo." };
    const obsAbertura = String(formData.get("obsAbertura") || "").trim() || null;

    const aberto = await prisma.caixa.findFirst({ where: { lojaId: user.lojaId, status: "ABERTO" } });
    if (aberto) return { ok: false, erro: "Já existe um caixa aberto nesta loja. Feche-o antes de abrir outro." };

    await prisma.caixa.create({
      data: { lojaId: user.lojaId, abertoPorId: user.id, valorAbertura, obsAbertura },
    });

    const usuario = await usuarioComEscala(user.id);
    await concluirTarefaEspecialHoje(usuario, user.lojaId, "ABERTURA_CAIXA");

    revalidarTudo();
    return { ok: true };
  } catch (e) {
    console.error("abrirCaixa falhou:", e);
    return { ok: false, erro: e instanceof Error ? e.message : "Falha ao abrir o caixa." };
  }
}

export async function lancarMovimento(caixaId: string, tipo: CaixaMovimentoTipo, formData: FormData): Promise<ResultadoCaixa> {
  try {
    const user = await requirePapel(["COLABORADOR", "LIDER"]);
    if (!user.lojaId) return { ok: false, erro: "Usuário sem loja." };

    const caixa = await prisma.caixa.findUnique({ where: { id: caixaId } });
    if (!caixa || caixa.lojaId !== user.lojaId) return { ok: false, erro: "Caixa não encontrado." };
    if (caixa.status !== "ABERTO") return { ok: false, erro: "Esse caixa já está fechado." };
    if (caixa.abertoPorId !== user.id) return { ok: false, erro: "Somente quem abriu o caixa pode lançar valores nele." };

    const valor = parseValorMonetario(formData.get("valor"));
    if (valor <= 0) return { ok: false, erro: "Informe um valor maior que zero." };
    const observacao = String(formData.get("observacao") || "").trim() || null;

    await prisma.caixaMovimento.create({
      data: { caixaId, tipo, usuarioId: user.id, valor, observacao },
    });

    revalidarTudo();
    return { ok: true };
  } catch (e) {
    console.error("lancarMovimento falhou:", e);
    return { ok: false, erro: e instanceof Error ? e.message : "Falha ao lançar o valor." };
  }
}

async function calcularBaseFechamento(caixaId: string) {
  const caixa = await prisma.caixa.findUniqueOrThrow({ where: { id: caixaId }, include: { movimentos: true } });
  const entradas = caixa.movimentos.filter((m) => m.tipo === "ENTRADA").reduce((s, m) => s + decimalParaNumero(m.valor), 0);
  const saidas = caixa.movimentos.filter((m) => m.tipo === "SAIDA").reduce((s, m) => s + decimalParaNumero(m.valor), 0);
  // Só reforço de troco (entrada) e retirada (saída) entram aqui — vendas não são
  // lançadas como movimento, então isso é "quanto deveria ter no caixa sem contar vendas".
  const valorEsperado = decimalParaNumero(caixa.valorAbertura) + entradas - saidas;
  return { caixa, valorEsperado };
}

export async function fecharCaixa(caixaId: string, formData: FormData): Promise<ResultadoCaixa> {
  try {
    const user = await requirePapel(["COLABORADOR", "LIDER"]);
    if (!user.lojaId) return { ok: false, erro: "Usuário sem loja." };

    const { caixa, valorEsperado } = await calcularBaseFechamento(caixaId);
    if (caixa.lojaId !== user.lojaId) return { ok: false, erro: "Caixa não encontrado." };
    if (caixa.status !== "ABERTO") return { ok: false, erro: "Esse caixa já está fechado." };
    if (caixa.abertoPorId !== user.id) return { ok: false, erro: "Somente quem abriu o caixa pode fechá-lo." };

    const valorContado = parseValorMonetario(formData.get("valorContado"));
    if (valorContado < 0) return { ok: false, erro: "O valor contado não pode ser negativo." };
    const obsFechamento = String(formData.get("obsFechamento") || "").trim() || null;
    // Estimativa de venda em dinheiro implícita no que foi contado — o dono confere depois
    // contra o que o sistema de vendas real diz (campo vendaInformada).
    const vendaEstimada = valorContado - valorEsperado;

    await prisma.caixa.update({
      where: { id: caixaId },
      data: {
        status: "FECHADO",
        fechadoPorId: user.id,
        fechadoEm: new Date(),
        valorContado,
        valorEsperado,
        vendaEstimada,
        obsFechamento,
      },
    });

    const usuario = await usuarioComEscala(user.id);
    await concluirTarefaEspecialHoje(usuario, user.lojaId, "FECHAMENTO_CAIXA");

    revalidarTudo();
    return { ok: true };
  } catch (e) {
    console.error("fecharCaixa falhou:", e);
    return { ok: false, erro: e instanceof Error ? e.message : "Falha ao fechar o caixa." };
  }
}

/**
 * Fechamento de emergência pelo dono/líder quando quem abriu o caixa não está disponível
 * pra fechar (faltou, esqueceu, saiu da empresa etc). Fica marcado como forçado no relatório
 * e não conclui a tarefa de fechamento de ninguém — a pendência do colaborador continua
 * aparecendo nos alertas, de propósito, pra sinalizar que algo saiu do fluxo normal.
 */
export async function fecharCaixaForcado(caixaId: string, formData: FormData): Promise<ResultadoCaixa> {
  try {
    const user = await requirePapel(["DONO", "LIDER"]);

    const { caixa, valorEsperado } = await calcularBaseFechamento(caixaId);
    if (user.papel === "LIDER" && caixa.lojaId !== user.lojaId) {
      return { ok: false, erro: "Você não tem permissão para fechar o caixa dessa loja." };
    }
    if (caixa.status !== "ABERTO") return { ok: false, erro: "Esse caixa já está fechado." };

    const valorContado = parseValorMonetario(formData.get("valorContado"));
    if (valorContado < 0) return { ok: false, erro: "O valor contado não pode ser negativo." };
    const motivo = String(formData.get("obsFechamento") || "").trim();
    if (!motivo) return { ok: false, erro: "Explique o motivo do fechamento forçado." };
    const vendaEstimada = valorContado - valorEsperado;

    await prisma.caixa.update({
      where: { id: caixaId },
      data: {
        status: "FECHADO",
        fechadoPorId: user.id,
        fechadoEm: new Date(),
        valorContado,
        valorEsperado,
        vendaEstimada,
        obsFechamento: motivo,
        fechamentoForcado: true,
      },
    });

    revalidarTudo();
    return { ok: true };
  } catch (e) {
    console.error("fecharCaixaForcado falhou:", e);
    return { ok: false, erro: e instanceof Error ? e.message : "Falha ao fechar o caixa." };
  }
}

/**
 * Preenchido depois, à mão, pelo dono/líder — quanto o sistema de vendas real (externo,
 * ainda sem integração) diz que foi vendido em dinheiro naquele caixa. Só faz sentido
 * depois de fechado, pra comparar contra a venda estimada pela contagem física.
 */
export async function informarVendaCaixa(caixaId: string, formData: FormData): Promise<ResultadoCaixa> {
  try {
    const user = await requirePapel(["DONO", "LIDER"]);
    const caixa = await prisma.caixa.findUnique({ where: { id: caixaId } });
    if (!caixa) return { ok: false, erro: "Caixa não encontrado." };
    if (user.papel === "LIDER" && caixa.lojaId !== user.lojaId) {
      return { ok: false, erro: "Você não tem permissão para editar o caixa dessa loja." };
    }
    if (caixa.status !== "FECHADO") return { ok: false, erro: "Só dá pra informar a venda depois que o caixa for fechado." };

    const vendaInformada = parseValorMonetario(formData.get("vendaInformada"));
    if (vendaInformada < 0) return { ok: false, erro: "O valor não pode ser negativo." };

    await prisma.caixa.update({
      where: { id: caixaId },
      data: { vendaInformada, vendaInformadaPorId: user.id, vendaInformadaEm: new Date() },
    });

    revalidarTudo();
    return { ok: true };
  } catch (e) {
    console.error("informarVendaCaixa falhou:", e);
    return { ok: false, erro: e instanceof Error ? e.message : "Falha ao registrar a venda informada." };
  }
}
