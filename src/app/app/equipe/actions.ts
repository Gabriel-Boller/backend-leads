"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePapel, hashSenha } from "@/lib/auth";
import type { EscalaTipo } from "@prisma/client";

export async function criarLoja(formData: FormData) {
  await requirePapel(["DONO"]);
  const nome = String(formData.get("nome") || "").trim();
  if (!nome) throw new Error("Nome da loja é obrigatório.");

  await prisma.loja.create({ data: { nome } });
  revalidatePath("/app/equipe");
}

export async function editarLoja(lojaId: string, formData: FormData) {
  await requirePapel(["DONO"]);
  const nome = String(formData.get("nome") || "").trim();
  if (!nome) throw new Error("Nome da loja é obrigatório.");

  await prisma.loja.update({ where: { id: lojaId }, data: { nome } });
  revalidatePath("/app/equipe");
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function salvarUsuario(formData: FormData) {
  const user = await requirePapel(["DONO", "LIDER"]);

  const id = String(formData.get("id") || "").trim();
  const papel = String(formData.get("papel") || "") as "LIDER" | "COLABORADOR";
  const lojaId = String(formData.get("lojaId") || "");
  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const contato = String(formData.get("contato") || "").trim();
  const senha = String(formData.get("senha") || "");

  if (!nome) throw new Error("Nome é obrigatório.");
  if (papel !== "LIDER" && papel !== "COLABORADOR") throw new Error("Papel inválido.");
  if (!lojaId) throw new Error("Loja é obrigatória.");
  if (!validarEmail(email)) throw new Error("E-mail inválido.");

  // Só o dono cria líderes; líder só gerencia colaboradores da própria loja.
  // Dono também pode criar/editar colaboradores de qualquer loja.
  if (user.papel === "LIDER") {
    if (papel !== "COLABORADOR") throw new Error("Somente o dono pode criar ou editar líderes.");
    if (lojaId !== user.lojaId) throw new Error("Você só pode gerenciar sua própria loja.");
  }

  if (senha && senha.length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres.");
  }
  if (!id && !senha) throw new Error("Senha é obrigatória para criar um novo usuário.");

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

  try {
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
          email,
          contato: contato || null,
          ...escalaFields,
          ...(senha ? { senhaHash: await hashSenha(senha) } : {}),
        },
      });
    } else {
      await prisma.usuario.create({
        data: {
          nome,
          email,
          contato: contato || null,
          papel,
          lojaId,
          senhaHash: await hashSenha(senha),
          ...escalaFields,
        },
      });
    }
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      throw new Error("Já existe um usuário com esse e-mail.");
    }
    throw e;
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
