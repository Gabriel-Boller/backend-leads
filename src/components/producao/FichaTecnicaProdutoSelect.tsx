"use client";

import { useRouter } from "next/navigation";

export default function FichaTecnicaProdutoSelect({
  produtos,
  produtoId,
}: {
  produtos: { id: string; nome: string }[];
  produtoId?: string;
}) {
  const router = useRouter();

  return (
    <select value={produtoId || ""} onChange={(e) => router.push(`/app/producao/fichas-tecnicas?produtoId=${e.target.value}`)}>
      {produtos.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nome}
        </option>
      ))}
    </select>
  );
}
