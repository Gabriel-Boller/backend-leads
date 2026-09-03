import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { entrarComPin } from "../../actions";

export default async function LoginPinPage({
  params,
  searchParams,
}: {
  params: Promise<{ usuarioId: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { usuarioId } = await params;
  const { erro } = await searchParams;

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario || !usuario.ativo) notFound();

  const voltarHref =
    usuario.papel === "DONO"
      ? "/login/dono"
      : usuario.lojaId
        ? `/login/loja/${usuario.lojaId}`
        : "/login";

  const action = entrarComPin.bind(null, usuarioId);

  return (
    <div className="center-screen">
      <div className="card login-card" style={{ maxWidth: 340, textAlign: "center" }}>
        <Link href={voltarHref} className="back-link">
          ‹ Voltar
        </Link>
        <div className="avatar" style={{ margin: "0 auto 10px", width: 52, height: 52, fontSize: 20 }}>
          {usuario.nome[0]}
        </div>
        <h3 style={{ marginBottom: 2 }}>{usuario.nome}</h3>
        <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 0 }}>Digite seu PIN</p>
        <form action={action}>
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            autoFocus
            style={{ textAlign: "center", letterSpacing: 6, fontSize: 20 }}
            maxLength={6}
          />
          {erro && <p className="error-text">PIN incorreto. Tente novamente.</p>}
          <div className="row" style={{ marginTop: 14 }}>
            <button type="submit" className="btn btn-primary btn-block">
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
