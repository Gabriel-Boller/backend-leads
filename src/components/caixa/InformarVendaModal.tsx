"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { informarVendaCaixa } from "@/app/app/caixa/actions";

export default function InformarVendaModal({
  caixaId,
  vendaInformada,
  trigger,
  triggerClassName,
}: {
  caixaId: string;
  vendaInformada?: number | null;
  trigger: React.ReactNode;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <Modal trigger={trigger} triggerClassName={triggerClassName} title="Venda em dinheiro">
      {(close) => (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setEnviando(true);
            setErro(null);
            const resultado = await informarVendaCaixa(caixaId, new FormData(e.currentTarget));
            setEnviando(false);
            if (!resultado.ok) {
              setErro(resultado.erro);
              return;
            }
            close();
            router.refresh();
          }}
        >
          <p className="task-desc">
            Consulte no sistema de vendas quanto foi vendido em dinheiro nesse caixa e informe aqui — o sistema compara com o
            que a contagem física implica.
          </p>
          {erro && <p className="error-text">{erro}</p>}
          <div className="field">
            <label>Venda em dinheiro (segundo o sistema de vendas)</label>
            <input
              type="number"
              name="vendaInformada"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={vendaInformada ?? undefined}
              required
              autoFocus
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar"}
          </button>
        </form>
      )}
    </Modal>
  );
}
