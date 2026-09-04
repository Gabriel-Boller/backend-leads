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
  categoria: string | null;
  requerFoto: boolean;
  link: string | null;
  frequenciaTipo: "DIARIA" | "SEMANAL" | "MENSAL" | "PERSONALIZADA";
  diasSemana: number[];
  diaDoMes: number | null;
  datasEspecificas: Date[];
  horarioInicio: string | null;
  horarioFim: string | null;
  atribuidoATodos: boolean;
  atribuicoes: { usuarioId: string }[];
};

const CATEGORIAS_SUGERIDAS = ["Abertura", "Fechamento", "Rotina", "Caixa", "Estoque", "Limpeza", "Atendimento"];

type ModoConclusao = "SIMPLES" | "FOTO" | "LINK";

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
  const [modoConclusao, setModoConclusao] = useState<ModoConclusao>(
    tarefa?.link ? "LINK" : tarefa?.requerFoto ? "FOTO" : "SIMPLES"
  );
  const colaboradores = colaboradoresPorLoja[lojaId] || [];
  const atribuicaoIds = new Set(tarefa?.atribuicoes.map((a) => a.usuarioId));

  // o modal não desmonta esse componente ao fechar (só some da tela), então sem isso
  // os campos "controlados" (freq, modoConclusao, etc.) ficam com o valor da última
  // vez que o modal foi aberto em vez de voltar ao estado real da tarefa.
  const resetEstado = () => {
    setLojaId(tarefa?.lojaId || defaultLojaId);
    setFreq(tarefa?.frequenciaTipo || "DIARIA");
    setAtribuidoATodos(tarefa ? tarefa.atribuidoATodos : true);
    setDatas(tarefa?.datasEspecificas.map((d) => isoDate(new Date(d))) || []);
    setNovaData("");
    setModoConclusao(tarefa?.link ? "LINK" : tarefa?.requerFoto ? "FOTO" : "SIMPLES");
  };

  return (
    <Modal trigger={trigger} triggerClassName={triggerClassName} title={isEdit ? "Editar tarefa" : "Nova tarefa"} onClose={resetEstado}>
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
          <div className="field">
            <label>Categoria (opcional)</label>
            <input type="text" name="categoria" list="categorias-sugeridas" defaultValue={tarefa?.categoria || ""} placeholder="Ex: Abertura, Caixa, Rotina..." />
            <datalist id="categorias-sugeridas">
              {CATEGORIAS_SUGERIDAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
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

          <div className="field">
            <label>Como o colaborador confirma a conclusão?</label>
            <select name="modoConclusao" value={modoConclusao} onChange={(e) => setModoConclusao(e.target.value as ModoConclusao)}>
              <option value="SIMPLES">Marcar como feito (sem evidência)</option>
              <option value="FOTO">Exigir foto</option>
              <option value="LINK">Abrir link externo (ex: lançar perda, abrir caixa)</option>
            </select>
          </div>

          {modoConclusao === "LINK" && (
            <div className="field">
              <label>Link</label>
              <input
                type="url"
                name="link"
                defaultValue={tarefa?.link || ""}
                placeholder="https://..."
                required
              />
              <small className="hint">O colaborador vai clicar num botão que abre esse link e, depois, marca a tarefa como feita.</small>
            </div>
          )}

          <button className="btn btn-primary btn-block" type="submit">
            {isEdit ? "Salvar alterações" : "Criar tarefa"}
          </button>
        </form>
      )}
    </Modal>
  );
}
