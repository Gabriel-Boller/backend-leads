import "server-only";
import { prisma } from "@/lib/db";
import { fromIsoDate } from "@/lib/dates";

export type ComparativoProducao = {
  produtoId: string;
  produtoNome: string;
  unidade: string;
  planejado: number;
  realizado: number;
  diferenca: number; // realizado - planejado
  pct: number | null; // realizado / planejado * 100
};

export type ComparativoConsumo = {
  insumoId: string;
  insumoNome: string;
  unidade: string;
  esperado: number;
  real: number;
  diferenca: number; // real - esperado
  pct: number | null; // real / esperado * 100
};

/**
 * Produção planejada (MetaProducao) vs. realizada (soma de ProducaoDiaria) por
 * produto, no período e lojas informados.
 */
export async function comparativoProducao(lojaIds: string[], de: string, ate: string): Promise<ComparativoProducao[]> {
  if (lojaIds.length === 0) return [];
  const where = { lojaId: { in: lojaIds }, data: { gte: fromIsoDate(de), lte: fromIsoDate(ate) } };

  const [metas, producoes, produtos] = await Promise.all([
    prisma.metaProducao.groupBy({ by: ["produtoId"], where, _sum: { quantidade: true } }),
    prisma.producaoDiaria.groupBy({ by: ["produtoId"], where, _sum: { quantidade: true } }),
    prisma.item.findMany({ where: { tipo: "PRODUTO" }, orderBy: { nome: "asc" } }),
  ]);

  const planejadoPorProduto = new Map(metas.map((m) => [m.produtoId, m._sum.quantidade || 0]));
  const realizadoPorProduto = new Map(producoes.map((p) => [p.produtoId, p._sum.quantidade || 0]));

  return produtos
    .filter((p) => planejadoPorProduto.has(p.id) || realizadoPorProduto.has(p.id))
    .map((p) => {
      const planejado = planejadoPorProduto.get(p.id) || 0;
      const realizado = realizadoPorProduto.get(p.id) || 0;
      return {
        produtoId: p.id,
        produtoNome: p.nome,
        unidade: p.unidade,
        planejado,
        realizado,
        diferenca: realizado - planejado,
        pct: planejado > 0 ? Math.round((1000 * realizado) / planejado) / 10 : null,
      };
    });
}

/**
 * Consumo esperado de cada insumo (ficha técnica × produção real do período)
 * vs. consumo real lançado (ConsumoRegistrado), no período e lojas informados.
 */
export async function comparativoConsumo(lojaIds: string[], de: string, ate: string): Promise<ComparativoConsumo[]> {
  if (lojaIds.length === 0) return [];
  const where = { lojaId: { in: lojaIds }, data: { gte: fromIsoDate(de), lte: fromIsoDate(ate) } };

  const [producoes, consumos, insumos, fichas] = await Promise.all([
    prisma.producaoDiaria.groupBy({ by: ["produtoId"], where, _sum: { quantidade: true } }),
    prisma.consumoRegistrado.groupBy({ by: ["insumoId"], where, _sum: { quantidade: true } }),
    prisma.item.findMany({ where: { tipo: "INSUMO" }, orderBy: { nome: "asc" } }),
    prisma.fichaTecnicaItem.findMany(),
  ]);

  const realizadoPorProduto = new Map(producoes.map((p) => [p.produtoId, p._sum.quantidade || 0]));
  const realPorInsumo = new Map(consumos.map((c) => [c.insumoId, c._sum.quantidade || 0]));

  const esperadoPorInsumo = new Map<string, number>();
  for (const linha of fichas) {
    const producaoDoProduto = realizadoPorProduto.get(linha.produtoId);
    if (!producaoDoProduto) continue;
    const atual = esperadoPorInsumo.get(linha.insumoId) || 0;
    esperadoPorInsumo.set(linha.insumoId, atual + producaoDoProduto * linha.quantidadePorUnidade);
  }

  return insumos
    .filter((i) => esperadoPorInsumo.has(i.id) || realPorInsumo.has(i.id))
    .map((i) => {
      const esperado = esperadoPorInsumo.get(i.id) || 0;
      const real = realPorInsumo.get(i.id) || 0;
      return {
        insumoId: i.id,
        insumoNome: i.nome,
        unidade: i.unidade,
        esperado: Math.round(esperado * 10000) / 10000,
        real,
        diferenca: Math.round((real - esperado) * 10000) / 10000,
        pct: esperado > 0 ? Math.round((1000 * real) / esperado) / 10 : null,
      };
    });
}
