import Link from "next/link";
import { requireUsuario } from "@/lib/auth";
import { appsDoUsuario } from "@/lib/apps";
import UserMenu from "@/components/UserMenu";
import { sair } from "./app/actions";

// HUB: primeira tela depois do login. Mostra só os apps que o usuário pode abrir.
export default async function HubPage() {
  const user = await requireUsuario();
  const apps = appsDoUsuario(user);

  return (
    <div id="app-shell">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">✓</div>Gestão das Lojas
        </div>
        <UserMenu nome={user.nome} email={user.email} contato={user.contato} papel={user.papel} sair={sair} />
      </div>
      <div className="content">
        <h1 className="page-title">Olá, {user.nome.split(" ")[0]}</h1>
        <p className="page-sub">Escolha o sistema que você quer abrir.</p>
        <div className="grid grid-2">
          {apps.map((app) => (
            <Link key={app.chave} href={app.href} prefetch={false} className="card hub-card">
              <div className="brand-mark" aria-hidden>
                {app.icone}
              </div>
              <div>
                <div className="hub-card-nome">{app.nome}</div>
                <div className="hub-card-desc">{app.descricao}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
