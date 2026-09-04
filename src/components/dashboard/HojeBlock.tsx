import { prisma } from "@/lib/db";
import { carregarTarefasAtivasDaLoja, tarefasEsperadasParaUsuario, type TarefaComAtribuicoes } from "@/lib/tarefas";
import { estadoTarefaAgora, type EstadoTarefa } from "@/lib/schedule";
import { urlAssinadaFoto } from "@/lib/storage";
import { todayISO, fromIsoDate, fmtDatePretty } from "@/lib/dates";

export default async function HojeBlock({ lojaIds, mostrarLoja }: { lojaIds: string[]; mostrarLoja: boolean }) {
  const colaboradores = await prisma.usuario.findMany({
    where: { papel: "COLABORADOR", ativo: true, lojaId: { in: lojaIds } },
    include: { loja: true },
    orderBy: { nome: "asc" },
  });

  const tarefasPorLoja = new Map<string, TarefaComAtribuicoes[]>();
  for (const lojaId of lojaIds) {
    tarefasPorLoja.set(lojaId, await carregarTarefasAtivasDaLoja(lojaId));
  }

  const hoje = new Date();
  const iso = todayISO();

  const instancias = await prisma.tarefaInstancia.findMany({
    where: { usuarioId: { in: colaboradores.map((c) => c.id) }, data: fromIsoDate(iso) },
  });
  const instanciaPorChave = new Map(instancias.map((i) => [`${i.tarefaId}__${i.usuarioId}`, i]));

  const linhas = await Promise.all(
    colaboradores.map(async (c) => {
      const tarefasDaLoja = c.lojaId ? tarefasPorLoja.get(c.lojaId) || [] : [];
      const esperadas = tarefasEsperadasParaUsuario(c, hoje, tarefasDaLoja);
      if (esperadas.length === 0) return { colaborador: c, folga: true, itens: [] as never[] };

      const itens = await Promise.all(
        esperadas.map(async (t) => {
          const inst = instanciaPorChave.get(`${t.id}__${c.id}`);
          const fotoUrl = inst?.fotoPath ? await urlAssinadaFoto(inst.fotoPath) : null;
          const estado: EstadoTarefa = estadoTarefaAgora(t, hoje);
          return { tarefa: t, feita: !!inst, fotoUrl, estado };
        })
      );
      itens.sort((a, b) => {
        const urgente = (x: (typeof itens)[number]) => (!x.feita && (x.estado === "atrasada" || x.estado === "na_hora") ? 0 : 1);
        return urgente(a) - urgente(b);
      });
      return { colaborador: c, folga: false, itens };
    })
  );

  return (
    <div className="card">
      <div className="section-head" style={{ marginBottom: 4 }}>
        <h2>Hoje</h2>
        <span className="page-sub" style={{ margin: 0 }}>
          {fmtDatePretty(iso)}
        </span>
      </div>

      {linhas.length === 0 && <div className="empty">Nenhum colaborador cadastrado ainda.</div>}

      {linhas.map((l) => (
        <div key={l.colaborador.id} style={{ padding: "12px 0", borderTop: "1px solid var(--line)" }}>
          <div className="section-head" style={{ marginBottom: l.folga || l.itens.length === 0 ? 0 : 8 }}>
            <h2 style={{ fontSize: 14.5 }}>
              {l.colaborador.nome}
              {mostrarLoja && l.colaborador.loja && (
                <span className="tag" style={{ marginLeft: 8, fontWeight: 600 }}>
                  {l.colaborador.loja.nome}
                </span>
              )}
            </h2>
            {!l.folga && l.itens.length > 0 && (
              <span className={`tag ${l.itens.every((i) => i.feita) ? "ok" : ""}`}>
                {l.itens.filter((i) => i.feita).length}/{l.itens.length}
              </span>
            )}
          </div>
          {l.folga ? (
            <p className="task-desc" style={{ margin: 0 }}>
              Folga hoje
            </p>
          ) : l.itens.length === 0 ? (
            <p className="task-desc" style={{ margin: 0 }}>
              Sem tarefas atribuídas hoje
            </p>
          ) : (
            l.itens.map((i) => {
              const corClasse = i.feita ? "done" : i.estado === "atrasada" ? "horario-atrasado" : i.estado === "na_hora" ? "horario-atual" : "";
              return (
                <div key={i.tarefa.id} className={`task-item ${corClasse}`} style={{ marginBottom: 6, padding: "10px 12px" }}>
                  <div className={`check-circle ${i.feita ? "checked" : ""}`} style={{ width: 20, height: 20 }}>
                    {i.feita ? "✓" : ""}
                  </div>
                  <div className="task-body">
                    <p className="task-title" style={{ fontSize: 13.5 }}>
                      {i.tarefa.titulo}
                    </p>
                    <div className="task-meta">
                      {i.tarefa.requerFoto && <span className="tag photo">📷</span>}
                      {!i.feita && i.estado === "atrasada" && <span className="tag late">⏰ Atrasada</span>}
                      {!i.feita && i.estado === "na_hora" && (
                        <span className="tag" style={{ background: "var(--warn-bg)", color: "var(--warn)" }}>
                          🕐 Na hora
                        </span>
                      )}
                      {i.feita && i.fotoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.fotoUrl} alt="Foto enviada" className="photo-thumb" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}
