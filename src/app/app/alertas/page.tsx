import { requirePapel } from "@/lib/auth";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { calcAlertas } from "@/lib/alertas";
import { fmtDatePretty } from "@/lib/dates";

export default async function AlertasPage() {
  const user = await requirePapel(["DONO", "LIDER"]);
  const lojaIds = await lojaIdsVisiveis(user);
  const alertas = await calcAlertas(lojaIds);

  return (
    <>
      <h1 className="page-title">Alertas</h1>
      <p className="page-sub">Tarefas atrasadas hoje (depois do horário) ou sem conclusão em dias anteriores</p>

      {alertas.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✅</div>
          <p>Nenhuma pendência.</p>
        </div>
      ) : (
        alertas.map((a, i) => (
          <div key={`${a.tarefaId}-${a.usuarioId}-${a.data}-${i}`} className="alert-item">
            <span>⚠️</span>
            <div>
              <b>{a.usuarioNome}</b> não concluiu &quot;{a.tarefaTitulo}&quot; em {fmtDatePretty(a.data)}
            </div>
          </div>
        ))
      )}
    </>
  );
}
