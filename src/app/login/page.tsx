import Link from "next/link";

export default function LoginRolePage() {
  return (
    <div className="center-screen">
      <div className="card login-card">
        <div className="login-logo">✓</div>
        <h1 className="login-title">Checklist das Lojas</h1>
        <p className="login-sub">Como você quer entrar?</p>
        <Link href="/login/dono" className="btn btn-soft btn-block" style={{ marginBottom: 10 }}>
          Sou o dono
        </Link>
        <Link href="/login/loja" className="btn btn-outline btn-block">
          Sou líder ou colaborador de uma loja
        </Link>
      </div>
    </div>
  );
}
