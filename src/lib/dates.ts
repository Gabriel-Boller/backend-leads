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

export type Periodo = "hoje" | "7dias" | "30dias" | "mes" | "mes_passado" | "personalizado";

/** Converte um período nomeado (ou datas personalizadas) num intervalo [de, ate] em ISO. */
export function periodoParaRange(periodo: Periodo, deCustom?: string, ateCustom?: string): { de: string; ate: string } {
  const hoje = new Date();
  if (periodo === "hoje") {
    const iso = todayISO();
    return { de: iso, ate: iso };
  }
  if (periodo === "30dias") {
    return { de: isoDate(daysAgo(29)), ate: todayISO() };
  }
  if (periodo === "mes") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { de: isoDate(inicio), ate: todayISO() };
  }
  if (periodo === "mes_passado") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return { de: isoDate(inicio), ate: isoDate(fim) };
  }
  if (periodo === "personalizado" && deCustom && ateCustom) {
    return { de: deCustom, ate: ateCustom };
  }
  // "7dias" e fallback
  return { de: isoDate(daysAgo(6)), ate: todayISO() };
}
