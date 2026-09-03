import { requirePapel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { carregarTarefasAtivasDaLoja, tarefasEsperadasParaUsuario, type TarefaComAtribuicoes } from "@/lib/tarefas";
import { tarefaAtrasadaAgora } from "@/lib/schedule";
import { urlAssinadaFoto } from "@/lib/storage";
import { todayISO, fromIsoDate, fmtDatePretty } from "@/lib/dates";
import LojaFilterSelect from "@/components/LojaFilterSelect";

export default async function HojePage({
  searchParams,
}: {
  searchParams: Promise<{ loja?: string }>;
}) {
  const user = await requirePapel(["DONO", "LIDER"]);
  const { loja: lojaParam } = await searchParams;

  const lojaIds = await lojaIdsVisiveis(user);
  const lojas =
    user.papel === "DONO" && lojaIds.length > 1
      ? await prisma.loja.findMany({ where: { id: { in: lojaIds } }, orderBy: { nome: "asc" } })
      : [];

  const selectedLojaId = lojaParam && lojaIds.includes(lojaParam) ? lojaParam : "todas";
  const filtroLojaIds = selectedLojaId === "todas" ? lojaIds : [selectedLojaId];

  const colaboradores = await prisma.usuario.findMany({
    where: { papel: "COLABORADOR", ativo: true, lojaId: { in: filtroLojaIds } },
    orderBy: { nome: "asc" },
  });

  const tarefasPorLoja = new Map<string, TarefaComAtribuicoes[]>();
  for (const lojaId of filtroLojaIds) {
    tarefasPorLoja.set(lojaId, await carregarTarefasAtivasDaLoja(lojaId));
  }

  const hoje = new Date();
  const iso = todayISO();

  const instancias = await prisma.tarefaInstancia.findMany({
    where: { usuarioId: { in: colaboradores.map((c) => c.id) }, data: fromIsoDate(iso) },
  });
  const instanciaPorChave = new Map(instancias.map((i) => [`${i.tarefaId}__${i.usuarioId}`, i]));

  let totalTarefas = 0;
  let totalFeitas = 0;

  const linhas = await Promise.all(
    colaboradores.map(async (c) => {
      const tarefasDaLoja = c.lojaId ? tarefasPorLoja.get(c.lojaId) || [] : [];
      const esperadas = tarefasEsperadasParaUsuario(c, hoje, tarefasDaLoja);
      if (esperadas.length === 0) return { colaborador: c, folga: true, itens: [] as never[] };

      const itens = await Promise.all(
        esperadas.map(async (t) => {
          const inst = instanciaPorChave.get(`${t.id}__${c.id}`);
          totalTarefas++;
          if (inst) totalFeitas++;
          const fotoUrl = inst?.fotoPath ? await urlAssinadaFoto(inst.fotoPath) : null;
          return { tarefa: t, feita: !!inst, fotoUrl };
        })
      );
      return { colaborador: c, folga: false, itens };
    })
  );

  const pct = totalTarefas ? Math.round((100 * totalFeitas) / totalTarefas) : 0;

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>
            Hoje
          </h1>
          <p className="page-sub" style={{ margin: 0 }}>
            {fmtDatePretty(iso)}
          </p>
        </div>
        {lojas.length > 0 && <LojaFilterSelect lojas={lojas} selected={selectedLojaId} />}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="stat">
          <div className="stat-num">
            {totalFeitas}/{totalTarefas}
          </div>
          <div className="stat-label">Tarefas concluídas hoje</div>
        </div>
        <div className="stat">
          <div className="stat-num">{pct}%</div>
          <div className="stat-label">Progresso geral</div>
        </div>
      </div>

      {linhas.length === 0 && <div className="empty">Nenhum colaborador cadastrado ainda.</div>}

      {linhas.map((l) => (
        <div key={l.colaborador.id} className="card">
          <div className="section-head" style={{ marginBottom: l.folga || l.itens.length === 0 ? 0 : 10 }}>
            <h2>{l.colaborador.nome}</h2>
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
            l.itens.map((i) => (
              <div
                key={i.tarefa.id}
                className={`task-item ${i.feita ? "done" : ""}`}
                style={{ marginBottom: 6, padding: "10px 12px" }}
              >
                <div className={`check-circle ${i.feita ? "checked" : ""}`} style={{ width: 20, height: 20 }}>
                  {i.feita ? "✓" : ""}
                </div>
                <div className="task-body">
                  <p className="task-title" style={{ fontSize: 13.5 }}>
                    {i.tarefa.titulo}
                  </p>
                  <div className="task-meta">
                    {i.tarefa.requerFoto && <span className="tag photo">📷</span>}
                    {!i.feita && tarefaAtrasadaAgora(i.tarefa, hoje) && <span className="tag late">⏰ Atrasada</span>}
                    {i.feita && i.fotoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.fotoUrl} alt="Foto enviada" className="photo-thumb" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </>
  );
}
