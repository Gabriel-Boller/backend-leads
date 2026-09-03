"use client";

import { useState } from "react";
import type { Periodo } from "@/lib/dates";

const OPCOES: [Periodo, string][] = [
  ["hoje", "Hoje"],
  ["7dias", "Últimos 7 dias"],
  ["mes", "Este mês"],
  ["mes_passado", "Mês passado"],
  ["personalizado", "Personalizado"],
];

export default function PeriodoFields({
  periodo: periodoInicial,
  de,
  ate,
}: {
  periodo: Periodo;
  de: string;
  ate: string;
}) {
  const [periodo, setPeriodo] = useState<Periodo>(periodoInicial);

  return (
    <>
      <div>
        <label>Período</label>
        <select name="periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
          {OPCOES.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {periodo === "personalizado" && (
        <>
          <div>
            <label>De</label>
            <input type="date" name="de" defaultValue={de} />
          </div>
          <div>
            <label>Até</label>
            <input type="date" name="ate" defaultValue={ate} />
          </div>
        </>
      )}
    </>
  );
}
