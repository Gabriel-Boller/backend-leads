import { requirePapel } from "@/lib/auth";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { calcAlertas } from "@/lib/alertas";
import { fmtDatePretty, periodoParaRange, type Periodo } from "@/lib/dates";
import PeriodoFields from "@/components/PeriodoFields";

const PERIODOS_VALIDOS: Periodo[] = ["hoje", "7dias", "30dias", "mes", "mes_passado", "personalizado"];

export default async function AlertasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  const user = await requirePapel(["DONO", "LIDER"]);
  const sp = await searchParams;

  const periodo = PERIODOS_VALIDOS.includes(sp.periodo as Periodo) ? (sp.periodo as Periodo) : "7dias";
  const { de, ate } = periodoParaRange(periodo, sp.de, sp.ate);

  const lojaIds = await lojaIdsVisiveis(user);
  const alertas = await calcAlertas(lojaIds, de, ate);

  return (
    <>
      <h1 className="page-title">Alertas</h1>
      <p className="page-sub">Tarefas atrasadas hoje (depois do horário) ou sem conclusão no período</p>

      <form className="card" style={{ marginBottom: 16 }}>
        <div className="row">
          <PeriodoFields periodo={periodo} de={de} ate={ate} />
        </div>
        <button className="btn btn-soft" style={{ marginTop: 12 }} type="submit">
          Aplicar
        </button>
      </form>

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
    </>
  );
}
