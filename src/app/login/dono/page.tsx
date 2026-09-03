import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function LoginDonoPage() {
  const donos = await prisma.usuario.findMany({
    where: { papel: "DONO", ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="center-screen">
      <div className="card login-card">
        <Link href="/login" className="back-link">
          ‹ Voltar
        </Link>
        <h1 className="login-title">Conta do dono</h1>
        <p className="login-sub">Selecione seu nome</p>
        {donos.length === 0 && (
          <p className="task-desc">Nenhum dono cadastrado ainda.</p>
        )}
        {donos.map((u) => (
          <Link key={u.id} href={`/login/pin/${u.id}`} className="user-pick">
            <div className="avatar">{u.nome[0]}</div>
            <div>{u.nome}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
