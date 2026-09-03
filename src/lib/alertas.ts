import "server-only";
import { calcPendencias, type Pendencia } from "@/lib/pendencias";

export type Alerta = Pendencia;

export async function calcAlertas(lojaIds: string[], de: string, ate: string): Promise<Alerta[]> {
  return calcPendencias({ lojaIds, de, ate });
}
