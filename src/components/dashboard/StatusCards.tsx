import type { StatusBreakdown } from "@/lib/dashboard";

const ITENS: { key: keyof Omit<StatusBreakdown, "total">; label: string; icon: string; tom: "neutro" | "warn" | "danger" | "success" }[] = [
  { key: "naoIniciado", label: "Não iniciado", icon: "○", tom: "neutro" },
  { key: "iniciado", label: "Iniciado", icon: "◐", tom: "warn" },
  { key: "atrasado", label: "Atrasado", icon: "⚠", tom: "danger" },
  { key: "naoExecutado", label: "Não executado", icon: "⊘", tom: "danger" },
  { key: "finalizado", label: "Finalizado", icon: "✓", tom: "success" },
];

const CORES: Record<string, { bg: string; fg: string }> = {
  neutro: { bg: "var(--bg-soft)", fg: "var(--ink-soft)" },
  warn: { bg: "var(--warn-bg)", fg: "var(--warn)" },
  danger: { bg: "var(--danger-bg)", fg: "var(--danger)" },
  success: { bg: "var(--success-bg)", fg: "var(--success)" },
};

export default function StatusCards({ status }: { status: StatusBreakdown }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 16 }}>
      {ITENS.map(({ key, label, icon, tom }) => {
        const cor = CORES[tom];
        const valor = status[key];
        const pctDoTotal = status.total ? Math.round((100 * valor) / status.total) : 0;
        return (
          <div key={key} className="stat" style={{ background: cor.bg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: cor.fg, fontSize: 13, fontWeight: 700 }}>
              <span aria-hidden>{icon}</span>
              {label}
            </div>
            <div className="stat-num" style={{ marginTop: 4 }}>
              {valor}
            </div>
            <div className="stat-label">{pctDoTotal}% do total</div>
          </div>
        );
      })}
    </div>
  );
}
