"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { salvarItem } from "@/app/app/producao/actions";

export type ItemEdit = {
  id: string;
  nome: string;
  tipo: "PRODUTO" | "INSUMO";
  unidade: string;
  codigo: string | null;
};

const UNIDADES_SUGERIDAS = ["kg", "g", "L", "ml", "un", "cx", "pct", "dz"];

export default function ItemFormModal({
  trigger,
  triggerClassName,
  item,
  tipoFixo,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  item?: ItemEdit;
  /** Quando definido, trava o tipo (ex: botão "+ Produto" já cria como PRODUTO). */
  tipoFixo?: "PRODUTO" | "INSUMO";
}) {
  const isEdit = !!item;
  const [tipo, setTipo] = useState<"PRODUTO" | "INSUMO">(item?.tipo || tipoFixo || "PRODUTO");

  const resetEstado = () => setTipo(item?.tipo || tipoFixo || "PRODUTO");

  return (
    <Modal
      trigger={trigger}
      triggerClassName={triggerClassName}
      title={isEdit ? "Editar item" : "Novo item"}
      onClose={resetEstado}
    >
      {(close) => (
        <form action={salvarItem} onSubmit={close}>
          {isEdit && <input type="hidden" name="id" value={item!.id} />}
          <div className="field">
            <label>Nome</label>
            <input type="text" name="nome" defaultValue={item?.nome} placeholder="Ex: Pão de hambúrguer, Farinha de trigo..." required />
          </div>

          <div className="field">
            <label>Tipo</label>
            {tipoFixo ? (
              <input type="hidden" name="tipo" value={tipoFixo} />
            ) : (
              <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} disabled={isEdit}>
                <option value="PRODUTO">Produto (item que a loja produz, com ficha técnica)</option>
                <option value="INSUMO">Insumo (matéria-prima usada nas fichas técnicas)</option>
              </select>
            )}
            {isEdit && <input type="hidden" name="tipo" value={item!.tipo} />}
            {isEdit && <small className="hint">O tipo não pode ser alterado depois de criado.</small>}
          </div>

          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Unidade de medida</label>
              <input type="text" name="unidade" list="unidades-sugeridas" defaultValue={item?.unidade || ""} placeholder="kg, un, L..." required />
              <datalist id="unidades-sugeridas">
                {UNIDADES_SUGERIDAS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Código (opcional)</label>
              <input type="text" name="codigo" defaultValue={item?.codigo || ""} placeholder="SKU interno" />
            </div>
          </div>

          <button className="btn btn-primary btn-block" type="submit">
            {isEdit ? "Salvar alterações" : "Criar item"}
          </button>
        </form>
      )}
    </Modal>
  );
}
