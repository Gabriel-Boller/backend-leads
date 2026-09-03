"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="content">
      <div className="card" style={{ borderColor: "var(--danger)" }}>
        <h2 style={{ color: "var(--danger)", marginTop: 0 }}>Algo deu errado</h2>
        <p className="task-desc">{error.message || "Tente novamente em instantes."}</p>
        <button className="btn btn-outline" onClick={() => reset()}>
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
