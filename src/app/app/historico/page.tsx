import { requirePapel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { carregarTarefasAtivasDaLoja, tarefasEsperadasParaUsuario } from "@/lib/tarefas";
import { isoDate, daysAgo, fmtDatePretty, agoraNaLoja, DIAS_SEMANA_LABEL } from "@/lib/dates";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default async function HistoricoPage() {
  const sessao = await requirePapel(["COLABORADOR"]);
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: sessao.id } });
  if (!usuario.lojaId) {
    return <p className="task-desc">Você ainda não está vinculado a uma loja.</p>;
  }

  const tarefasDaLoja = await carregarTarefasAtivasDaLoja(usuario.lojaId);
  const hoje = agoraNaLoja();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();

  const instancias = await prisma.tarefaInstancia.findMany({
    where: { usuarioId: usuario.id, data: { gte: primeiroDiaMes < daysAgo(10) ? primeiroDiaMes : daysAgo(10) } },
    select: { tarefaId: true, data: true },
  });
  const feitosPorDia = new Map<string, number>();
  for (const i of instancias) {
    const iso = isoDate(i.data);
    feitosPorDia.set(iso, (feitosPorDia.get(iso) || 0) + 1);
  }

  type DiaInfo = { total: number; feitas: number };
  const calcularDia = (d: Date): DiaInfo => {
    const esperadas = tarefasEsperadasParaUsuario(usuario, d, tarefasDaLoja);
    const iso = isoDate(d);
    return { total: esperadas.length, feitas: feitosPorDia.get(iso) || 0 };
  };

  // últimos 10 dias (lista com barra)
  const linhas: { iso: string; total: number; feitas: number }[] = [];
  for (let n = 0; n < 10; n++) {
    const d = daysAgo(n);
    const info = calcularDia(d);
    if (info.total === 0) continue;
    linhas.push({ iso: isoDate(d), ...info });
  }

  // mês inteiro (calendário)
  type CelulaDia = { dia: number; iso: string; futuro: boolean; info: DiaInfo | null };
  const celulas: CelulaDia[] = [];
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
    const futuro = d > hoje;
    celulas.push({ dia, iso: isoDate(d), futuro, info: futuro ? null : calcularDia(d) });
  }
  const espacosVazios = primeiroDiaMes.getDay();

  return (
    <>
      <h1 className="page-title">Histórico</h1>
      <p className="page-sub">
        {MESES[hoje.getMonth()]} de {hoje.getFullYear()}
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 8,
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink-soft)",
            textAlign: "center",
          }}
        >
          {DIAS_SEMANA_LABEL.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {Array.from({ length: espacosVazios }).map((_, i) => (
            <div key={`vazio-${i}`} />
          ))}
          {celulas.map((c) => {
            const isHoje = c.iso === isoDate(hoje);
            let bg = "var(--bg-soft)";
            let cor = "var(--ink-soft)";
            if (!c.futuro && c.info) {
              if (c.info.total === 0) {
                bg = "var(--bg-soft)";
              } else if (c.info.feitas === c.info.total) {
                bg = "var(--success-bg)";
                cor = "var(--success)";
              } else if (c.info.feitas === 0) {
                bg = "var(--danger-bg)";
                cor = "var(--danger)";
              } else {
                bg = "var(--warn-bg)";
                cor = "var(--warn)";
              }
            }
            return (
              <div
                key={c.iso}
                title={c.info && c.info.total > 0 ? `${c.info.feitas}/${c.info.total} concluídas` : undefined}
                style={{
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  background: bg,
                  color: c.futuro ? "var(--ink-soft)" : cor,
                  fontSize: 12.5,
                  fontWeight: isHoje ? 800 : 600,
                  opacity: c.futuro ? 0.4 : 1,
                  border: isHoje ? "2px solid var(--primary)" : "1px solid transparent",
                }}
              >
                {c.dia}
              </div>
            );
          })}
        </div>
        <div className="row" style={{ marginTop: 12, fontSize: 11.5, color: "var(--ink-soft)", gap: 14 }}>
          <span>🟩 Tudo concluído</span>
          <span>🟨 Parcial</span>
          <span>🟥 Nada concluído</span>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 15 }}>Últimos dias</h2>
        {linhas.length === 0 && <p className="task-desc">Nenhum histórico ainda.</p>}
        {linhas.map((r) => {
          const pct = r.total ? Math.round((100 * r.feitas) / r.total) : 0;
          return (
            <div key={r.iso} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{fmtDatePretty(r.iso)}</span>
                <b>
                  {r.feitas}/{r.total} {r.feitas === r.total ? "✅" : r.feitas === 0 ? "⚠️" : ""}
                </b>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    borderRadius: 999,
                    background: pct === 100 ? "var(--success)" : pct === 0 ? "var(--danger)" : "var(--warn)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
