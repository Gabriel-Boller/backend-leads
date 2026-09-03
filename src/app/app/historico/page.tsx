import { requirePapel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { carregarTarefasAtivasDaLoja, tarefasEsperadasParaUsuario } from "@/lib/tarefas";
import { isoDate, daysAgo, fmtDatePretty } from "@/lib/dates";

export default async function HistoricoPage() {
  const sessao = await requirePapel(["COLABORADOR"]);
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: sessao.id } });
  if (!usuario.lojaId) {
    return <p className="task-desc">Você ainda não está vinculado a uma loja.</p>;
  }

  const tarefasDaLoja = await carregarTarefasAtivasDaLoja(usuario.lojaId);

  const instancias = await prisma.tarefaInstancia.findMany({
    where: { usuarioId: usuario.id, data: { gte: daysAgo(10) } },
    select: { tarefaId: true, data: true },
  });
  const feitosPorDia = new Map<string, number>();
  for (const i of instancias) {
    const iso = isoDate(i.data);
    feitosPorDia.set(iso, (feitosPorDia.get(iso) || 0) + 1);
  }

  const linhas: { iso: string; total: number; feitas: number }[] = [];
  for (let n = 0; n < 10; n++) {
    const d = daysAgo(n);
    const esperadas = tarefasEsperadasParaUsuario(usuario, d, tarefasDaLoja);
    if (esperadas.length === 0) continue;
    const iso = isoDate(d);
    linhas.push({ iso, total: esperadas.length, feitas: feitosPorDia.get(iso) || 0 });
  }

  return (
    <>
      <h1 className="page-title">Histórico</h1>
      <p className="page-sub">Últimos dias</p>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Concluídas</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={2}>Nenhum histórico ainda.</td>
              </tr>
            )}
            {linhas.map((r) => (
              <tr key={r.iso}>
                <td>{fmtDatePretty(r.iso)}</td>
                <td>
                  {r.feitas}/{r.total} {r.feitas === r.total ? "✅" : r.feitas === 0 ? "⚠️" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
