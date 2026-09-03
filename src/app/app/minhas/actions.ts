"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePapel } from "@/lib/auth";
import { uploadFotoTarefa } from "@/lib/storage";
import { todayISO, fromIsoDate } from "@/lib/dates";

async function tarefaDoUsuario(tarefaId: string, usuarioId: string, lojaId: string) {
  const tarefa = await prisma.tarefa.findUnique({ where: { id: tarefaId } });
  if (!tarefa || tarefa.lojaId !== lojaId || !tarefa.ativo) {
    throw new Error("Tarefa não encontrada.");
  }
  return tarefa;
}

export async function marcarFeitoSemFoto(tarefaId: string) {
  const user = await requirePapel(["COLABORADOR"]);
  if (!user.lojaId) throw new Error("Usuário sem loja.");
  const tarefa = await tarefaDoUsuario(tarefaId, user.id, user.lojaId);
  if (tarefa.requerFoto) throw new Error("Esta tarefa exige foto.");

  const hoje = fromIsoDate(todayISO());
  await prisma.tarefaInstancia.upsert({
    where: { tarefaId_usuarioId_data: { tarefaId, usuarioId: user.id, data: hoje } },
    create: { tarefaId, usuarioId: user.id, data: hoje, tituloSnapshot: tarefa.titulo },
    update: {},
  });

  revalidatePath("/app/minhas");
  revalidatePath("/app/hoje");
}

export async function desmarcarTarefa(tarefaId: string) {
  const user = await requirePapel(["COLABORADOR"]);
  if (!user.lojaId) throw new Error("Usuário sem loja.");
  await tarefaDoUsuario(tarefaId, user.id, user.lojaId);

  const hoje = fromIsoDate(todayISO());
  await prisma.tarefaInstancia
    .delete({ where: { tarefaId_usuarioId_data: { tarefaId, usuarioId: user.id, data: hoje } } })
    .catch(() => {});

  revalidatePath("/app/minhas");
  revalidatePath("/app/hoje");
}

export async function concluirComFoto(tarefaId: string, formData: FormData) {
  const user = await requirePapel(["COLABORADOR"]);
  if (!user.lojaId) throw new Error("Usuário sem loja.");
  const tarefa = await tarefaDoUsuario(tarefaId, user.id, user.lojaId);

  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecione uma foto para enviar.");
  }

  const path = await uploadFotoTarefa(user.lojaId, user.id, file);
  const hoje = fromIsoDate(todayISO());

  await prisma.tarefaInstancia.upsert({
    where: { tarefaId_usuarioId_data: { tarefaId, usuarioId: user.id, data: hoje } },
    create: { tarefaId, usuarioId: user.id, data: hoje, tituloSnapshot: tarefa.titulo, fotoPath: path },
    update: { fotoPath: path },
  });

  revalidatePath("/app/minhas");
  revalidatePath("/app/hoje");
}
