import { requirePapel } from "@/lib/auth";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { gerarDadosDashboard } from "@/lib/dashboard";
import { calcAlertas } from "@/lib/alertas";
import { periodoParaRange, type Periodo } from "@/lib/dates";
import PeriodoFields from "@/components/PeriodoFields";
import StatusCards from "@/components/dashboard/StatusCards";
import MeterTile from "@/components/dashboard/MeterTile";
import RankingList from "@/components/dashboard/RankingList";
import EvolucaoChart from "@/components/dashboard/EvolucaoChart";
import HojeBlock from "@/components/dashboard/HojeBlock";
import AlertasBlock from "@/components/dashboard/AlertasBlock";
import RealizadasBlock from "@/components/dashboard/RealizadasBlock";

const PERIODOS_VALIDOS: Periodo[] = ["hoje", "7dias", "30dias", "mes", "mes_passado", "personalizado"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  const user = await requirePapel(["DONO", "LIDER"]);
  const sp = await searchParams;

  const periodo = PERIODOS_VALIDOS.includes(sp.periodo as Periodo) ? (sp.periodo as Periodo) : "30dias";
  const { de, ate } = periodoParaRange(periodo, sp.de, sp.ate);

  const lojaIds = await lojaIdsVisiveis(user);
  const [dados, alertas] = await Promise.all([
    gerarDadosDashboard({ lojaIds, de, ate }),
    calcAlertas(lojaIds, de, ate),
  ]);

  const exportParams = new URLSearchParams({ de, ate }).toString();

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>
            Dashboard
          </h1>
          <p className="page-sub" style={{ margin: 0 }}>
            {dados.status.total} checklist(s) esperado(s) no período
          </p>
        </div>
      </div>

      <form className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <PeriodoFields periodo={periodo} de={de} ate={ate} />
          <button className="btn btn-soft" type="submit" style={{ flex: "0 0 auto" }}>
            Aplicar
          </button>
          <a href={`/app/relatorios/pdf?${exportParams}`} className="btn btn-outline" style={{ flex: "0 0 auto" }}>
            📄 Exportar PDF deste período
          </a>
        </div>
      </form>

      <StatusCards status={dados.status} />

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <MeterTile
          pct={dados.status.total ? Math.round((100 * dados.status.finalizado) / dados.status.total) : 0}
          label="Taxa de conclusão"
          sub="Percentual de finalização no período"
        />
        <RankingList titulo="Ranking por colaborador" sub="Pontuação consolidada de cada um" itens={dados.rankingColaboradores} />
        {user.papel === "DONO" && dados.rankingLojas.length > 1 && (
          <RankingList titulo="Ranking por loja" sub="Desempenho entre as lojas" itens={dados.rankingLojas} />
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <EvolucaoChart pontos={dados.evolucao} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <HojeBlock lojaIds={lojaIds} mostrarLoja={user.papel === "DONO" && lojaIds.length > 1} />
      </div>

      <AlertasBlock alertas={alertas} />

      <div style={{ marginTop: 16 }}>
        <RealizadasBlock lojaIds={lojaIds} de={de} ate={ate} mostrarLoja={user.papel === "DONO" && lojaIds.length > 1} />
      </div>
    </>
  );
}
