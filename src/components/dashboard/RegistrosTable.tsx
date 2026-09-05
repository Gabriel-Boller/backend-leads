"use client";

import { useMemo, useState } from "react";
import type { TipoConfirmacao } from "@/lib/relatorio";

type Registro = {
  id: string;
  data: string;
  hora: string;
  colaboradorNome: string;
  lojaNome: string;
  tarefaTitulo: string;
  categoria: string | null;
  tipoConfirmacao: TipoConfirmacao;
  link: string | null;
  fotoUrl: string | null;
};

const TIPO_LABEL: Record<TipoConfirmacao, string> = {
  FOTO: "📷 Foto",
  LINK: "🔗 Link",
  SIMPLES: "✅ Simples",
};

export default function RegistrosTable({ registros, mostrarLoja }: { registros: Registro[]; mostrarLoja: boolean }) {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | TipoConfirmacao>("todos");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return registros.filter(
      (r) =>
        (tipoFiltro === "todos" || r.tipoConfirmacao === tipoFiltro) &&
        (!q ||
          r.colaboradorNome.toLowerCase().includes(q) ||
          r.tarefaTitulo.toLowerCase().includes(q) ||
          (r.categoria || "").toLowerCase().includes(q))
    );
  }, [registros, busca, tipoFiltro]);

  return (
    <div className="card">
      <div className="section-head" style={{ marginBottom: 4 }}>
        <h2 style={{ fontSize: 15 }}>Tarefas realizadas</h2>
        <span className="page-sub" style={{ margin: 0 }}>
          {filtrados.length} de {registros.length}
        </span>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Buscar por colaborador, tarefa ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value as typeof tipoFiltro)} style={{ flex: "0 0 auto", minWidth: 160 }}>
          <option value="todos">Toda confirmação</option>
          <option value="FOTO">📷 Foto</option>
          <option value="LINK">🔗 Link</option>
          <option value="SIMPLES">✅ Simples</option>
        </select>
      </div>

      {filtrados.length === 0 && <div className="empty">Nenhum registro encontrado nesse período.</div>}

      {filtrados.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Colaborador</th>
                {mostrarLoja && <th>Loja</th>}
                <th>Tarefa</th>
                <th>Confirmação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {r.data.split("-").reverse().join("/")} <span style={{ color: "var(--ink-soft)" }}>{r.hora}</span>
                  </td>
                  <td>{r.colaboradorNome}</td>
                  {mostrarLoja && <td>{r.lojaNome}</td>}
                  <td>
                    {r.tarefaTitulo}
                    {r.categoria && (
                      <span className="tag" style={{ marginLeft: 8 }}>
                        {r.categoria}
                      </span>
                    )}
                  </td>
                  <td>
                    {r.tipoConfirmacao === "FOTO" && r.fotoUrl ? (
                      <a href={r.fotoUrl} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.fotoUrl} alt="Foto enviada" className="photo-thumb" />
                      </a>
                    ) : r.tipoConfirmacao === "LINK" && r.link ? (
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="tag">
                        🔗 Abrir link
                      </a>
                    ) : (
                      <span className="tag ok">{TIPO_LABEL[r.tipoConfirmacao]}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
