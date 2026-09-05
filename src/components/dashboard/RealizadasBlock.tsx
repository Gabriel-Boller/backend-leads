import { listarRegistrosDetalhados } from "@/lib/relatorio";
import { urlAssinadaFoto } from "@/lib/storage";
import RegistrosTable from "./RegistrosTable";

export default async function RealizadasBlock({
  lojaIds,
  de,
  ate,
  mostrarLoja,
}: {
  lojaIds: string[];
  de: string;
  ate: string;
  mostrarLoja: boolean;
}) {
  const registros = await listarRegistrosDetalhados({ lojaIds, de, ate });
  const comFotoUrl = await Promise.all(
    registros.map(async (r) => ({
      ...r,
      fotoUrl: r.fotoPath ? await urlAssinadaFoto(r.fotoPath) : null,
    }))
  );

  return <RegistrosTable registros={comFotoUrl} mostrarLoja={mostrarLoja} />;
}
