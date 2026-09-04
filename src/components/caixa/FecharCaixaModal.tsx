"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { fecharCaixa } from "@/app/app/caixa/actions";
import { formatBRL } from "@/lib/dinheiro";

export default function FecharCaixaModal({
  caixaId,
  valorEsperado,
  trigger,
  triggerClassName,
}: {
  caixaId: string;
  /** Só passe isso pra dono/líder — colaborador nunca deve ver o valor esperado antes de contar. */
  valorEsperado?: number;
  trigger: React.ReactNode;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <Modal trigger={trigger} triggerClassName={triggerClassName} title="Fechar caixa">
      {(close) => (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setEnviando(true);
            setErro(null);
            const resultado = await fecharCaixa(caixaId, new FormData(e.currentTarget));
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
          {typeof valorEsperado === "number" && (
            <div className="stat" style={{ marginBottom: 14 }}>
              <div className="stat-num">{formatBRL(valorEsperado)}</div>
              <div className="stat-label">Valor esperado em caixa (abertura + entradas − saídas)</div>
            </div>
          )}
          <div className="field">
            <label>Quanto você contou no caixa?</label>
            <input type="number" name="valorContado" step="0.01" min="0" inputMode="decimal" placeholder="0,00" required autoFocus />
          </div>
          <div className="field">
            <label>Observação (opcional)</label>
            <textarea name="obsFechamento" rows={2} placeholder="Ex: sobrou/faltou por causa de tal coisa" />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={enviando}>
            {enviando ? "Fechando…" : "Fechar caixa"}
          </button>
        </form>
      )}
    </Modal>
  );
}
