import { requirePapel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { periodoParaRange, type Periodo } from "@/lib/dates";
import { comparativoProducao, comparativoConsumo } from "@/lib/producao";
import PeriodoFields from "@/components/PeriodoFields";

const PERIODOS_VALIDOS: Periodo[] = ["hoje", "7dias", "30dias", "mes", "mes_passado", "personalizado"];

function DesvioTag({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="tag">Sem meta/esperado</span>;
  const tom = pct >= 95 && pct <= 105 ? "ok" : pct < 80 || pct > 120 ? "late" : "";
  return <span className={`tag ${tom}`}>{pct}%</span>;
}

export default async function ComparativoPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string; lojaId?: string }>;
}) {
  const user = await requirePapel(["DONO", "LIDER"]);
  const sp = await searchParams;

  const periodo = PERIODOS_VALIDOS.includes(sp.periodo as Periodo) ? (sp.periodo as Periodo) : "7dias";
  const { de, ate } = periodoParaRange(periodo, sp.de, sp.ate);

  const lojaIdsVisiveisUser = await lojaIdsVisiveis(user);
  const lojas = await prisma.loja.findMany({ where: { id: { in: lojaIdsVisiveisUser } }, orderBy: { nome: "asc" } });
  const lojaFiltro = sp.lojaId && lojaIdsVisiveisUser.includes(sp.lojaId) ? sp.lojaId : "";
  const lojaIds = lojaFiltro ? [lojaFiltro] : lojaIdsVisiveisUser;

  const [producao, consumo] = await Promise.all([
    comparativoProducao(lojaIds, de, ate),
    comparativoConsumo(lojaIds, de, ate),
  ]);

  return (
    <>
      <form className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <PeriodoFields periodo={periodo} de={de} ate={ate} />
          {lojas.length > 1 && (
            <div>
              <label>Loja</label>
              <select name="lojaId" defaultValue={lojaFiltro}>
                <option value="">Todas as lojas</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button className="btn btn-soft" type="submit" style={{ flex: "0 0 auto" }}>
            Aplicar
          </button>
        </div>
      </form>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-head">
          <h2>Produção: planejado vs. real</h2>
        </div>
        {producao.length === 0 ? (
          <div className="empty">Nenhuma meta ou produção lançada nesse período.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Planejado</th>
                  <th>Realizado</th>
                  <th>Diferença</th>
                  <th>% da meta</th>
                </tr>
              </thead>
              <tbody>
                {producao.map((r) => (
                  <tr key={r.produtoId}>
                    <td>
                      <b>{r.produtoNome}</b>
                    </td>
                    <td>
                      {r.planejado} {r.unidade}
                    </td>
                    <td>
                      {r.realizado} {r.unidade}
                    </td>
                    <td>
                      {r.diferenca > 0 ? "+" : ""}
                      {r.diferenca} {r.unidade}
                    </td>
                    <td>
                      <DesvioTag pct={r.pct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-head">
          <h2>Consumo de insumos: esperado (ficha técnica) vs. real</h2>
        </div>
        <p className="task-desc" style={{ marginTop: -6 }}>
          Esperado = soma da produção real do período × quantidade da ficha técnica de cada produto. Real = soma dos
          consumos lançados manualmente na aba &quot;Registro diário&quot;.
        </p>
        {consumo.length === 0 ? (
          <div className="empty">Nenhum consumo esperado ou real nesse período.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Esperado</th>
                  <th>Real</th>
                  <th>Diferença</th>
                  <th>% do esperado</th>
                </tr>
              </thead>
              <tbody>
                {consumo.map((r) => (
                  <tr key={r.insumoId}>
                    <td>
                      <b>{r.insumoNome}</b>
                    </td>
                    <td>
                      {r.esperado} {r.unidade}
                    </td>
                    <td>
                      {r.real} {r.unidade}
                    </td>
                    <td>
                      {r.diferenca > 0 ? "+" : ""}
                      {r.diferenca} {r.unidade}
                    </td>
                    <td>
                      <DesvioTag pct={r.pct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
