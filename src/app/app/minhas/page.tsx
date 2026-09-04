import { requirePapel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { carregarTarefasAtivasDaLoja, tarefasEsperadasParaUsuario } from "@/lib/tarefas";
import { horarioLabel, estadoTarefaAgora, tarefaDisponivelAgora, type EstadoTarefa } from "@/lib/schedule";
import { urlAssinadaFoto } from "@/lib/storage";
import { todayISO, fromIsoDate, fmtDatePretty, fmtTime, DIAS_SEMANA_LABEL, agoraNaLoja } from "@/lib/dates";
import { marcarFeitoSemFoto, desmarcarTarefa } from "./actions";
import CameraCapture from "@/components/CameraCapture";
import Celebracao from "@/components/Celebracao";

export default async function MinhasTarefasPage() {
  const sessao = await requirePapel(["COLABORADOR"]);
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: sessao.id } });
  if (!usuario.lojaId) {
    return <p className="task-desc">Você ainda não está vinculado a uma loja.</p>;
  }

  const hoje = agoraNaLoja();
  const tarefasDaLoja = await carregarTarefasAtivasDaLoja(usuario.lojaId);
  const esperadas = tarefasEsperadasParaUsuario(usuario, hoje, tarefasDaLoja);

  const iso = todayISO();
  const instancias = await prisma.tarefaInstancia.findMany({
    where: { usuarioId: usuario.id, data: fromIsoDate(iso), tarefaId: { in: esperadas.map((t) => t.id) } },
  });
  const instanciaPorTarefa = new Map(instancias.map((i) => [i.tarefaId, i]));

  const itens = esperadas
    .map((t) => {
      const inst = instanciaPorTarefa.get(t.id);
      const done = !!inst;
      const estado: EstadoTarefa = estadoTarefaAgora(t, hoje);
      return { tarefa: t, done, inst, estado };
    })
    .sort((a, b) => {
      const urgente = (x: (typeof itens)[number]) => (!x.done && (x.estado === "atrasada" || x.estado === "na_hora") ? 0 : 1);
      return urgente(a) - urgente(b);
    });

  const total = itens.length;
  const feitas = itens.filter((i) => i.done).length;
  const pct = total ? Math.round((100 * feitas) / total) : 0;

  return (
    <>
      <h1 className="page-title">Suas tarefas de hoje</h1>
      <p className="page-sub">
        {fmtDatePretty(iso)} · {DIAS_SEMANA_LABEL[hoje.getDay()]}
      </p>

      {total > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="grid grid-2" style={{ marginBottom: 12 }}>
            <div className="stat">
              <div className="stat-num">
                {feitas}/{total}
              </div>
              <div className="stat-label">Tarefas concluídas</div>
            </div>
            <div className="stat">
              <div className="stat-num">{pct}%</div>
              <div className="stat-label">Quão perto de terminar</div>
            </div>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                borderRadius: 999,
                background: pct === 100 ? "var(--success)" : "var(--primary)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      )}

      {total > 0 && feitas === total && (
        <Celebracao titulo="Parabéns! Tudo concluído 🎉" sub="Você terminou todas as suas tarefas de hoje." />
      )}

      {total === 0 && (
        <div className="empty">
          <div className="empty-icon">🌤️</div>
          <p>Você não tem tarefas hoje. Aproveite!</p>
        </div>
      )}

      {await Promise.all(
        itens.map(async ({ tarefa: t, done, inst, estado }) => {
          const fotoUrl = inst?.fotoPath ? await urlAssinadaFoto(inst.fotoPath) : null;
          const corClasse = done ? "done" : estado === "atrasada" ? "horario-atrasado" : estado === "na_hora" ? "horario-atual" : "";
          const disponivel = done || tarefaDisponivelAgora(t, hoje);

          return (
            <div key={t.id} className={`task-item ${corClasse}`}>
              {done ? (
                <form action={desmarcarTarefa.bind(null, t.id)}>
                  <button type="submit" className="check-circle checked" aria-label="Desmarcar">
                    ✓
                  </button>
                </form>
              ) : !disponivel ? (
                <div className="check-circle" style={{ opacity: 0.4 }} aria-label="Ainda não disponível">
                  🔒
                </div>
              ) : t.requerFoto ? (
                <div className="check-circle" />
              ) : (
                <form action={marcarFeitoSemFoto.bind(null, t.id)}>
                  <button type="submit" className="check-circle" aria-label="Marcar como feito" />
                </form>
              )}
              <div className="task-body">
                <p className="task-title">{t.titulo}</p>
                {t.descricao && <p className="task-desc">{t.descricao}</p>}
                <div className="task-meta">
                  {horarioLabel(t) && <span className="tag">🕐 {horarioLabel(t)}</span>}
                  {t.requerFoto && <span className="tag photo">📷 Precisa de foto</span>}
                  {t.link && <span className="tag photo">🔗 Abrir link</span>}
                  {done && <span className="tag ok">Concluída {inst && `às ${fmtTime(inst.concluidoEm)}`}</span>}
                  {!done && estado === "atrasada" && <span className="tag late">⏰ Atrasada</span>}
                  {!done && estado === "na_hora" && <span className="tag" style={{ background: "var(--warn-bg)", color: "var(--warn)" }}>🕐 Na hora</span>}
                  {!done && !disponivel && (
                    <span className="tag" style={{ background: "var(--bg-soft)", color: "var(--ink-soft)" }}>
                      🔒 Disponível às {t.horarioInicio}
                    </span>
                  )}
                </div>
                {done && fotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoUrl} alt="Foto enviada" className="photo-thumb" style={{ marginTop: 8 }} />
                )}
                {!done && disponivel && t.requerFoto && (
                  <div style={{ marginTop: 10 }}>
                    <CameraCapture tarefaId={t.id} />
                  </div>
                )}
                {!done && disponivel && t.link && (
                  <div style={{ marginTop: 10 }}>
                    <a href={t.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      🔗 Abrir link
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
