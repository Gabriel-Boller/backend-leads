"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePapel } from "@/lib/auth";
import type { FrequenciaTipo } from "@prisma/client";

function garantirAcessoLoja(user: { papel: string; lojaId: string | null }, lojaId: string) {
  if (user.papel === "LIDER" && user.lojaId !== lojaId) {
    throw new Error("Você não tem permissão para gerenciar tarefas dessa loja.");
  }
}

export async function salvarTarefa(formData: FormData) {
  const user = await requirePapel(["DONO", "LIDER"]);

  const id = String(formData.get("id") || "").trim();
  const lojaId = String(formData.get("lojaId") || (user.lojaId ?? ""));
  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const frequenciaTipo = String(formData.get("frequenciaTipo") || "DIARIA") as FrequenciaTipo;
  const diasSemana = formData.getAll("diasSemana").map((v) => Number(v));
  const diaDoMesRaw = formData.get("diaDoMes");
  const diaDoMes = diaDoMesRaw ? Number(diaDoMesRaw) : null;
  const datasEspecificas = formData.getAll("datasEspecificas").map((v) => new Date(String(v)));
  const horarioInicio = String(formData.get("horarioInicio") || "").trim() || null;
  const horarioFim = String(formData.get("horarioFim") || "").trim() || null;
  const atribuidoATodos = formData.get("atribuidoATodos") === "todos";
  const colaboradorIds = formData.getAll("colaboradorIds").map((v) => String(v));
  const requerFoto = formData.get("requerFoto") != null;

  if (!titulo) throw new Error("Título é obrigatório.");
  if (!lojaId) throw new Error("Loja é obrigatória.");
  garantirAcessoLoja(user, lojaId);

  const dados = {
    lojaId,
    titulo,
    descricao: descricao || null,
    requerFoto,
    frequenciaTipo,
    diasSemana: frequenciaTipo === "SEMANAL" ? diasSemana : [],
    diaDoMes: frequenciaTipo === "MENSAL" ? diaDoMes : null,
    datasEspecificas: frequenciaTipo === "PERSONALIZADA" ? datasEspecificas : [],
    horarioInicio,
    horarioFim,
    atribuidoATodos,
  };

  const atribuicoesWrite = atribuidoATodos
    ? { deleteMany: {} }
    : { deleteMany: {}, create: colaboradorIds.map((usuarioId) => ({ usuarioId })) };

  if (id) {
    const existente = await prisma.tarefa.findUnique({ where: { id } });
    if (!existente) throw new Error("Tarefa não encontrada.");
    garantirAcessoLoja(user, existente.lojaId);
    await prisma.tarefa.update({
      where: { id },
      data: { ...dados, atribuicoes: atribuicoesWrite },
    });
  } else {
    await prisma.tarefa.create({
      data: { ...dados, atribuicoes: atribuidoATodos ? undefined : { create: colaboradorIds.map((usuarioId) => ({ usuarioId })) } },
    });
  }

  revalidatePath("/app/tarefas");
  revalidatePath("/app/hoje");
  revalidatePath("/app/minhas");
}

export async function excluirTarefa(tarefaId: string) {
  const user = await requirePapel(["DONO", "LIDER"]);
  const tarefa = await prisma.tarefa.findUnique({ where: { id: tarefaId } });
  if (!tarefa) return;
  garantirAcessoLoja(user, tarefa.lojaId);

  await prisma.tarefa.update({ where: { id: tarefaId }, data: { ativo: false } });

  revalidatePath("/app/tarefas");
  revalidatePath("/app/hoje");
}
