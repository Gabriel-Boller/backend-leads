import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Papel } from "@prisma/client";

const SESSION_COOKIE = "sessao";
const SESSION_DAYS = 90;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function criarSessao(usuarioId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.sessao.create({
    data: { usuarioId, tokenHash: hashToken(token), expiraEm },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.sessao.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }
  jar.delete(SESSION_COOKIE);
}

export type UsuarioSessao = {
  id: string;
  nome: string;
  papel: Papel;
  lojaId: string | null;
};

export async function getUsuarioAtual(): Promise<UsuarioSessao | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sessao = await prisma.sessao.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: true },
  });

  if (!sessao || sessao.expiraEm < new Date() || !sessao.usuario.ativo) {
    return null;
  }

  return {
    id: sessao.usuario.id,
    nome: sessao.usuario.nome,
    papel: sessao.usuario.papel,
    lojaId: sessao.usuario.lojaId,
  };
}

/** Usa em Server Components/Actions de área protegida: redireciona pro login se não houver sessão. */
export async function requireUsuario(): Promise<UsuarioSessao> {
  const user = await getUsuarioAtual();
  if (!user) redirect("/login");
  return user;
}

/** Garante que o usuário logado tem um dos papéis permitidos, senão manda pra Hoje/Minhas tarefas. */
export async function requirePapel(papeis: Papel[]): Promise<UsuarioSessao> {
  const user = await requireUsuario();
  if (!papeis.includes(user.papel)) {
    redirect("/app");
  }
  return user;
}
