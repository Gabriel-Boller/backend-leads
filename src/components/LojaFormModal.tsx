"use client";

import Modal from "@/components/Modal";
import { criarLoja, editarLoja } from "@/app/app/equipe/actions";

export default function LojaFormModal({
  trigger,
  triggerClassName,
  loja,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  loja?: { id: string; nome: string };
}) {
  const isEdit = !!loja;
  const action = isEdit ? editarLoja.bind(null, loja!.id) : criarLoja;

  return (
    <Modal trigger={trigger} triggerClassName={triggerClassName} title={isEdit ? "Editar loja" : "Nova loja"}>
      {(close) => (
        <form action={action} onSubmit={close}>
          <div className="field">
            <label>Nome da loja</label>
            <input type="text" name="nome" defaultValue={loja?.nome} placeholder="Ex: Loja Centro" required />
          </div>
          <button className="btn btn-primary btn-block" type="submit">
            {isEdit ? "Salvar" : "Criar loja"}
          </button>
        </form>
      )}
    </Modal>
  );
}
