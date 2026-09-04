"use client";

import { useEffect, useRef, useState } from "react";

const ROLE_LABEL: Record<string, string> = {
  DONO: "Dono",
  LIDER: "Líder",
  COLABORADOR: "Colaborador",
};

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const letras = [partes[0]?.[0], partes[partes.length - 1]?.[0]].filter(Boolean);
  return letras.join("").toUpperCase() || "?";
}

export default function UserMenu({
  nome,
  email,
  contato,
  papel,
  sair,
}: {
  nome: string;
  email: string;
  contato: string | null;
  papel: string;
  sair: () => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="avatar-btn"
        onClick={() => setAberto((v) => !v)}
        aria-label={`Conta de ${nome}`}
        aria-expanded={aberto}
      >
        {iniciais(nome)}
      </button>

      {aberto && (
        <div className="user-menu-panel">
          <div className="user-menu-head">
            <div className="avatar-btn avatar-lg">{iniciais(nome)}</div>
            <div>
              <div className="user-menu-nome">{nome}</div>
              <span className="pill">{ROLE_LABEL[papel] || papel}</span>
            </div>
          </div>
          <div className="user-menu-info">
            <div>{email}</div>
            {contato && <div>{contato}</div>}
          </div>
          <form action={sair}>
            <button className="logout-btn" type="submit" style={{ width: "100%" }}>
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
