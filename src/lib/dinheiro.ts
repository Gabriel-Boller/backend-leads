import type { Prisma } from "@prisma/client";

export function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function decimalParaNumero(valor: Prisma.Decimal | number | null | undefined): number {
  if (valor == null) return 0;
  return typeof valor === "number" ? valor : Number(valor);
}

/** Lê um valor monetário vindo de um <input type="number">, aceitando vírgula ou ponto. */
export function parseValorMonetario(raw: FormDataEntryValue | null): number {
  const texto = String(raw ?? "").trim().replace(",", ".");
  const valor = Number(texto);
  if (!texto || Number.isNaN(valor)) throw new Error("Informe um valor válido.");
  return Math.round(valor * 100) / 100;
}
