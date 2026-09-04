import type { RankingItem } from "@/lib/dashboard";

export default function RankingList({ titulo, sub, itens, limite = 5 }: { titulo: string; sub: string; itens: RankingItem[]; limite?: number }) {
  const visiveis = itens.slice(0, limite);
  return (
    <div className="card">
      <div className="section-head" style={{ marginBottom: 4 }}>
        <h2>{titulo}</h2>
      </div>
      <p className="task-desc" style={{ marginTop: 0 }}>
        {sub}
      </p>
      {visiveis.length === 0 && <p className="task-desc">Sem dados no período.</p>}
      {visiveis.map((item, i) => (
        <div key={item.id} className="list-user">
          <span>
            <b style={{ color: "var(--ink-soft)", marginRight: 8 }}>{i + 1}</b>
            {item.nome}
          </span>
          <b>{item.pct}%</b>
        </div>
      ))}
    </div>
  );
}
