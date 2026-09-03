"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPin, criarSessao } from "@/lib/auth";

export async function entrarComPin(usuarioId: string, formData: FormData) {
  const pin = String(formData.get("pin") || "").trim();

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario || !usuario.ativo) {
    redirect("/login");
  }

  if (!pin || !(await verifyPin(pin, usuario.pinHash))) {
    redirect(`/login/pin/${usuarioId}?erro=1`);
  }

  await criarSessao(usuario.id);
  redirect("/app");
}
