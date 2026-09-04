import { requireUsuario, type UsuarioSessao } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { caixaAbertoDaLoja, resumoCaixa } from "@/lib/caixa";
import { formatBRL, decimalParaNumero } from "@/lib/dinheiro";
import { fmtDatePretty, fmtTime, isoDate, fromIsoDate, periodoParaRange, type Periodo } from "@/lib/dates";
import PeriodoFields from "@/components/PeriodoFields";
import AbrirCaixaModal from "@/components/caixa/AbrirCaixaModal";
import LancarMovimentoModal from "@/components/caixa/LancarMovimentoModal";
import FecharCaixaModal from "@/components/caixa/FecharCaixaModal";
import ForcarFechamentoModal from "@/components/caixa/ForcarFechamentoModal";
import InformarVendaModal from "@/components/caixa/InformarVendaModal";

const PERIODOS_VALIDOS: Periodo[] = ["hoje", "7dias", "30dias", "mes", "mes_passado", "personalizado"];

async function SeuCaixaSection({ user, lojaId }: { user: UsuarioSessao; lojaId: string }) {
  const caixa = await caixaAbertoDaLoja(lojaId);

  if (!caixa) {
    return (
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div>
            <h2>Seu caixa</h2>
            <p className="task-desc" style={{ margin: 0 }}>
              Nenhum caixa aberto no momento nesta loja.
            </p>
          </div>
          <AbrirCaixaModal trigger="🔓 Abrir caixa" triggerClassName="btn btn-primary" />
        </div>
      </div>
    );
  }

  const { entradas, saidas, valorAbertura, valorEsperado } = resumoCaixa(caixa);
  const souEuQueAbri = caixa.abertoPorId === user.id;
  // Colaborador nunca vê o valor esperado — só dono/líder, e só depois de fechado o
  // colaborador conta de verdade sem ter visto nenhum número de referência antes.
  const podeVerEsperado = user.papel !== "COLABORADOR";

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="section-head">
        <div>
          <h2>Caixa aberto</h2>
          <p className="task-desc" style={{ margin: 0 }}>
            Aberto por <b>{caixa.abertoPor.nome}</b> às {fmtTime(caixa.abertoEm)}
            {caixa.obsAbertura && <> — {caixa.obsAbertura}</>}
          </p>
        </div>
        {!souEuQueAbri && user.papel === "LIDER" && (
          <ForcarFechamentoModal
            caixaId={caixa.id}
            valorEsperado={valorEsperado}
            abertoPorNome={caixa.abertoPor.nome}
            trigger="Fechar forçado"
            triggerClassName="btn btn-outline btn-sm"
          />
        )}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 14 }}>
        <div className="stat">
          <div className="stat-num">{formatBRL(valorAbertura)}</div>
          <div className="stat-label">Abertura</div>
        </div>
        <div className="stat">
          <div className="stat-num">{formatBRL(entradas)}</div>
          <div className="stat-label">Entradas</div>
        </div>
        <div className="stat">
          <div className="stat-num">{formatBRL(saidas)}</div>
          <div className="stat-label">Saídas</div>
        </div>
        {podeVerEsperado && (
          <div className="stat">
            <div className="stat-num">{formatBRL(valorEsperado)}</div>
            <div className="stat-label">Esperado agora</div>
          </div>
        )}
      </div>

      {souEuQueAbri ? (
        <div className="row" style={{ marginBottom: caixa.movimentos.length ? 14 : 0 }}>
          <LancarMovimentoModal caixaId={caixa.id} tipo="ENTRADA" trigger="+ Entrada" triggerClassName="btn btn-soft" />
          <LancarMovimentoModal caixaId={caixa.id} tipo="SAIDA" trigger="− Saída" triggerClassName="btn btn-outline" />
          <FecharCaixaModal
            caixaId={caixa.id}
            valorEsperado={podeVerEsperado ? valorEsperado : undefined}
            trigger="Fechar caixa"
            triggerClassName="btn btn-primary"
          />
        </div>
      ) : (
        <p className="task-desc">Somente {caixa.abertoPor.nome} pode lançar valores ou fechar esse caixa.</p>
      )}

      {caixa.movimentos.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {caixa.movimentos
                .slice()
                .reverse()
                .map((m) => (
                  <tr key={m.id}>
                    <td>{fmtTime(m.criadoEm)}</td>
                    <td>
                      <span className={`tag ${m.tipo === "ENTRADA" ? "ok" : "late"}`}>{m.tipo === "ENTRADA" ? "Entrada" : "Saída"}</span>
                    </td>
                    <td>{formatBRL(decimalParaNumero(m.valor))}</td>
                    <td>{m.observacao || "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

async function CaixasAbertosAgora({ lojaIds, lojas }: { lojaIds: string[]; lojas: { id: string; nome: string }[] }) {
  if (lojaIds.length === 0) return null;
  const abertos = await prisma.caixa.findMany({
    where: { lojaId: { in: lojaIds }, status: "ABERTO" },
    include: { movimentos: true, abertoPor: { select: { id: true, nome: true } }, fechadoPor: { select: { id: true, nome: true } } },
    orderBy: { abertoEm: "asc" },
  });
  const nomeLoja = new Map(lojas.map((l) => [l.id, l.nome]));

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h2 style={{ marginTop: 0, fontSize: 16.5 }}>Caixas abertos agora</h2>
      {abertos.length === 0 && (
        <p className="task-desc" style={{ margin: 0 }}>
          Nenhum caixa aberto no momento.
        </p>
      )}
      {abertos.map((c) => {
        const { valorEsperado } = resumoCaixa(c);
        return (
          <div key={c.id} className="list-user">
            <span>
              <b>{nomeLoja.get(c.lojaId) || "—"}</b> · aberto por {c.abertoPor.nome} às {fmtTime(c.abertoEm)}
              <span className="tag" style={{ marginLeft: 8 }}>
                Esperado: {formatBRL(valorEsperado)}
              </span>
            </span>
            <ForcarFechamentoModal
              caixaId={c.id}
              valorEsperado={valorEsperado}
              abertoPorNome={c.abertoPor.nome}
              trigger="Fechar forçado"
              triggerClassName="btn btn-outline btn-sm"
            />
          </div>
        );
      })}
    </div>
  );
}

async function RelatorioSection({
  lojaIds,
  lojas,
  mostrarLoja,
  periodo,
  de,
  ate,
  lojaFiltroRaw,
}: {
  lojaIds: string[];
  lojas: { id: string; nome: string }[];
  mostrarLoja: boolean;
  periodo: Periodo;
  de: string;
  ate: string;
  lojaFiltroRaw?: string;
}) {
  const lojaFiltro = lojaFiltroRaw && lojaIds.includes(lojaFiltroRaw) ? lojaFiltroRaw : "todas";
  const caixas = await prisma.caixa.findMany({
    where: {
      lojaId: lojaFiltro === "todas" ? { in: lojaIds } : lojaFiltro,
      status: "FECHADO",
      fechadoEm: { gte: fromIsoDate(de), lt: new Date(fromIsoDate(ate).getTime() + 86400000) },
    },
    include: { abertoPor: { select: { nome: true } }, fechadoPor: { select: { nome: true } } },
    orderBy: { fechadoEm: "desc" },
  });
  const nomeLoja = new Map(lojas.map((l) => [l.id, l.nome]));

  const totalVendaEstimada = caixas.reduce((s, c) => s + decimalParaNumero(c.vendaEstimada), 0);
  const conferidos = caixas.filter((c) => c.vendaInformada != null);
  const totalDiferenca = conferidos.reduce((s, c) => s + (decimalParaNumero(c.vendaInformada) - decimalParaNumero(c.vendaEstimada)), 0);

  return (
    <>
      <h2 style={{ fontSize: 16.5 }}>Relatório de caixa</h2>
      <p className="task-desc" style={{ marginTop: -6 }}>
        Fechamentos no período. &quot;Venda estimada&quot; é o que a contagem física do caixa implica (contado − esperado sem
        vendas). Informe a &quot;venda em dinheiro&quot; de cada caixa (consultando o sistema de vendas) pra ver se bateu.
      </p>

      <form className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <PeriodoFields periodo={periodo} de={de} ate={ate} />
          {mostrarLoja && (
            <div>
              <label>Loja</label>
              <select name="lojaId" defaultValue={lojaFiltro}>
                <option value="todas">Todas as lojas</option>
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

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="stat">
          <div className="stat-num">{formatBRL(totalVendaEstimada)}</div>
          <div className="stat-label">Venda estimada no período (pela contagem)</div>
        </div>
        <div className="stat">
          <div className="stat-num">{formatBRL(totalDiferenca)}</div>
          <div className="stat-label">Diferença acumulada nos caixas já conferidos ({conferidos.length}/{caixas.length})</div>
        </div>
      </div>

      {caixas.length === 0 && <div className="empty">Nenhum caixa fechado nesse período.</div>}

      {caixas.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {mostrarLoja && <th>Loja</th>}
                <th>Aberto por</th>
                <th>Fechado por</th>
                <th>Contado</th>
                <th>Esperado (sem vendas)</th>
                <th>Venda estimada</th>
                <th>Venda em dinheiro (sistema)</th>
                <th>Diferença</th>
                <th>Fechado em</th>
              </tr>
            </thead>
            <tbody>
              {caixas.map((c) => {
                const vendaEstimada = decimalParaNumero(c.vendaEstimada);
                const vendaInformada = c.vendaInformada != null ? decimalParaNumero(c.vendaInformada) : null;
                const diferenca = vendaInformada != null ? vendaInformada - vendaEstimada : null;
                const divergente = diferenca != null && Math.abs(diferenca) >= 0.01;
                return (
                  <tr key={c.id}>
                    {mostrarLoja && <td>{nomeLoja.get(c.lojaId) || "—"}</td>}
                    <td>{c.abertoPor.nome}</td>
                    <td>
                      {c.fechadoPor?.nome || "—"}
                      {c.fechamentoForcado && (
                        <span className="tag late" style={{ marginLeft: 6 }}>
                          Forçado
                        </span>
                      )}
                    </td>
                    <td>{formatBRL(decimalParaNumero(c.valorContado))}</td>
                    <td>{formatBRL(decimalParaNumero(c.valorEsperado))}</td>
                    <td>{formatBRL(vendaEstimada)}</td>
                    <td>
                      {vendaInformada != null ? (
                        <>
                          {formatBRL(vendaInformada)}{" "}
                          <InformarVendaModal
                            caixaId={c.id}
                            vendaInformada={vendaInformada}
                            trigger="Editar"
                            triggerClassName="btn btn-outline btn-sm"
                          />
                        </>
                      ) : (
                        <InformarVendaModal caixaId={c.id} trigger="Informar" triggerClassName="btn btn-soft btn-sm" />
                      )}
                    </td>
                    <td>
                      {diferenca != null ? (
                        <>
                          <span style={{ color: !divergente ? undefined : diferenca > 0 ? "var(--success)" : "var(--danger)" }}>
                            {formatBRL(diferenca)}
                          </span>
                          {divergente && (
                            <span className="tag late" style={{ marginLeft: 6 }}>
                              ⚠️ Divergência
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{c.fechadoEm ? `${fmtDatePretty(isoDate(c.fechadoEm))} ${fmtTime(c.fechadoEm)}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string; lojaId?: string }>;
}) {
  const user = await requireUsuario();
  const sp = await searchParams;
  const periodo = PERIODOS_VALIDOS.includes(sp.periodo as Periodo) ? (sp.periodo as Periodo) : "30dias";
  const { de, ate } = periodoParaRange(periodo, sp.de, sp.ate);
  const lojaIds = await lojaIdsVisiveis(user);
  const lojas = await prisma.loja.findMany({ where: { id: { in: lojaIds } }, orderBy: { nome: "asc" } });

  return (
    <>
      <h1 className="page-title">Caixa</h1>
      <p className="page-sub">Abertura, lançamentos e fechamento de caixa por loja</p>

      {user.papel !== "DONO" &&
        (user.lojaId ? (
          <SeuCaixaSection user={user} lojaId={user.lojaId} />
        ) : (
          <p className="task-desc">Você ainda não está vinculado a uma loja.</p>
        ))}

      {user.papel === "DONO" && <CaixasAbertosAgora lojaIds={lojaIds} lojas={lojas} />}

      {user.papel !== "COLABORADOR" && (
        <RelatorioSection
          lojaIds={lojaIds}
          lojas={lojas}
          mostrarLoja={user.papel === "DONO" && lojas.length > 1}
          periodo={periodo}
          de={de}
          ate={ate}
          lojaFiltroRaw={sp.lojaId}
        />
      )}
    </>
  );
}
