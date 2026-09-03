import { requirePapel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lojaIdsVisiveis } from "@/lib/escopo";
import { freqLabel } from "@/lib/schedule";
import TarefaFormModal from "@/components/TarefaFormModal";
import ConfirmForm from "@/components/ConfirmForm";
import { excluirTarefa } from "./actions";

export default async function TarefasPage() {
  const user = await requirePapel(["DONO", "LIDER"]);
  const lojaIds = await lojaIdsVisiveis(user);

  const [lojas, tarefas, colaboradores] = await Promise.all([
    prisma.loja.findMany({ where: { id: { in: lojaIds } }, orderBy: { nome: "asc" } }),
    prisma.tarefa.findMany({
      where: { lojaId: { in: lojaIds }, ativo: true },
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
  const lojaNomePorId = new Map(lojas.map((l) => [l.id, l.nome]));

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>
            Tarefas
          </h1>
          <p className="page-sub" style={{ margin: 0 }}>
            Crie tarefas fixas ou recorrentes para sua equipe
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

      {tarefas.length === 0 && <div className="empty">Nenhuma tarefa cadastrada ainda.</div>}

      {tarefas.map((t) => (
        <div key={t.id} className="card">
          <div className="section-head" style={{ marginBottom: 6 }}>
            <h2>{t.titulo}</h2>
            <div style={{ display: "flex", gap: 6 }}>
              <TarefaFormModal
                trigger="Editar"
                triggerClassName="btn btn-outline btn-sm"
                tarefa={t}
                lojas={lojas}
                colaboradoresPorLoja={colaboradoresPorLoja}
                defaultLojaId={t.lojaId}
              />
              <ConfirmForm
                action={excluirTarefa.bind(null, t.id)}
                confirmMessage={`Excluir a tarefa "${t.titulo}"?`}
              >
                <button type="submit" className="btn btn-danger btn-sm">
                  Excluir
                </button>
              </ConfirmForm>
            </div>
          </div>
          {t.descricao && <p className="task-desc">{t.descricao}</p>}
          <div className="task-meta">
            {user.papel === "DONO" && <span className="tag">{lojaNomePorId.get(t.lojaId) || "—"}</span>}
            <span className="tag">{freqLabel(t)}</span>
            <span className="tag">
              {t.atribuidoATodos ? "Todos os colaboradores" : `${t.atribuicoes.length} colaborador(es)`}
            </span>
            {t.requerFoto && <span className="tag photo">📷 Exige foto</span>}
          </div>
        </div>
      ))}
    </>
  );
}
