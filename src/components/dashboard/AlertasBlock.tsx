import type { Alerta } from "@/lib/alertas";
import { fmtDatePretty } from "@/lib/dates";

export default function AlertasBlock({ alertas }: { alertas: Alerta[] }) {
  return (
    <div className="card">
      <div className="section-head" style={{ marginBottom: 4 }}>
        <h2>Alertas</h2>
      </div>
      <p className="task-desc" style={{ marginTop: 0 }}>
        Tarefas atrasadas hoje (depois do horário) ou sem conclusão no período selecionado
      </p>

      {alertas.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✅</div>
          <p>Nenhuma pendência no período.</p>
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
    </div>
  );
}
