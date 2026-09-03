import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function LoginPessoaPage({
  params,
}: {
  params: Promise<{ lojaId: string }>;
}) {
  const { lojaId } = await params;
  const loja = await prisma.loja.findUnique({ where: { id: lojaId } });
  if (!loja) notFound();

  const pessoas = await prisma.usuario.findMany({
    where: { lojaId, papel: { in: ["LIDER", "COLABORADOR"] }, ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="center-screen">
      <div className="card login-card">
        <Link href="/login/loja" className="back-link">
          ‹ Voltar
        </Link>
        <h1 className="login-title">{loja.nome}</h1>
        <p className="login-sub">Selecione seu nome</p>
        {pessoas.length === 0 && (
          <p className="task-desc">Nenhuma pessoa cadastrada nesta loja ainda.</p>
        )}
        {pessoas.map((u) => (
          <Link key={u.id} href={`/login/pin/${u.id}`} className="user-pick">
            <div className="avatar">{u.nome[0]}</div>
            <div>
              {u.nome}{" "}
              <span className="pill" style={{ marginLeft: 6 }}>
                {u.papel === "LIDER" ? "Líder" : "Colaborador"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
