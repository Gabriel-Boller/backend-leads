import { requirePapel } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { escalaLabel } from "@/lib/schedule";
import LojaFormModal from "@/components/LojaFormModal";
import UsuarioFormModal from "@/components/UsuarioFormModal";
import ConfirmForm from "@/components/ConfirmForm";
import { removerUsuario } from "./actions";

export default async function EquipePage() {
  const user = await requirePapel(["DONO", "LIDER"]);

  if (user.papel === "DONO") {
    const lojas = await prisma.loja.findMany({
      orderBy: { nome: "asc" },
      include: { usuarios: { where: { ativo: true } } },
    });

    return (
      <>
        <div className="section-head">
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>
              Equipe
            </h1>
            <p className="page-sub" style={{ margin: 0 }}>
              Gerencie lojas, líderes e colaboradores
            </p>
          </div>
          <LojaFormModal trigger="+ Nova loja" triggerClassName="btn btn-primary" />
        </div>

        {lojas.map((loja) => {
          const lideres = loja.usuarios.filter((u) => u.papel === "LIDER");
          const colabs = loja.usuarios.filter((u) => u.papel === "COLABORADOR");
          return (
            <div key={loja.id} className="card">
              <div className="section-head">
                <h2>{loja.nome}</h2>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <LojaFormModal trigger="Editar loja" triggerClassName="btn btn-outline btn-sm" loja={loja} />
                  <UsuarioFormModal trigger="+ Líder" triggerClassName="btn btn-outline btn-sm" papel="LIDER" lojaId={loja.id} />
                  <UsuarioFormModal trigger="+ Colaborador" triggerClassName="btn btn-outline btn-sm" papel="COLABORADOR" lojaId={loja.id} />
                </div>
              </div>

              <small className="hint">Líderes</small>
              {lideres.length === 0 && <p className="task-desc">Nenhum líder atribuído ainda.</p>}
              {lideres.map((l) => (
                <div key={l.id} className="list-user">
                  <span>
                    {l.nome} <span className="pill">Líder</span>
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <UsuarioFormModal
                      trigger="Editar"
                      triggerClassName="btn btn-outline btn-sm"
                      papel="LIDER"
                      lojaId={loja.id}
                      usuario={l}
                    />
                    <ConfirmForm action={removerUsuario.bind(null, l.id)} confirmMessage={`Remover ${l.nome}?`}>
                      <button type="submit" className="btn btn-danger btn-sm">
                        Remover
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
              ))}

              <small className="hint" style={{ marginTop: 10, display: "block" }}>
                Colaboradores
              </small>
              {colabs.length === 0 && <p className="task-desc">Nenhum colaborador cadastrado ainda.</p>}
              {colabs.map((c) => (
                <div key={c.id} className="list-user">
                  <span>
                    {c.nome} <span className="tag">{escalaLabel(c)}</span>
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <UsuarioFormModal
                      trigger="Editar"
                      triggerClassName="btn btn-outline btn-sm"
                      papel="COLABORADOR"
                      lojaId={loja.id}
                      usuario={c}
                    />
                    <ConfirmForm action={removerUsuario.bind(null, c.id)} confirmMessage={`Remover ${c.nome}?`}>
                      <button type="submit" className="btn btn-danger btn-sm">
                        Remover
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </>
    );
  }

  // LIDER
  const colaboradores = await prisma.usuario.findMany({
    where: { papel: "COLABORADOR", ativo: true, lojaId: user.lojaId! },
    orderBy: { nome: "asc" },
  });

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>
            Colaboradores
          </h1>
          <p className="page-sub" style={{ margin: 0 }}>
            Gerencie sua equipe e escalas
          </p>
        </div>
        <UsuarioFormModal trigger="+ Colaborador" triggerClassName="btn btn-primary" papel="COLABORADOR" lojaId={user.lojaId!} />
      </div>

      {colaboradores.length === 0 && <div className="empty">Nenhum colaborador cadastrado ainda.</div>}

      {colaboradores.map((c) => (
        <div key={c.id} className="card">
          <div className="section-head" style={{ marginBottom: 4 }}>
            <h2>{c.nome}</h2>
            <div style={{ display: "flex", gap: 6 }}>
              <UsuarioFormModal
                trigger="Editar"
                triggerClassName="btn btn-outline btn-sm"
                papel="COLABORADOR"
                lojaId={user.lojaId!}
                usuario={c}
              />
              <ConfirmForm action={removerUsuario.bind(null, c.id)} confirmMessage={`Remover ${c.nome}?`}>
                <button type="submit" className="btn btn-danger btn-sm">
                  Remover
                </button>
              </ConfirmForm>
            </div>
          </div>
          <span className="tag">Escala: {escalaLabel(c)}</span>
        </div>
      ))}
    </>
  );
}
