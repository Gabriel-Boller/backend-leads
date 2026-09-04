import { requireUsuario } from "@/lib/auth";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { calcAlertas } from "@/lib/alertas";
import { isoDate, daysAgo, todayISO } from "@/lib/dates";
import Tabs from "@/components/Tabs";
import UserMenu from "@/components/UserMenu";
import { sair } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUsuario();

  let alertCount = 0;
  if (user.papel !== "COLABORADOR") {
    const lojaIds = await lojaIdsVisiveis(user);
    alertCount = (await calcAlertas(lojaIds, isoDate(daysAgo(6)), todayISO())).length;
  }

  return (
    <div id="app-shell">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">✓</div>Checklist das Lojas
        </div>
        <UserMenu nome={user.nome} email={user.email} contato={user.contato} papel={user.papel} sair={sair} />
      </div>
      <Tabs papel={user.papel} alertCount={alertCount} />
      <div className="content">{children}</div>
    </div>
  );
}
