export default function MeterTile({ pct, label, sub }: { pct: number; label: string; sub?: string }) {
  return (
    <div className="card">
      <div className="section-head" style={{ marginBottom: 4 }}>
        <h2>{label}</h2>
      </div>
      <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{pct}%</div>
      {sub && <p className="task-desc" style={{ margin: "4px 0 12px" }}>{sub}</p>}
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "var(--line)",
          overflow: "hidden",
          marginTop: sub ? 0 : 12,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, Math.max(0, pct))}%`,
            background: "var(--primary)",
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}
