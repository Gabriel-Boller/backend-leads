"use client";

import { useMemo, useState } from "react";
import ItemFormModal, { type ItemEdit } from "@/components/producao/ItemFormModal";
import { pausarOuAtivarItem } from "@/app/app/producao/actions";

type ItemRow = ItemEdit & { ativo: boolean };

const TIPO_LABEL: Record<string, string> = { PRODUTO: "Produto", INSUMO: "Insumo" };

export default function ItensTable({ itens }: { itens: ItemRow[] }) {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "PRODUTO" | "INSUMO">("todos");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return itens.filter(
      (i) =>
        (tipoFiltro === "todos" || i.tipo === tipoFiltro) &&
        (!q || i.nome.toLowerCase().includes(q) || (i.codigo || "").toLowerCase().includes(q))
    );
  }, [itens, busca, tipoFiltro]);

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row">
          <input type="text" placeholder="Buscar por nome ou código..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value as typeof tipoFiltro)} style={{ flex: "0 0 auto", minWidth: 160 }}>
            <option value="todos">Todos os tipos</option>
            <option value="PRODUTO">Só produtos</option>
            <option value="INSUMO">Só insumos</option>
          </select>
        </div>
      </div>

      {filtrados.length === 0 && <div className="empty">Nenhum item encontrado.</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Unidade</th>
              <th>Código</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((i) => (
              <tr key={i.id}>
                <td>
                  <b>{i.nome}</b>
                </td>
                <td>
                  <span className={`tag ${i.tipo === "PRODUTO" ? "photo" : ""}`}>{TIPO_LABEL[i.tipo]}</span>
                </td>
                <td>{i.unidade}</td>
                <td>{i.codigo || "—"}</td>
                <td>
                  <form action={pausarOuAtivarItem.bind(null, i.id)}>
                    <button
                      type="submit"
                      className={`tag ${i.ativo ? "ok" : ""}`}
                      style={{ border: "none", cursor: "pointer" }}
                      title={i.ativo ? "Clique para desativar" : "Clique para reativar"}
                    >
                      {i.ativo ? "● Ativo" : "○ Inativo"}
                    </button>
                  </form>
                </td>
                <td>
                  <ItemFormModal trigger="Editar" triggerClassName="btn btn-outline btn-sm" item={i} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
