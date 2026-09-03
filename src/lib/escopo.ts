import "server-only";
import { prisma } from "@/lib/db";
import type { UsuarioSessao } from "@/lib/auth";

/** IDs das lojas que esse usuário pode ver: todas para dono, só a própria para líder. */
export async function lojaIdsVisiveis(user: UsuarioSessao): Promise<string[]> {
  if (user.papel === "DONO") {
    const lojas = await prisma.loja.findMany({ select: { id: true } });
    return lojas.map((l) => l.id);
  }
  return user.lojaId ? [user.lojaId] : [];
}
