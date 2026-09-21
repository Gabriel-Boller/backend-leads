"use client";

import { useState } from "react";
import { salvarFichaTecnica } from "@/app/app/producao/actions";

type Insumo = { id: string; nome: string; unidade: string };
type Linha = { insumoId: string; quantidade: string };

export default function FichaTecnicaEditor({
  produtoId,
  produtoNome,
  produtoUnidade,
  insumos,
  linhasIniciais,
}: {
  produtoId: string;
  produtoNome: string;
  produtoUnidade: string;
  insumos: Insumo[];
  linhasIniciais: { insumoId: string; quantidadePorUnidade: number }[];
}) {
  const [linhas, setLinhas] = useState<Linha[]>(
    linhasIniciais.length > 0
      ? linhasIniciais.map((l) => ({ insumoId: l.insumoId, quantidade: String(l.quantidadePorUnidade) }))
      : []
  );

  const insumoPorId = new Map(insumos.map((i) => [i.id, i]));
  const idsUsados = new Set(linhas.map((l) => l.insumoId));
  const disponiveis = insumos.filter((i) => !idsUsados.has(i.id));

  const adicionarLinha = () => {
    if (disponiveis.length === 0) return;
    setLinhas([...linhas, { insumoId: disponiveis[0].id, quantidade: "" }]);
  };

  const atualizarLinha = (idx: number, campo: keyof Linha, valor: string) => {
    setLinhas(linhas.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)));
  };

  const removerLinha = (idx: number) => setLinhas(linhas.filter((_, i) => i !== idx));

  return (
    <div className="card">
      <div className="section-head">
        <h2>
          Ficha técnica — {produtoNome} <small className="hint" style={{ display: "inline" }}>(por 1 {produtoUnidade})</small>
        </h2>
      </div>

      {insumos.length === 0 ? (
        <div className="empty">Cadastre insumos na aba &quot;Itens&quot; antes de montar essa ficha técnica.</div>
      ) : (
        <form action={salvarFichaTecnica}>
          <input type="hidden" name="produtoId" value={produtoId} />

          {linhas.length === 0 && <p className="task-desc">Nenhum insumo adicionado ainda.</p>}

          {linhas.map((linha, idx) => {
            const outrosIds = new Set(linhas.filter((_, i) => i !== idx).map((l) => l.insumoId));
            const opcoes = insumos.filter((i) => !outrosIds.has(i.id) || i.id === linha.insumoId);
            const unidade = insumoPorId.get(linha.insumoId)?.unidade || "";
            return (
              <div className="row" key={idx} style={{ marginBottom: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 2, minWidth: 180 }}>
                  {idx === 0 && <label>Insumo</label>}
                  <select name="insumoId" value={linha.insumoId} onChange={(e) => atualizarLinha(idx, "insumoId", e.target.value)}>
                    {opcoes.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  {idx === 0 && <label>Quantidade ({unidade || "un"})</label>}
                  <input
                    type="number"
                    name="quantidade"
                    step="0.0001"
                    min="0"
                    value={linha.quantidade}
                    onChange={(e) => atualizarLinha(idx, "quantidade", e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ flex: "0 0 auto" }}
                  onClick={() => removerLinha(idx)}
                  aria-label="Remover insumo"
                >
                  Remover
                </button>
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={adicionarLinha} disabled={disponiveis.length === 0}>
              + Adicionar insumo
            </button>
            <button className="btn btn-primary btn-sm" type="submit">
              Salvar ficha técnica
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
