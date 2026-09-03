import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const nome = process.env.SEED_DONO_NOME || "Dono";
  const pin = process.env.SEED_DONO_PIN || "1234";

  const existente = await prisma.usuario.findFirst({ where: { papel: "DONO" } });
  if (existente) {
    console.log(`Já existe um dono cadastrado (${existente.nome}). Nada a fazer.`);
    return;
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const dono = await prisma.usuario.create({
    data: { nome, papel: "DONO", pinHash },
  });

  console.log(`Dono criado: ${dono.nome} (PIN: ${pin}) — troque o PIN depois de fazer login.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
