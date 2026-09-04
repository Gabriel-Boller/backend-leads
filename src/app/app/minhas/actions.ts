"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePapel } from "@/lib/auth";
import { uploadFotoTarefa } from "@/lib/storage";
import { todayISO, fromIsoDate, agoraNaLoja } from "@/lib/dates";
import { tarefaDisponivelAgora } from "@/lib/schedule";

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
  if (!tarefaDisponivelAgora(tarefa, agoraNaLoja())) {
    throw new Error(`Essa tarefa só pode ser concluída a partir das ${tarefa.horarioInicio}.`);
  }

  const hoje = fromIsoDate(todayISO());
  await prisma.tarefaInstancia.upsert({
    where: { tarefaId_usuarioId_data: { tarefaId, usuarioId: user.id, data: hoje } },
    create: { tarefaId, usuarioId: user.id, data: hoje, tituloSnapshot: tarefa.titulo },
    update: {},
  });

  revalidatePath("/app/minhas");
  revalidatePath("/app/dashboard");
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
  revalidatePath("/app/dashboard");
}

export type ResultadoFoto = { ok: true } | { ok: false; erro: string };

/**
 * Retorna um resultado em vez de lançar erro: em produção o Next.js troca a mensagem
 * de exceções não tratadas em Server Actions por um texto genérico redigido (por
 * segurança) — capturando aqui a gente mantém a mensagem real visível pro usuário.
 */
export async function concluirComFoto(tarefaId: string, formData: FormData): Promise<ResultadoFoto> {
  try {
    const user = await requirePapel(["COLABORADOR"]);
    if (!user.lojaId) return { ok: false, erro: "Usuário sem loja." };
    const tarefa = await tarefaDoUsuario(tarefaId, user.id, user.lojaId);
    if (!tarefaDisponivelAgora(tarefa, agoraNaLoja())) {
      return { ok: false, erro: `Essa tarefa só pode ser concluída a partir das ${tarefa.horarioInicio}.` };
    }

    const file = formData.get("foto");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, erro: "Selecione uma foto para enviar." };
    }

    const path = await uploadFotoTarefa(user.lojaId, user.id, file);
    const hoje = fromIsoDate(todayISO());

    await prisma.tarefaInstancia.upsert({
      where: { tarefaId_usuarioId_data: { tarefaId, usuarioId: user.id, data: hoje } },
      create: { tarefaId, usuarioId: user.id, data: hoje, tituloSnapshot: tarefa.titulo, fotoPath: path },
      update: { fotoPath: path },
    });

    revalidatePath("/app/minhas");
    revalidatePath("/app/dashboard");
    return { ok: true };
  } catch (e) {
    console.error("concluirComFoto falhou:", e);
    return { ok: false, erro: e instanceof Error ? e.message : "Falha ao enviar a foto." };
  }
}
