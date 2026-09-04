"use client";

import { useMemo, useState } from "react";
import TarefaFormModal, { type TarefaEdit } from "@/components/TarefaFormModal";
import { pausarOuAtivarTarefa } from "@/app/app/tarefas/actions";

type TarefaRow = TarefaEdit & { ativo: boolean };

const FREQ_LABEL: Record<string, string> = {
  DIARIA: "Diária",
  SEMANAL: "Semanal",
  MENSAL: "Mensal",
  PERSONALIZADA: "Datas específicas",
};

function MiniStatCard({ titulo, linhas }: { titulo: string; linhas: { label: string; valor: number; max: number }[] }) {
  return (
    <div className="card">
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 10 }}>{titulo}</div>
      {linhas.map((l) => (
        <div key={l.label} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
            <span>{l.label}</span>
            <b>{l.valor}</b>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${l.max ? Math.round((100 * l.valor) / l.max) : 0}%`,
                background: "var(--primary)",
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      ))}
      {linhas.length === 0 && <p className="task-desc" style={{ margin: 0 }}>Sem dados.</p>}
    </div>
  );
}

export default function TarefasTable({
  tarefas,
  lojas,
  colaboradoresPorLoja,
  mostrarLoja,
  lojaNomePorId,
  defaultLojaId,
}: {
  tarefas: TarefaRow[];
  lojas: { id: string; nome: string }[];
  colaboradoresPorLoja: Record<string, { id: string; nome: string }[]>;
  mostrarLoja: boolean;
  lojaNomePorId: Record<string, string>;
  defaultLojaId: string;
}) {
  const [busca, setBusca] = useState("");
  const [lojaFiltro, setLojaFiltro] = useState("todas");

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return tarefas.filter(
      (t) =>
        (lojaFiltro === "todas" || t.lojaId === lojaFiltro) &&
        (!q || t.titulo.toLowerCase().includes(q) || (t.descricao || "").toLowerCase().includes(q))
    );
  }, [tarefas, busca, lojaFiltro]);

  const ativas = tarefas.filter((t) => t.ativo).length;
  const porFrequencia = ["DIARIA", "SEMANAL", "MENSAL", "PERSONALIZADA"]
    .map((f) => ({ label: FREQ_LABEL[f], valor: tarefas.filter((t) => t.frequenciaTipo === f).length }))
    .filter((l) => l.valor > 0);
  const comFoto = tarefas.filter((t) => t.requerFoto).length;
  const especificas = tarefas.filter((t) => !t.atribuidoATodos).length;

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 16 }}>
        <MiniStatCard
          titulo="Tarefas"
          linhas={[
            { label: "Ativas", valor: ativas, max: tarefas.length },
            { label: "Inativas", valor: tarefas.length - ativas, max: tarefas.length },
          ]}
        />
        <MiniStatCard titulo="Por recorrência" linhas={porFrequencia.map((l) => ({ ...l, max: tarefas.length }))} />
        <MiniStatCard
          titulo="Atribuição"
          linhas={[
            { label: "Todos os colaboradores", valor: tarefas.length - especificas, max: tarefas.length },
            { label: "Colaboradores específicos", valor: especificas, max: tarefas.length },
          ]}
        />
        <MiniStatCard
          titulo="Foto"
          linhas={[
            { label: "Exige foto", valor: comFoto, max: tarefas.length },
            { label: "Não exige", valor: tarefas.length - comFoto, max: tarefas.length },
          ]}
        />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row">
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {mostrarLoja && (
            <select value={lojaFiltro} onChange={(e) => setLojaFiltro(e.target.value)} style={{ flex: "0 0 auto", minWidth: 180 }}>
              <option value="todas">Todas as lojas</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {filtradas.length === 0 && <div className="empty">Nenhuma tarefa encontrada.</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tarefa</th>
              {mostrarLoja && <th>Loja</th>}
              <th>Recorrência</th>
              <th>Atribuição</th>
              <th>Horário</th>
              <th>Foto</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((t) => (
              <tr key={t.id}>
                <td>
                  <b>{t.titulo}</b>
                  {t.descricao && <div className="task-desc" style={{ margin: 0 }}>{t.descricao}</div>}
                </td>
                {mostrarLoja && <td>{lojaNomePorId[t.lojaId] || "—"}</td>}
                <td>{FREQ_LABEL[t.frequenciaTipo]}</td>
                <td>{t.atribuidoATodos ? "Todos" : `${t.atribuicoes.length} colaborador(es)`}</td>
                <td>{t.horarioInicio || t.horarioFim ? `${t.horarioInicio || "—"} às ${t.horarioFim || "—"}` : "—"}</td>
                <td>{t.requerFoto ? "📷 Sim" : "—"}</td>
                <td>
                  <form action={pausarOuAtivarTarefa.bind(null, t.id)}>
                    <button
                      type="submit"
                      className={`tag ${t.ativo ? "ok" : ""}`}
                      style={{ border: "none", cursor: "pointer" }}
                      title={t.ativo ? "Clique para pausar" : "Clique para reativar"}
                    >
                      {t.ativo ? "● Ativa" : "○ Inativa"}
                    </button>
                  </form>
                </td>
                <td>
                  <TarefaFormModal
                    trigger="Editar"
                    triggerClassName="btn btn-outline btn-sm"
                    tarefa={t}
                    lojas={lojas}
                    colaboradoresPorLoja={colaboradoresPorLoja}
                    defaultLojaId={t.lojaId || defaultLojaId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
