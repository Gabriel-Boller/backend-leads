"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { lancarMovimento } from "@/app/app/caixa/actions";
import type { CaixaMovimentoTipo } from "@prisma/client";

export default function LancarMovimentoModal({
  caixaId,
  tipo,
  trigger,
  triggerClassName,
}: {
  caixaId: string;
  tipo: CaixaMovimentoTipo;
  trigger: React.ReactNode;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const label = tipo === "ENTRADA" ? "entrada" : "saída";

  return (
    <Modal trigger={trigger} triggerClassName={triggerClassName} title={tipo === "ENTRADA" ? "Lançar entrada" : "Lançar saída"}>
      {(close) => (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setEnviando(true);
            setErro(null);
            const resultado = await lancarMovimento(caixaId, tipo, new FormData(e.currentTarget));
            setEnviando(false);
            if (!resultado.ok) {
              setErro(resultado.erro);
              return;
            }
            close();
            router.refresh();
          }}
        >
          {erro && <p className="error-text">{erro}</p>}
          {tipo === "ENTRADA" && (
            <p className="task-desc">
              Use só pra dinheiro extra colocado no caixa (reforço de troco, por exemplo) — vendas não são lançadas aqui.
            </p>
          )}
          <div className="field">
            <label>Valor da {label}</label>
            <input type="number" name="valor" step="0.01" min="0.01" inputMode="decimal" placeholder="0,00" required autoFocus />
          </div>
          <div className="field">
            <label>Observação (opcional)</label>
            <textarea
              name="observacao"
              rows={2}
              placeholder={tipo === "ENTRADA" ? "Ex: reforço de troco" : "Ex: sangria, pagamento de fornecedor"}
            />
          </div>
          <button className={`btn btn-block ${tipo === "ENTRADA" ? "btn-primary" : "btn-danger"}`} type="submit" disabled={enviando}>
            {enviando ? "Lançando…" : `Lançar ${label}`}
          </button>
        </form>
      )}
    </Modal>
  );
}
