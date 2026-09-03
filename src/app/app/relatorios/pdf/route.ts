import { renderToBuffer } from "@react-pdf/renderer";
import { requirePapel } from "@/lib/auth";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { gerarDadosRelatorio } from "@/lib/relatorio";
import { isoDate, daysAgo, todayISO } from "@/lib/dates";
import { RelatorioDocument } from "@/lib/pdf/RelatorioDocument";

export async function GET(request: Request) {
  const user = await requirePapel(["DONO", "LIDER"]);
  const url = new URL(request.url);

  const lojaIdsVis = await lojaIdsVisiveis(user);
  const lojaParam = url.searchParams.get("lojaId") || undefined;
  const lojaIds = lojaParam && lojaIdsVis.includes(lojaParam) ? [lojaParam] : lojaIdsVis;

  const usuarioParam = url.searchParams.get("usuarioId") || undefined;
  const de = url.searchParams.get("de") || isoDate(daysAgo(6));
  const ate = url.searchParams.get("ate") || todayISO();

  const dados = await gerarDadosRelatorio({ lojaIds, usuarioId: usuarioParam, de, ate });
  const buffer = await renderToBuffer(RelatorioDocument({ dados }));

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-${de}-a-${ate}.pdf"`,
    },
  });
}
