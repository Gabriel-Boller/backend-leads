import { prisma } from "@/lib/db";
import FichaTecnicaProdutoSelect from "@/components/producao/FichaTecnicaProdutoSelect";
import FichaTecnicaEditor from "@/components/producao/FichaTecnicaEditor";

export default async function FichasTecnicasPage({
  searchParams,
}: {
  searchParams: Promise<{ produtoId?: string }>;
}) {
  const sp = await searchParams;

  const [produtos, insumos] = await Promise.all([
    prisma.item.findMany({ where: { tipo: "PRODUTO" }, orderBy: { nome: "asc" } }),
    prisma.item.findMany({ where: { tipo: "INSUMO", ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const produtoId = produtos.some((p) => p.id === sp.produtoId) ? sp.produtoId! : produtos[0]?.id;
  const produto = produtos.find((p) => p.id === produtoId);

  const linhas = produtoId
    ? await prisma.fichaTecnicaItem.findMany({ where: { produtoId } })
    : [];

  return (
    <>
      {produtos.length === 0 ? (
        <div className="empty">
          Cadastre um produto na aba &quot;Itens&quot; antes de montar uma ficha técnica.
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <label>Produto</label>
            <FichaTecnicaProdutoSelect produtos={produtos} produtoId={produtoId} />
          </div>

          {produto && (
            <FichaTecnicaEditor
              produtoId={produto.id}
              produtoNome={produto.nome}
              produtoUnidade={produto.unidade}
              insumos={insumos}
              linhasIniciais={linhas.map((l) => ({ insumoId: l.insumoId, quantidadePorUnidade: l.quantidadePorUnidade }))}
            />
          )}
        </>
      )}
    </>
  );
}
