import { requirePapel } from "@/lib/auth";

// Rota temporária de diagnóstico — não expõe o valor secreto, só metadados
// (tamanho e se existe algum caractere fora do intervalo ASCII/Latin-1, e em
// que posição). Remover depois de encontrar o problema.
function scan(name: string, val: string | undefined) {
  if (val == null) return { name, presente: false };
  const limpo = val.replace(/[^\x21-\x7E]/g, "");
  for (let i = 0; i < val.length; i++) {
    const code = val.charCodeAt(i);
    if (code > 255) {
      return {
        name,
        presente: true,
        tamanho: val.length,
        indiceRuim: i,
        codigoRuim: code,
        tamanhoDepoisDeLimpar: limpo.length,
      };
    }
  }
  return { name, presente: true, tamanho: val.length, ok: true };
}

export async function GET() {
  await requirePapel(["DONO"]);
  return Response.json({
    SUPABASE_URL: scan("SUPABASE_URL", process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: scan("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
