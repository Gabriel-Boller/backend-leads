"use server";

import { redirect } from "next/navigation";
import { autenticar, criarSessao } from "@/lib/auth";

export async function entrar(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const senha = String(formData.get("senha") || "");

  const usuario = await autenticar(email, senha);
  if (!usuario) {
    redirect("/login?erro=1");
  }

  await criarSessao(usuario.id);
  redirect("/app");
}
