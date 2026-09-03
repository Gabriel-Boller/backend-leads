"use client";

import { useRouter, usePathname } from "next/navigation";

export default function LojaFilterSelect({
  lojas,
  selected,
}: {
  lojas: { id: string; nome: string }[];
  selected: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      style={{ maxWidth: 220 }}
      defaultValue={selected}
      onChange={(e) => {
        const v = e.target.value;
        router.push(v === "todas" ? pathname : `${pathname}?loja=${v}`);
      }}
    >
      <option value="todas">Todas as lojas</option>
      {lojas.map((l) => (
        <option key={l.id} value={l.id}>
          {l.nome}
        </option>
      ))}
    </select>
  );
}
