import { requirePapel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lojaIdsVisiveis } from "@/lib/escopo";
import TarefaFormModal from "@/components/TarefaFormModal";
import TarefasTable from "@/components/TarefasTable";

export default async function TarefasPage() {
  const user = await requirePapel(["DONO", "LIDER"]);
  const lojaIds = await lojaIdsVisiveis(user);

  const [lojas, tarefas, colaboradores] = await Promise.all([
    prisma.loja.findMany({ where: { id: { in: lojaIds } }, orderBy: { nome: "asc" } }),
    prisma.tarefa.findMany({
      where: { lojaId: { in: lojaIds } },
      include: { atribuicoes: { select: { usuarioId: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.usuario.findMany({
      where: { papel: "COLABORADOR", ativo: true, lojaId: { in: lojaIds } },
      orderBy: { nome: "asc" },
    }),
  ]);

  const colaboradoresPorLoja: Record<string, { id: string; nome: string }[]> = {};
  for (const lojaId of lojaIds) {
    colaboradoresPorLoja[lojaId] = colaboradores.filter((c) => c.lojaId === lojaId);
  }
  const lojaNomePorId: Record<string, string> = {};
  for (const l of lojas) lojaNomePorId[l.id] = l.nome;

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>
            Tarefas
          </h1>
          <p className="page-sub" style={{ margin: 0 }}>
            Modelos de tarefas e suas regras — recorrência, horário e atribuição
          </p>
        </div>
        <TarefaFormModal
          trigger="+ Nova tarefa"
          triggerClassName="btn btn-primary"
          lojas={lojas}
          colaboradoresPorLoja={colaboradoresPorLoja}
          defaultLojaId={user.lojaId || lojas[0]?.id || ""}
        />
      </div>

      <TarefasTable
        tarefas={tarefas}
        lojas={lojas}
        colaboradoresPorLoja={colaboradoresPorLoja}
        mostrarLoja={user.papel === "DONO" && lojas.length > 1}
        lojaNomePorId={lojaNomePorId}
        defaultLojaId={user.lojaId || lojas[0]?.id || ""}
      />
    </>
  );
}
