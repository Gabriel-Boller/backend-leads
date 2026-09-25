"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePapel } from "@/lib/auth";
import { fromIsoDate } from "@/lib/dates";
import type { ItemTipo } from "@prisma/client";

function garantirAcessoLoja(user: { papel: string; lojaId: string | null }, lojaId: string) {
  if (user.papel === "LIDER" && user.lojaId !== lojaId) {
    throw new Error("Você não tem permissão para lançar dados dessa loja.");
  }
}

function parseQuantidade(raw: FormDataEntryValue | null): number {
  const n = Number(String(raw || "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) throw new Error("Informe uma quantidade válida.");
  return n;
}

// ---------- Catálogo (Item: PRODUTO ou INSUMO) ----------

export async function salvarItem(formData: FormData) {
  await requirePapel(["DONO", "LIDER"]);

  const id = String(formData.get("id") || "").trim();
  const nome = String(formData.get("nome") || "").trim();
  const tipo = String(formData.get("tipo") || "") as ItemTipo;
  const unidade = String(formData.get("unidade") || "").trim();
  const codigo = String(formData.get("codigo") || "").trim();

  if (!nome) throw new Error("Nome é obrigatório.");
  if (tipo !== "PRODUTO" && tipo !== "INSUMO") throw new Error("Tipo inválido.");
  if (!unidade) throw new Error("Unidade de medida é obrigatória.");

  const dados = { nome, tipo, unidade, codigo: codigo || null };

  if (id) {
    await prisma.item.update({ where: { id }, data: dados });
  } else {
    await prisma.item.create({ data: dados });
  }

  revalidatePath("/app/producao/itens");
  revalidatePath("/app/producao/fichas-tecnicas");
  revalidatePath("/app/producao/registro");
}

export async function pausarOuAtivarItem(itemId: string) {
  await requirePapel(["DONO", "LIDER"]);
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return;

  await prisma.item.update({ where: { id: itemId }, data: { ativo: !item.ativo } });

  revalidatePath("/app/producao/itens");
  revalidatePath("/app/producao/fichas-tecnicas");
  revalidatePath("/app/producao/registro");
}

// ---------- Ficha técnica (lista de insumos de um produto) ----------

export async function salvarFichaTecnica(formData: FormData) {
  await requirePapel(["DONO", "LIDER"]);

  const produtoId = String(formData.get("produtoId") || "").trim();
  if (!produtoId) throw new Error("Selecione um produto.");

  const insumoIds = formData.getAll("insumoId").map((v) => String(v));
  const quantidades = formData.getAll("quantidade").map((v) => Number(String(v).replace(",", ".")));

  const linhas = insumoIds
    .map((insumoId, i) => ({ insumoId, quantidadePorUnidade: quantidades[i] }))
    .filter((l) => l.insumoId && Number.isFinite(l.quantidadePorUnidade) && l.quantidadePorUnidade > 0);

  const vistos = new Set<string>();
  for (const l of linhas) {
    if (vistos.has(l.insumoId)) throw new Error("Cada insumo só pode aparecer uma vez na ficha técnica.");
    vistos.add(l.insumoId);
  }

  await prisma.$transaction([
    prisma.fichaTecnicaItem.deleteMany({ where: { produtoId } }),
    prisma.fichaTecnicaItem.createMany({
      data: linhas.map((l) => ({ produtoId, insumoId: l.insumoId, quantidadePorUnidade: l.quantidadePorUnidade })),
    }),
  ]);

  revalidatePath("/app/producao/fichas-tecnicas");
  revalidatePath("/app/producao/comparativo");
}

// ---------- Meta de produção do dia ----------

export async function salvarMetaProducao(formData: FormData) {
  const user = await requirePapel(["DONO", "LIDER"]);

  const lojaId = String(formData.get("lojaId") || "").trim();
  const produtoId = String(formData.get("produtoId") || "").trim();
  const data = String(formData.get("data") || "").trim();
  const quantidade = parseQuantidade(formData.get("quantidade"));

  if (!lojaId || !produtoId || !data) throw new Error("Preencha loja, produto e data.");
  garantirAcessoLoja(user, lojaId);

  await prisma.metaProducao.upsert({
    where: { lojaId_produtoId_data: { lojaId, produtoId, data: fromIsoDate(data) } },
    update: { quantidade, criadoPorId: user.id },
    create: { lojaId, produtoId, data: fromIsoDate(data), quantidade, criadoPorId: user.id },
  });

  revalidatePath("/app/producao/registro");
  revalidatePath("/app/producao/comparativo");
}

// ---------- Produção real do dia ----------

export async function registrarProducao(formData: FormData) {
  const user = await requirePapel(["DONO", "LIDER"]);

  const lojaId = String(formData.get("lojaId") || "").trim();
  const produtoId = String(formData.get("produtoId") || "").trim();
  const data = String(formData.get("data") || "").trim();
  const quantidade = parseQuantidade(formData.get("quantidade"));
  const observacao = String(formData.get("observacao") || "").trim();

  if (!lojaId || !produtoId || !data) throw new Error("Preencha loja, produto e data.");
  garantirAcessoLoja(user, lojaId);

  await prisma.producaoDiaria.create({
    data: { lojaId, produtoId, data: fromIsoDate(data), quantidade, observacao: observacao || null, registradoPorId: user.id },
  });

  revalidatePath("/app/producao/registro");
  revalidatePath("/app/producao/comparativo");
}

export async function removerProducao(producaoId: string) {
  const user = await requirePapel(["DONO", "LIDER"]);
  const registro = await prisma.producaoDiaria.findUnique({ where: { id: producaoId } });
  if (!registro) return;
  garantirAcessoLoja(user, registro.lojaId);

  await prisma.producaoDiaria.delete({ where: { id: producaoId } });

  revalidatePath("/app/producao/registro");
  revalidatePath("/app/producao/comparativo");
}

// ---------- Consumo real de insumo ----------

export async function registrarConsumo(formData: FormData) {
  const user = await requirePapel(["DONO", "LIDER"]);

  const lojaId = String(formData.get("lojaId") || "").trim();
  const insumoId = String(formData.get("insumoId") || "").trim();
  const data = String(formData.get("data") || "").trim();
  const quantidade = parseQuantidade(formData.get("quantidade"));
  const observacao = String(formData.get("observacao") || "").trim();

  if (!lojaId || !insumoId || !data) throw new Error("Preencha loja, insumo e data.");
  garantirAcessoLoja(user, lojaId);

  await prisma.consumoRegistrado.create({
    data: { lojaId, insumoId, data: fromIsoDate(data), quantidade, observacao: observacao || null, registradoPorId: user.id },
  });

  revalidatePath("/app/producao/registro");
  revalidatePath("/app/producao/comparativo");
}

export async function removerConsumo(consumoId: string) {
  const user = await requirePapel(["DONO", "LIDER"]);
  const registro = await prisma.consumoRegistrado.findUnique({ where: { id: consumoId } });
  if (!registro) return;
  garantirAcessoLoja(user, registro.lojaId);

  await prisma.consumoRegistrado.delete({ where: { id: consumoId } });

  revalidatePath("/app/producao/registro");
  revalidatePath("/app/producao/comparativo");
}
