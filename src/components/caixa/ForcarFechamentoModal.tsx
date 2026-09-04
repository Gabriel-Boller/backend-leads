"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { fecharCaixaForcado } from "@/app/app/caixa/actions";
import { formatBRL } from "@/lib/dinheiro";

export default function ForcarFechamentoModal({
  caixaId,
  valorEsperado,
  abertoPorNome,
  trigger,
  triggerClassName,
}: {
  caixaId: string;
  valorEsperado: number;
  abertoPorNome: string;
  trigger: React.ReactNode;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <Modal trigger={trigger} triggerClassName={triggerClassName} title="Fechamento forçado">
      {(close) => (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setEnviando(true);
            setErro(null);
            const resultado = await fecharCaixaForcado(caixaId, new FormData(e.currentTarget));
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
            Esse caixa foi aberto por <b>{abertoPorNome}</b>. Normalmente só quem abre pode fechar — use isso apenas quando a
            pessoa não estiver disponível para fechar (faltou, esqueceu, etc).
          </p>
          {erro && <p className="error-text">{erro}</p>}
          <div className="stat" style={{ marginBottom: 14 }}>
            <div className="stat-num">{formatBRL(valorEsperado)}</div>
            <div className="stat-label">Valor esperado em caixa (abertura + entradas − saídas)</div>
          </div>
          <div className="field">
            <label>Quanto foi contado no caixa?</label>
            <input type="number" name="valorContado" step="0.01" min="0" inputMode="decimal" placeholder="0,00" required autoFocus />
          </div>
          <div className="field">
            <label>Motivo do fechamento forçado</label>
            <textarea name="obsFechamento" rows={2} placeholder="Ex: colaborador faltou e não fechou o caixa" required />
          </div>
          <button className="btn btn-danger btn-block" type="submit" disabled={enviando}>
            {enviando ? "Fechando…" : "Fechar caixa forçado"}
          </button>
        </form>
      )}
    </Modal>
  );
}
