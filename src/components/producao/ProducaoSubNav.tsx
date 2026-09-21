"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS: [string, string][] = [
  ["/app/producao/itens", "Itens"],
  ["/app/producao/fichas-tecnicas", "Fichas técnicas"],
  ["/app/producao/registro", "Registro diário"],
  ["/app/producao/comparativo", "Comparativo"],
];

export default function ProducaoSubNav() {
  const pathname = usePathname();
  return (
    <div className="chip-select" style={{ marginBottom: 16 }}>
      {ITENS.map(([href, label]) => (
        <Link key={href} href={href} className={`chip ${pathname === href ? "on" : ""}`}>
          {label}
        </Link>
      ))}
    </div>
  );
}
