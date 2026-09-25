import { requirePapel } from "@/lib/auth";
import ProducaoSubNav from "@/components/producao/ProducaoSubNav";

export default async function ProducaoLayout({ children }: { children: React.ReactNode }) {
  await requirePapel(["DONO", "LIDER"]);

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>
            Produção
          </h1>
          <p className="page-sub" style={{ margin: 0 }}>
            Catálogo de produtos e insumos, fichas técnicas, produção diária e comparativo de consumo
          </p>
        </div>
      </div>

      <ProducaoSubNav />

      {children}
    </>
  );
}
