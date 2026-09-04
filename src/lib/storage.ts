import "server-only";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "fotos-tarefas";

/**
 * Remove qualquer caractere fora do ASCII imprimível (ex: "•" que gerenciadores de senha
 * às vezes inserem sozinhos ao "ajudar" a preencher um campo de senha/secreto) — chaves
 * de API e URLs legítimas nunca usam esses caracteres, então isso só limpa lixo.
 */
function limparVariavelDeAmbiente(valor: string): string {
  return valor.replace(/[^\x21-\x7E]/g, "");
}

function client() {
  const url = process.env.SUPABASE_URL && limparVariavelDeAmbiente(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY && limparVariavelDeAmbiente(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados. Veja o .env.example."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Faz upload de uma foto de conclusão de tarefa e retorna o caminho salvo no bucket privado. */
export async function uploadFotoTarefa(
  lojaId: string,
  usuarioId: string,
  file: File
): Promise<string> {
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const path = `${lojaId}/${usuarioId}/${Date.now()}-${randomSuffix()}.${ext}`;

  const { error } = await client()
    .storage.from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Falha ao enviar foto: ${error.message}`);
  return path;
}

/** Gera uma URL temporária e assinada para exibir uma foto privada. */
export async function urlAssinadaFoto(path: string, expiraSegundos = 60 * 30): Promise<string | null> {
  const { data, error } = await client().storage.from(BUCKET).createSignedUrl(path, expiraSegundos);
  if (error) return null;
  return data.signedUrl;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}
