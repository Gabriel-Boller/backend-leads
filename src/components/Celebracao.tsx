"use client";

const EMOJIS = ["🎉", "✨", "🎊", "⭐", "✅"];

// Gerado uma vez no carregamento do módulo (fora da renderização do componente)
// porque usa Math.random, que é impuro e não pode rodar durante o render.
const CONFETES = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  left: Math.round(Math.random() * 100),
  delay: (Math.random() * 0.5).toFixed(2),
  duration: (1.2 + Math.random() * 0.8).toFixed(2),
  emoji: EMOJIS[i % EMOJIS.length],
}));

export default function Celebracao({ titulo, sub }: { titulo: string; sub: string }) {
  return (
    <div className="celebracao">
      {CONFETES.map((c) => (
        <span
          key={c.id}
          className="confete"
          style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s` }}
        >
          {c.emoji}
        </span>
      ))}
      <span className="celebracao-emoji">🎉</span>
      <p className="celebracao-titulo">{titulo}</p>
      <p className="celebracao-sub">{sub}</p>
    </div>
  );
}
