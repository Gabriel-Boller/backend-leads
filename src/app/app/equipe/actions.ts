"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePapel } from "@/lib/auth";
import { hashPin } from "@/lib/auth";
import type { EscalaTipo } from "@prisma/client";

export async function criarLoja(formData: FormData) {
  await requirePapel(["DONO"]);
  const nome = String(formData.get("nome") || "").trim();
  if (!nome) throw new Error("Nome da loja é obrigatório.");

  await prisma.loja.create({ data: { nome } });
  revalidatePath("/app/equipe");
}

export async function salvarUsuario(formData: FormData) {
  const user = await requirePapel(["DONO", "LIDER"]);

  const id = String(formData.get("id") || "").trim();
  const papel = String(formData.get("papel") || "") as "LIDER" | "COLABORADOR";
  const lojaId = String(formData.get("lojaId") || "");
  const nome = String(formData.get("nome") || "").trim();
  const pin = String(formData.get("pin") || "").trim();

  if (!nome) throw new Error("Nome é obrigatório.");
  if (papel !== "LIDER" && papel !== "COLABORADOR") throw new Error("Papel inválido.");
  if (!lojaId) throw new Error("Loja é obrigatória.");

  if (user.papel === "LIDER") {
    if (papel !== "COLABORADOR") throw new Error("Líder só pode gerenciar colaboradores.");
    if (lojaId !== user.lojaId) throw new Error("Você só pode gerenciar sua própria loja.");
  }

  if (pin && !/^\d{4,6}$/.test(pin)) {
    throw new Error("PIN deve ter de 4 a 6 números.");
  }
  if (!id && !pin) throw new Error("PIN é obrigatório para criar um novo usuário.");

  const escalaTipo = (String(formData.get("escalaTipo") || "TODOS") as EscalaTipo) ?? "TODOS";
  const diasSemana = formData.getAll("diasSemana").map((v) => Number(v));
  const escalaDataBaseRaw = String(formData.get("escalaDataBase") || "");

  const escalaFields =
    papel === "COLABORADOR"
      ? {
          escalaTipo,
          diasSemana: escalaTipo === "DIAS_SEMANA" ? diasSemana : [],
          escalaDataBase:
            escalaTipo === "DOZE_POR_TRINTA_SEIS" && escalaDataBaseRaw ? new Date(escalaDataBaseRaw) : null,
        }
      : { escalaTipo: "TODOS" as EscalaTipo, diasSemana: [], escalaDataBase: null };

  if (id) {
    const existente = await prisma.usuario.findUnique({ where: { id } });
    if (!existente) throw new Error("Usuário não encontrado.");
    if (user.papel === "LIDER" && (existente.papel !== "COLABORADOR" || existente.lojaId !== user.lojaId)) {
      throw new Error("Você não tem permissão para editar esse usuário.");
    }
    await prisma.usuario.update({
      where: { id },
      data: {
        nome,
        ...escalaFields,
        ...(pin ? { pinHash: await hashPin(pin) } : {}),
      },
    });
  } else {
    await prisma.usuario.create({
      data: {
        nome,
        papel,
        lojaId,
        pinHash: await hashPin(pin),
        ...escalaFields,
      },
    });
  }

  revalidatePath("/app/equipe");
}

export async function removerUsuario(usuarioId: string) {
  const user = await requirePapel(["DONO", "LIDER"]);
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) return;

  if (user.papel === "LIDER" && (usuario.papel !== "COLABORADOR" || usuario.lojaId !== user.lojaId)) {
    throw new Error("Você não tem permissão para remover esse usuário.");
  }
  if (user.papel === "DONO" && usuario.papel === "DONO") {
    throw new Error("Não é possível remover uma conta de dono por aqui.");
  }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { ativo: false } });
  revalidatePath("/app/equipe");
}
