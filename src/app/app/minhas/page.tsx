import { requirePapel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { carregarTarefasAtivasDaLoja, tarefasEsperadasParaUsuario } from "@/lib/tarefas";
import { urlAssinadaFoto } from "@/lib/storage";
import { todayISO, fromIsoDate, fmtDatePretty, fmtTime, DIAS_SEMANA_LABEL } from "@/lib/dates";
import { marcarFeitoSemFoto, desmarcarTarefa, concluirComFoto } from "./actions";

export default async function MinhasTarefasPage() {
  const sessao = await requirePapel(["COLABORADOR"]);
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: sessao.id } });
  if (!usuario.lojaId) {
    return <p className="task-desc">Você ainda não está vinculado a uma loja.</p>;
  }

  const hoje = new Date();
  const tarefasDaLoja = await carregarTarefasAtivasDaLoja(usuario.lojaId);
  const esperadas = tarefasEsperadasParaUsuario(usuario, hoje, tarefasDaLoja);

  const iso = todayISO();
  const instancias = await prisma.tarefaInstancia.findMany({
    where: { usuarioId: usuario.id, data: fromIsoDate(iso), tarefaId: { in: esperadas.map((t) => t.id) } },
  });
  const instanciaPorTarefa = new Map(instancias.map((i) => [i.tarefaId, i]));

  return (
    <>
      <h1 className="page-title">Suas tarefas de hoje</h1>
      <p className="page-sub">
        {fmtDatePretty(iso)} · {DIAS_SEMANA_LABEL[hoje.getDay()]}
      </p>

      {esperadas.length === 0 && (
        <div className="empty">
          <div className="empty-icon">🌤️</div>
          <p>Você não tem tarefas hoje. Aproveite!</p>
        </div>
      )}

      {await Promise.all(
        esperadas.map(async (t) => {
          const inst = instanciaPorTarefa.get(t.id);
          const done = !!inst;
          const fotoUrl = inst?.fotoPath ? await urlAssinadaFoto(inst.fotoPath) : null;

          return (
            <div key={t.id} className={`task-item ${done ? "done" : ""}`}>
              {done ? (
                <form action={desmarcarTarefa.bind(null, t.id)}>
                  <button type="submit" className="check-circle checked" aria-label="Desmarcar">
                    ✓
                  </button>
                </form>
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
                  {t.requerFoto && <span className="tag photo">📷 Precisa de foto</span>}
                  {done && <span className="tag ok">Concluída {inst && `às ${fmtTime(inst.concluidoEm)}`}</span>}
                </div>
                {done && fotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoUrl} alt="Foto enviada" className="photo-thumb" style={{ marginTop: 8 }} />
                )}
                {!done && t.requerFoto && (
                  <form action={concluirComFoto.bind(null, t.id)} style={{ marginTop: 10 }}>
                    <input
                      type="file"
                      name="foto"
                      accept="image/*"
                      capture="environment"
                      required
                      style={{ marginBottom: 8, fontSize: 12.5 }}
                    />
                    <button type="submit" className="photo-input-btn">
                      📷 Enviar foto e concluir
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
