import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function LoginLojaPage() {
  const lojas = await prisma.loja.findMany({ orderBy: { nome: "asc" } });

  return (
    <div className="center-screen">
      <div className="card login-card">
        <Link href="/login" className="back-link">
          ‹ Voltar
        </Link>
        <h1 className="login-title">Escolha sua loja</h1>
        {lojas.length === 0 && <p className="task-desc">Nenhuma loja cadastrada ainda.</p>}
        {lojas.map((l) => (
          <Link key={l.id} href={`/login/loja/${l.id}`} className="user-pick">
            <div className="avatar">🏬</div>
            <div>{l.nome}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
