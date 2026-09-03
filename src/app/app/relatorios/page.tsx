import { requirePapel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { urlAssinadaFoto } from "@/lib/storage";
import { isoDate, daysAgo, todayISO, fromIsoDate, fmtDatePretty, fmtTime } from "@/lib/dates";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ lojaId?: string; usuarioId?: string; de?: string; ate?: string }>;
}) {
  const user = await requirePapel(["DONO", "LIDER"]);
  const sp = await searchParams;

  const lojaIdsVis = await lojaIdsVisiveis(user);
  const lojas =
    user.papel === "DONO" && lojaIdsVis.length > 1
      ? await prisma.loja.findMany({ where: { id: { in: lojaIdsVis } }, orderBy: { nome: "asc" } })
      : [];

  const lojaFiltro = sp.lojaId && lojaIdsVis.includes(sp.lojaId) ? sp.lojaId : undefined;
  const filtroLojaIds = lojaFiltro ? [lojaFiltro] : lojaIdsVis;

  const colaboradores = await prisma.usuario.findMany({
    where: { papel: "COLABORADOR", lojaId: { in: filtroLojaIds } },
    orderBy: { nome: "asc" },
  });

  const de = sp.de || isoDate(daysAgo(6));
  const ate = sp.ate || todayISO();
  const usuarioFiltro = sp.usuarioId && colaboradores.some((c) => c.id === sp.usuarioId) ? sp.usuarioId : undefined;

  const registros = await prisma.tarefaInstancia.findMany({
    where: {
      usuario: { lojaId: { in: filtroLojaIds }, ...(usuarioFiltro ? { id: usuarioFiltro } : {}) },
      data: { gte: fromIsoDate(de), lte: fromIsoDate(ate) },
    },
    include: { usuario: true },
    orderBy: { data: "desc" },
  });

  const registrosComFoto = await Promise.all(
    registros.map(async (r) => ({
      ...r,
      fotoUrl: r.fotoPath ? await urlAssinadaFoto(r.fotoPath) : null,
    }))
  );

  return (
    <>
      <h1 className="page-title">Relatórios</h1>
      <p className="page-sub">Histórico de tarefas concluídas, com fotos</p>

      <form className="card" style={{ marginBottom: 16 }}>
        <div className="row">
          {lojas.length > 0 && (
            <div>
              <label>Loja</label>
              <select name="lojaId" defaultValue={lojaFiltro || ""}>
                <option value="">Todas</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label>Colaborador</label>
            <select name="usuarioId" defaultValue={usuarioFiltro || ""}>
              <option value="">Todos</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>De</label>
            <input type="date" name="de" defaultValue={de} />
          </div>
          <div>
            <label>Até</label>
            <input type="date" name="ate" defaultValue={ate} />
          </div>
        </div>
        <button className="btn btn-soft" style={{ marginTop: 12 }} type="submit">
          Buscar
        </button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Colaborador</th>
              <th>Tarefa</th>
              <th>Hora</th>
              <th>Foto</th>
            </tr>
          </thead>
          <tbody>
            {registrosComFoto.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhum registro no período.</td>
              </tr>
            )}
            {registrosComFoto.map((r) => (
              <tr key={r.id}>
                <td>{fmtDatePretty(isoDate(r.data))}</td>
                <td>{r.usuario.nome}</td>
                <td>{r.tituloSnapshot}</td>
                <td>{fmtTime(r.concluidoEm)}</td>
                <td>
                  {r.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.fotoUrl} alt="Foto" className="photo-thumb" />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
