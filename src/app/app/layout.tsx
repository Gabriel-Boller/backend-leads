import { requireUsuario } from "@/lib/auth";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { calcAlertas } from "@/lib/alertas";
import Tabs from "@/components/Tabs";
import { sair } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  DONO: "Dono",
  LIDER: "Líder",
  COLABORADOR: "Colaborador",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUsuario();

  let alertCount = 0;
  if (user.papel !== "COLABORADOR") {
    const lojaIds = await lojaIdsVisiveis(user);
    alertCount = (await calcAlertas(lojaIds)).length;
  }

  return (
    <div id="app-shell">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">✓</div>Checklist das Lojas
        </div>
        <div className="who">
          <span className="pill">{ROLE_LABEL[user.papel]}</span>
          <span>
            <b>{user.nome}</b>
          </span>
          <form action={sair}>
            <button className="logout-btn" type="submit">
              Sair
            </button>
          </form>
        </div>
      </div>
      <Tabs papel={user.papel} alertCount={alertCount} />
      <div className="content">{children}</div>
    </div>
  );
}
