"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Papel } from "@prisma/client";

const TABS_ADMIN: [string, string][] = [
  ["/app/dashboard", "Dashboard"],
  ["/app/tarefas", "Tarefas"],
  ["/app/equipe", "Equipe"],
  ["/app/caixa", "Caixa"],
];
const TABS_COLAB: [string, string][] = [
  ["/app/minhas", "Minhas tarefas"],
  ["/app/historico", "Histórico"],
  ["/app/caixa", "Caixa"],
];

export default function Tabs({ papel, alertCount }: { papel: Papel; alertCount: number }) {
  const pathname = usePathname();
  const tabs =
    papel === "COLABORADOR"
      ? TABS_COLAB
      : TABS_ADMIN.map(([href, label]): [string, string] =>
          href === "/app/equipe" && papel === "LIDER" ? [href, "Colaboradores"] : [href, label]
        );

  return (
    <div className="tabs">
      {tabs.map(([href, label]) => (
        <Link key={href} href={href} className={`tab ${pathname === href ? "active" : ""}`}>
          {label}
          {href === "/app/dashboard" && alertCount > 0 && (
            <span className="badge-count">{alertCount}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
