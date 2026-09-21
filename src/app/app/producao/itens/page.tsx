import { prisma } from "@/lib/db";
import ItemFormModal from "@/components/producao/ItemFormModal";
import ItensTable from "@/components/producao/ItensTable";

export default async function ItensPage() {
  const itens = await prisma.item.findMany({ orderBy: { nome: "asc" } });

  return (
    <>
      <div className="section-head">
        <h2>Catálogo de produtos e insumos</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <ItemFormModal trigger="+ Produto" triggerClassName="btn btn-outline btn-sm" tipoFixo="PRODUTO" />
          <ItemFormModal trigger="+ Insumo" triggerClassName="btn btn-primary btn-sm" tipoFixo="INSUMO" />
        </div>
      </div>
      <p className="task-desc" style={{ marginTop: -8, marginBottom: 16 }}>
        Cadastro único usado pela ficha técnica, pelo registro diário e (no futuro) pelo estoque — todo mundo se refere ao
        mesmo item, em vez de cada tela ter seu próprio nome pra ele.
      </p>

      <ItensTable itens={itens} />
    </>
  );
}
