import { requirePapel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { fromIsoDate, todayISO } from "@/lib/dates";
import ConfirmForm from "@/components/ConfirmForm";
import {
  salvarMetaProducao,
  registrarProducao,
  removerProducao,
  registrarConsumo,
  removerConsumo,
} from "@/app/app/producao/actions";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ lojaId?: string; data?: string }>;
}) {
  const user = await requirePapel(["DONO", "LIDER"]);
  const sp = await searchParams;

  const lojaIds = await lojaIdsVisiveis(user);
  const lojas = await prisma.loja.findMany({ where: { id: { in: lojaIds } }, orderBy: { nome: "asc" } });
  const lojaId = lojas.some((l) => l.id === sp.lojaId) ? sp.lojaId! : user.lojaId || lojas[0]?.id || "";
  const data = sp.data || todayISO();

  if (!lojaId) {
    return <div className="empty">Nenhuma loja disponível. Cadastre uma loja na aba &quot;Equipe&quot; primeiro.</div>;
  }

  const [produtos, insumos, metas, producoes, consumos] = await Promise.all([
    prisma.item.findMany({ where: { tipo: "PRODUTO", ativo: true }, orderBy: { nome: "asc" } }),
    prisma.item.findMany({ where: { tipo: "INSUMO", ativo: true }, orderBy: { nome: "asc" } }),
    prisma.metaProducao.findMany({ where: { lojaId, data: fromIsoDate(data) } }),
    prisma.producaoDiaria.findMany({
      where: { lojaId, data: fromIsoDate(data) },
      include: { produto: true, registradoPor: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consumoRegistrado.findMany({
      where: { lojaId, data: fromIsoDate(data) },
      include: { insumo: true, registradoPor: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const metaPorProduto = new Map(metas.map((m) => [m.produtoId, m.quantidade]));

  return (
    <>
      <form className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ alignItems: "flex-end" }}>
          {lojas.length > 1 && (
            <div>
              <label>Loja</label>
              <select name="lojaId" defaultValue={lojaId}>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label>Data</label>
            <input type="date" name="data" defaultValue={data} />
          </div>
          <button className="btn btn-soft" type="submit" style={{ flex: "0 0 auto" }}>
            Aplicar
          </button>
        </div>
      </form>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-head">
          <h2>Meta de produção do dia</h2>
        </div>
        {produtos.length === 0 && <p className="task-desc">Nenhum produto cadastrado ainda.</p>}
        {produtos.map((p) => (
          <form
            key={p.id}
            action={salvarMetaProducao}
            className="row"
            style={{ marginBottom: 8, alignItems: "center" }}
          >
            <input type="hidden" name="lojaId" value={lojaId} />
            <input type="hidden" name="produtoId" value={p.id} />
            <input type="hidden" name="data" value={data} />
            <span style={{ flex: 2, minWidth: 140 }}>{p.nome}</span>
            <input
              type="number"
              name="quantidade"
              step="0.0001"
              min="0"
              defaultValue={metaPorProduto.get(p.id) ?? ""}
              placeholder={`Meta em ${p.unidade}`}
              style={{ flex: 1, minWidth: 120 }}
            />
            <button type="submit" className="btn btn-outline btn-sm" style={{ flex: "0 0 auto" }}>
              Salvar meta
            </button>
          </form>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="section-head">
            <h2>Registrar produção</h2>
          </div>
          {produtos.length === 0 ? (
            <p className="task-desc">Cadastre um produto na aba &quot;Itens&quot; primeiro.</p>
          ) : (
            <form action={registrarProducao}>
              <input type="hidden" name="lojaId" value={lojaId} />
              <input type="hidden" name="data" value={data} />
              <div className="field">
                <label>Produto</label>
                <select name="produtoId" defaultValue={produtos[0].id}>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.unidade})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Quantidade produzida</label>
                <input type="number" name="quantidade" step="0.0001" min="0" required placeholder="0" />
              </div>
              <div className="field">
                <label>Observação (opcional)</label>
                <input type="text" name="observacao" placeholder="Ex: lote da tarde" />
              </div>
              <button className="btn btn-primary btn-block" type="submit">
                + Registrar
              </button>
            </form>
          )}

          {producoes.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 16 }}>
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd.</th>
                    <th>Por</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {producoes.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.produto.nome}
                        {p.observacao && <div className="task-desc" style={{ margin: 0 }}>{p.observacao}</div>}
                      </td>
                      <td>
                        {p.quantidade} {p.produto.unidade}
                      </td>
                      <td>{p.registradoPor.nome}</td>
                      <td>
                        <ConfirmForm action={removerProducao.bind(null, p.id)} confirmMessage="Remover este registro de produção?">
                          <button type="submit" className="btn btn-danger btn-sm">
                            Remover
                          </button>
                        </ConfirmForm>
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
            <h2>Registrar consumo</h2>
          </div>
          {insumos.length === 0 ? (
            <p className="task-desc">Cadastre um insumo na aba &quot;Itens&quot; primeiro.</p>
          ) : (
            <form action={registrarConsumo}>
              <input type="hidden" name="lojaId" value={lojaId} />
              <input type="hidden" name="data" value={data} />
              <div className="field">
                <label>Insumo</label>
                <select name="insumoId" defaultValue={insumos[0].id}>
                  {insumos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome} ({i.unidade})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Quantidade consumida</label>
                <input type="number" name="quantidade" step="0.0001" min="0" required placeholder="0" />
              </div>
              <div className="field">
                <label>Observação (opcional)</label>
                <input type="text" name="observacao" placeholder="Ex: contagem de estoque do fim do dia" />
              </div>
              <button className="btn btn-primary btn-block" type="submit">
                + Registrar
              </button>
            </form>
          )}

          {consumos.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 16 }}>
              <table>
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Qtd.</th>
                    <th>Por</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {consumos.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {c.insumo.nome}
                        {c.observacao && <div className="task-desc" style={{ margin: 0 }}>{c.observacao}</div>}
                      </td>
                      <td>
                        {c.quantidade} {c.insumo.unidade}
                      </td>
                      <td>{c.registradoPor.nome}</td>
                      <td>
                        <ConfirmForm action={removerConsumo.bind(null, c.id)} confirmMessage="Remover este registro de consumo?">
                          <button type="submit" className="btn btn-danger btn-sm">
                            Remover
                          </button>
                        </ConfirmForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
