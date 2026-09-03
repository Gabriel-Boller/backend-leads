import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const nome = process.env.SEED_DONO_NOME || "Dono";
  const email = (process.env.SEED_DONO_EMAIL || "dono@exemplo.com").toLowerCase();
  const senha = process.env.SEED_DONO_SENHA || "mudeisso123";

  const existente = await prisma.usuario.findFirst({ where: { papel: "DONO" } });
  if (existente) {
    console.log(`Já existe um dono cadastrado (${existente.nome}). Nada a fazer.`);
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const dono = await prisma.usuario.create({
    data: { nome, email, papel: "DONO", senhaHash },
  });

  console.log(`Dono criado: ${dono.nome} <${dono.email}> (senha: ${senha}) — troque a senha depois de fazer login.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
