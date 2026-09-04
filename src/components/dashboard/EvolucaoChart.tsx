import type { PontoEvolucao } from "@/lib/dashboard";
import { fmtDatePretty } from "@/lib/dates";

const W = 760;
const H = 220;
const PAD_L = 34;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;

export default function EvolucaoChart({ pontos }: { pontos: PontoEvolucao[] }) {
  if (pontos.length === 0) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Evolução da taxa de conclusão</h2>
        <p className="task-desc">Sem dados no período.</p>
      </div>
    );
  }

  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const n = pontos.length;
  const x = (i: number) => PAD_L + (n > 1 ? (plotW * i) / (n - 1) : plotW / 2);
  const y = (pct: number) => PAD_T + plotH * (1 - pct / 100);

  const pathPoints = pontos.map((p, i) => `${x(i)},${y(p.pct)}`).join(" ");
  const areaPath = `M${x(0)},${y(0)} L${pathPoints.split(" ").join(" L")} L${x(n - 1)},${y(0)} Z`;
  const ultimo = pontos[n - 1];

  return (
    <div className="card">
      <h2 style={{ marginTop: 0, marginBottom: 2 }}>Evolução da taxa de conclusão</h2>
      <p className="task-desc" style={{ marginTop: 0 }}>
        Percentual de tarefas concluídas por dia
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Gráfico de evolução da taxa de conclusão">
        {[0, 50, 100].map((tick) => (
          <g key={tick}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(tick)} y2={y(tick)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD_L - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--ink-soft)">
              {tick}%
            </text>
          </g>
        ))}

        <path d={areaPath} fill="var(--primary)" fillOpacity={0.1} stroke="none" />
        <polyline points={pathPoints} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={x(n - 1)} cy={y(ultimo.pct)} r={4} fill="var(--primary)" stroke="var(--bg)" strokeWidth={2} />
        <text x={x(n - 1)} y={y(ultimo.pct) - 10} textAnchor="end" fontSize={11} fontWeight={700} fill="var(--ink)">
          {ultimo.pct}%
        </text>

        <text x={x(0)} y={H - 8} textAnchor="start" fontSize={10} fill="var(--ink-soft)">
          {fmtDatePretty(pontos[0].data)}
        </text>
        <text x={x(n - 1)} y={H - 8} textAnchor="end" fontSize={10} fill="var(--ink-soft)">
          {fmtDatePretty(pontos[n - 1].data)}
        </text>
      </svg>
    </div>
  );
}
