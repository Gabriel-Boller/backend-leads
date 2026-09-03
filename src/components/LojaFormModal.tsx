"use client";

import Modal from "@/components/Modal";
import { criarLoja } from "@/app/app/equipe/actions";

export default function LojaFormModal({ trigger, triggerClassName }: { trigger: React.ReactNode; triggerClassName?: string }) {
  return (
    <Modal trigger={trigger} triggerClassName={triggerClassName} title="Nova loja">
      {(close) => (
        <form action={criarLoja} onSubmit={close}>
          <div className="field">
            <label>Nome da loja</label>
            <input type="text" name="nome" placeholder="Ex: Loja Centro" required />
          </div>
          <button className="btn btn-primary btn-block" type="submit">
            Criar loja
          </button>
        </form>
      )}
    </Modal>
  );
}
