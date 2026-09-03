import { entrar } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div className="center-screen">
      <div className="card login-card">
        <div className="login-logo">✓</div>
        <h1 className="login-title">Checklist das Lojas</h1>
        <p className="login-sub">Entre com seu e-mail e senha</p>
        <form action={entrar}>
          <div className="field">
            <label>E-mail</label>
            <input type="email" name="email" autoComplete="username" required autoFocus />
          </div>
          <div className="field">
            <label>Senha</label>
            <input type="password" name="senha" autoComplete="current-password" required />
          </div>
          {erro && <p className="error-text">E-mail ou senha incorretos.</p>}
          <button type="submit" className="btn btn-primary btn-block">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
