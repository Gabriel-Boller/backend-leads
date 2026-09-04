"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { salvarTarefa } from "@/app/app/tarefas/actions";
import { isoDate, fmtDatePretty } from "@/lib/dates";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type TarefaEdit = {
  id: string;
  lojaId: string;
  titulo: string;
  descricao: string | null;
  requerFoto: boolean;
  frequenciaTipo: "DIARIA" | "SEMANAL" | "MENSAL" | "PERSONALIZADA";
  diasSemana: number[];
  diaDoMes: number | null;
  datasEspecificas: Date[];
  horarioInicio: string | null;
  horarioFim: string | null;
  tipoEspecial: "NORMAL" | "ABERTURA_CAIXA" | "FECHAMENTO_CAIXA";
  atribuidoATodos: boolean;
  atribuicoes: { usuarioId: string }[];
};

export default function TarefaFormModal({
  trigger,
  triggerClassName,
  tarefa,
  lojas,
  colaboradoresPorLoja,
  defaultLojaId,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  tarefa?: TarefaEdit;
  lojas: { id: string; nome: string }[];
  colaboradoresPorLoja: Record<string, { id: string; nome: string }[]>;
  defaultLojaId: string;
}) {
  const isEdit = !!tarefa;
  const [lojaId, setLojaId] = useState(tarefa?.lojaId || defaultLojaId);
  const [freq, setFreq] = useState<TarefaEdit["frequenciaTipo"]>(tarefa?.frequenciaTipo || "DIARIA");
  const [atribuidoATodos, setAtribuidoATodos] = useState(tarefa ? tarefa.atribuidoATodos : true);
  const [datas, setDatas] = useState<string[]>(tarefa?.datasEspecificas.map((d) => isoDate(new Date(d))) || []);
  const [novaData, setNovaData] = useState("");
  const colaboradores = colaboradoresPorLoja[lojaId] || [];
  const atribuicaoIds = new Set(tarefa?.atribuicoes.map((a) => a.usuarioId));

  return (
    <Modal trigger={trigger} triggerClassName={triggerClassName} title={isEdit ? "Editar tarefa" : "Nova tarefa"}>
      {(close) => (
        <form action={salvarTarefa} onSubmit={close}>
          {isEdit && <input type="hidden" name="id" value={tarefa!.id} />}
          <div className="field">
            <label>Título</label>
            <input type="text" name="titulo" defaultValue={tarefa?.titulo} placeholder="Ex: Conferir caixa" required />
          </div>
          <div className="field">
            <label>Descrição (opcional)</label>
            <textarea name="descricao" rows={2} defaultValue={tarefa?.descricao || ""} placeholder="Detalhes de como fazer" />
          </div>
          {lojas.length > 1 && (
            <div className="field">
              <label>Loja</label>
              <select name="lojaId" value={lojaId} onChange={(e) => setLojaId(e.target.value)}>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
          {lojas.length <= 1 && <input type="hidden" name="lojaId" value={lojaId} />}

          <div className="field">
            <label>Repetição</label>
            <select name="frequenciaTipo" value={freq} onChange={(e) => setFreq(e.target.value as typeof freq)}>
              <option value="DIARIA">Todos os dias</option>
              <option value="SEMANAL">Dias específicos da semana</option>
              <option value="MENSAL">Um dia do mês</option>
              <option value="PERSONALIZADA">Datas específicas (calendário)</option>
            </select>
          </div>

          {freq === "SEMANAL" && (
            <div className="field">
              <label>Quais dias</label>
              <div className="chip-select">
                {DIAS.map((w, i) => (
                  <label className="chip" key={i}>
                    <input type="checkbox" name="diasSemana" value={i} defaultChecked={tarefa?.diasSemana.includes(i)} />
                    {w}
                  </label>
                ))}
              </div>
            </div>
          )}

          {freq === "MENSAL" && (
            <div className="field">
              <label>Dia do mês</label>
              <input type="number" name="diaDoMes" min={1} max={31} defaultValue={tarefa?.diaDoMes || 1} />
            </div>
          )}

          {freq === "PERSONALIZADA" && (
            <div className="field">
              <label>Datas em que a tarefa precisa ser feita</label>
              <div className="row" style={{ marginBottom: 8 }}>
                <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ flex: "0 0 auto" }}
                  onClick={() => {
                    if (novaData && !datas.includes(novaData)) {
                      setDatas([...datas, novaData].sort());
                      setNovaData("");
                    }
                  }}
                >
                  + Adicionar data
                </button>
              </div>
              <div className="chip-select">
                {datas.map((d) => (
                  <span key={d} className="chip on" style={{ cursor: "default" }}>
                    {fmtDatePretty(d)}
                    <button
                      type="button"
                      onClick={() => setDatas(datas.filter((x) => x !== d))}
                      style={{ background: "none", border: "none", color: "inherit", marginLeft: 4, cursor: "pointer" }}
                      aria-label={`Remover ${d}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {datas.length === 0 && <small className="hint">Nenhuma data adicionada ainda.</small>}
              </div>
              {datas.map((d) => (
                <input key={d} type="hidden" name="datasEspecificas" value={d} />
              ))}
            </div>
          )}

          <div className="field">
            <label>Horário (opcional — depois do horário-fim, a tarefa do dia vira &quot;atrasada&quot;)</label>
            <div className="row">
              <input type="time" name="horarioInicio" defaultValue={tarefa?.horarioInicio || ""} />
              <input type="time" name="horarioFim" defaultValue={tarefa?.horarioFim || ""} />
            </div>
          </div>

          <div className="field">
            <label>Tipo especial (opcional)</label>
            <select name="tipoEspecial" defaultValue={tarefa?.tipoEspecial || "NORMAL"}>
              <option value="NORMAL">Nenhum — tarefa normal</option>
              <option value="ABERTURA_CAIXA">Abertura de caixa</option>
              <option value="FECHAMENTO_CAIXA">Fechamento de caixa</option>
            </select>
            <small className="hint">
              Se marcada, concluir essa tarefa abre direto o formulário de abertura/fechamento do caixa da loja (aba
              &quot;Caixa&quot;) em vez do check simples. Use no máximo uma tarefa de cada tipo por loja.
            </small>
          </div>

          <div className="field">
            <label>Atribuir para</label>
            <select
              name="atribuidoATodos"
              value={atribuidoATodos ? "todos" : "especificos"}
              onChange={(e) => setAtribuidoATodos(e.target.value === "todos")}
            >
              <option value="todos">Todos os colaboradores da loja</option>
              <option value="especificos">Colaboradores específicos</option>
            </select>
          </div>

          {!atribuidoATodos && (
            <div className="field">
              <div className="chip-select">
                {colaboradores.map((c) => (
                  <label className="chip" key={c.id}>
                    <input type="checkbox" name="colaboradorIds" value={c.id} defaultChecked={atribuicaoIds.has(c.id)} />
                    {c.nome}
                  </label>
                ))}
                {colaboradores.length === 0 && <small className="hint">Nenhum colaborador nessa loja ainda.</small>}
              </div>
            </div>
          )}

          <div className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" name="requerFoto" style={{ width: "auto" }} defaultChecked={tarefa?.requerFoto} />
            <label style={{ margin: 0 }}>Exigir foto para concluir</label>
          </div>

          <button className="btn btn-primary btn-block" type="submit">
            {isEdit ? "Salvar alterações" : "Criar tarefa"}
          </button>
        </form>
      )}
    </Modal>
  );
}
