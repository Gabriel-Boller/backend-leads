export const DIAS_SEMANA_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Converte um Date para uma string ISO "YYYY-MM-DD" no fuso local (evita bug de UTC do toISOString). */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Constrói um Date "puro" (meia-noite local) a partir de uma string "YYYY-MM-DD". */
export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return isoDate(new Date());
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function fmtDatePretty(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Diferença em dias de calendário entre duas datas "puras" (sem hora). */
export function diffDays(a: Date, b: Date): number {
  const pa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const pb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((pa.getTime() - pb.getTime()) / 86400000);
}
