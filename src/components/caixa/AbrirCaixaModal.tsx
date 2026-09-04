"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { abrirCaixa } from "@/app/app/caixa/actions";

export default function AbrirCaixaModal({
  trigger,
  triggerClassName,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <Modal trigger={trigger} triggerClassName={triggerClassName} title="Abrir caixa">
      {(close) => (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setEnviando(true);
            setErro(null);
            const resultado = await abrirCaixa(new FormData(e.currentTarget));
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
          <div className="field">
            <label>Valor de abertura (fundo de troco)</label>
            <input type="number" name="valorAbertura" step="0.01" min="0" inputMode="decimal" placeholder="0,00" required autoFocus />
          </div>
          <div className="field">
            <label>Observação (opcional)</label>
            <textarea name="obsAbertura" rows={2} placeholder="Ex: troco combinado com o líder" />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={enviando}>
            {enviando ? "Abrindo…" : "Abrir caixa"}
          </button>
        </form>
      )}
    </Modal>
  );
}
