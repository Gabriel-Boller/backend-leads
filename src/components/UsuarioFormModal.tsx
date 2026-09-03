"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { salvarUsuario } from "@/app/app/equipe/actions";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type UsuarioEdit = {
  id: string;
  nome: string;
  email: string;
  contato: string | null;
  escalaTipo: "TODOS" | "DIAS_SEMANA" | "DOZE_POR_TRINTA_SEIS";
  diasSemana: number[];
  escalaDataBase: Date | null;
};

export default function UsuarioFormModal({
  trigger,
  triggerClassName,
  papel,
  lojaId,
  usuario,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  papel: "LIDER" | "COLABORADOR";
  lojaId: string;
  usuario?: UsuarioEdit;
}) {
  const isEdit = !!usuario;
  const [escalaTipo, setEscalaTipo] = useState(usuario?.escalaTipo || "TODOS");
  const papelLabel = papel === "LIDER" ? "líder" : "colaborador";

  return (
    <Modal trigger={trigger} triggerClassName={triggerClassName} title={`${isEdit ? "Editar" : "Novo"} ${papelLabel}`}>
      {(close) => (
        <form action={salvarUsuario} onSubmit={close}>
          {isEdit && <input type="hidden" name="id" value={usuario!.id} />}
          <input type="hidden" name="papel" value={papel} />
          <input type="hidden" name="lojaId" value={lojaId} />

          <div className="field">
            <label>Nome</label>
            <input type="text" name="nome" defaultValue={usuario?.nome} required />
          </div>
          <div className="field">
            <label>Contato (telefone, opcional)</label>
            <input type="text" name="contato" defaultValue={usuario?.contato || ""} placeholder="(00) 00000-0000" />
          </div>
          <div className="field">
            <label>E-mail</label>
            <input type="email" name="email" defaultValue={usuario?.email} required />
          </div>
          <div className="field">
            <label>Senha{isEdit ? " — deixe em branco para manter" : ""}</label>
            <input type="password" name="senha" minLength={isEdit ? 0 : 6} required={!isEdit} />
          </div>

          {papel === "COLABORADOR" && (
            <>
              <div className="field">
                <label>Escala</label>
                <select name="escalaTipo" value={escalaTipo} onChange={(e) => setEscalaTipo(e.target.value as typeof escalaTipo)}>
                  <option value="TODOS">Todos os dias</option>
                  <option value="DIAS_SEMANA">Dias fixos da semana</option>
                  <option value="DOZE_POR_TRINTA_SEIS">Escala 12x36</option>
                </select>
              </div>
              {escalaTipo === "DIAS_SEMANA" && (
                <div className="field">
                  <label>Dias que trabalha</label>
                  <div className="chip-select">
                    {DIAS.map((w, i) => (
                      <label className="chip" key={i}>
                        <input
                          type="checkbox"
                          name="diasSemana"
                          value={i}
                          defaultChecked={usuario?.diasSemana.includes(i)}
                        />
                        {w}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {escalaTipo === "DOZE_POR_TRINTA_SEIS" && (
                <div className="field">
                  <label>Uma data em que ele trabalha</label>
                  <input
                    type="date"
                    name="escalaDataBase"
                    defaultValue={
                      usuario?.escalaDataBase
                        ? new Date(usuario.escalaDataBase).toISOString().slice(0, 10)
                        : new Date().toISOString().slice(0, 10)
                    }
                  />
                  <small className="hint">O sistema calcula os demais dias automaticamente (1 dia trabalha, 1 dia folga).</small>
                </div>
              )}
            </>
          )}

          <button className="btn btn-primary btn-block" type="submit">
            {isEdit ? "Salvar" : "Criar"}
          </button>
        </form>
      )}
    </Modal>
  );
}
