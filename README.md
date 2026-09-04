# Checklist das Lojas

App de checklist de tarefas para gestão de lojas, com três papéis (dono, líder,
colaborador), escalas de trabalho, tarefas recorrentes, fotos de conclusão e
relatórios.

- **Stack:** Next.js (App Router) + TypeScript + Prisma + PostgreSQL (Supabase)
  + Supabase Storage (fotos) + sessão própria (PIN com hash bcrypt, cookie
    httpOnly).
- **Login:** e-mail + senha (cada usuário tem seu próprio e-mail/senha, além de
  nome, contato e — se for colaborador — a escala de trabalho).

## 1. Criar o projeto no Supabase

1. Crie uma conta grátis em [supabase.com](https://supabase.com) e um novo
   projeto (anote a senha do banco que você definir — vai precisar dela).
2. Em **Project Settings → API**, copie:
   - `Project URL` → variável `SUPABASE_URL`
   - `service_role` key (em "Project API keys") → variável
     `SUPABASE_SERVICE_ROLE_KEY` (é secreta, nunca exponha no front-end)
3. Em **Project Settings → Database → Connection string**, copie:
   - a string do **Transaction pooler** (porta `6543`) → `DATABASE_URL`
   - a string do **Session pooler** ou **Direct connection** (porta `5432`)
     → `DIRECT_URL`
4. Em **Storage**, crie um bucket chamado `fotos-tarefas` e deixe-o
   **privado** (sem acesso público) — o app gera URLs assinadas temporárias
   para exibir as fotos só para quem tem permissão.

## 2. Configurar o projeto localmente

```bash
cp .env.example .env
# preencha .env com os valores do passo 1
npm install
npm run db:push      # cria as tabelas no banco a partir de prisma/schema.prisma
npm run db:seed      # cria o primeiro usuário "dono" (dados do .env)
npm run dev
```

Abra `http://localhost:3000` e entre com o e-mail/senha definidos em
`SEED_DONO_EMAIL` / `SEED_DONO_SENHA` do `.env`.

## 3. Fluxo básico de uso

1. **Dono** faz login → aba "Equipe" → cria as lojas → cria os líderes e/ou
   colaboradores de cada loja (nome, contato, e-mail, senha e, pra
   colaborador, a escala: todos os dias, dias fixos da semana, ou 12x36).
   Só o dono cria líderes e renomeia lojas.
2. **Líder** faz login com seu e-mail/senha → aba "Colaboradores" → cadastra
   os colaboradores da própria loja.
3. **Líder/Dono** → aba "Tarefas" → cria as tarefas (recorrência diária,
   semanal, mensal ou datas específicas escolhidas num calendário;
   atribuição para todos ou colaboradores específicos; horário opcional —
   depois do horário-fim, a tarefa do dia vira "atrasada"; se exige foto
   para concluir).
4. **Colaborador** faz login → aba "Minhas tarefas" → marca como feito ou
   envia foto, conforme exigido.
5. **Líder/Dono** acompanham em "Hoje" (progresso do dia), "Relatórios"
   (histórico filtrável com fotos) e "Alertas" (pendências).
6. **Controle de caixa** (aba "Caixa"): colaborador/líder abrem o caixa da própria loja
   (valor de abertura = fundo de troco) e lançam entradas e saídas ao longo do dia —
   "entrada" é só pra dinheiro extra colocado no caixa (reforço de troco, por exemplo),
   nunca venda por venda. Só há um caixa aberto por loja por vez, e só quem abriu pode
   lançar ou fechar — se a pessoa não estiver disponível, dono/líder podem fazer um
   "fechamento forçado" (fica registrado como tal). No fechamento, o colaborador só
   informa quanto contou de verdade — o valor esperado nunca aparece pra ele, só pra
   dono/líder, justamente pra ele contar sem repetir um número que já viu. Dono e líder
   veem o relatório com uma "venda estimada" (o que a contagem física implica) e podem
   depois informar, à mão, quanto o sistema de vendas real diz que foi vendido em
   dinheiro naquele caixa — o sistema mostra a diferença entre os dois. Uma tarefa do
   checklist pode ser marcada como "Abertura de caixa" ou "Fechamento de caixa"
   (em Tarefas → tipo especial): ao invés do check simples, ela abre o formulário do
   caixa, e preenchê-lo conclui a tarefa automaticamente.

## Scripts úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o app em desenvolvimento |
| `npm run build` / `npm start` | Build e start de produção |
| `npm run db:push` | Sincroniza `prisma/schema.prisma` com o banco (bom para começar) |
| `npm run db:migrate` | Cria uma migration versionada (melhor depois que o schema estabilizar) |
| `npm run db:seed` | Cria o primeiro usuário dono, se ainda não existir |
| `npm run db:studio` | Abre o Prisma Studio (interface visual do banco) |

## Deploy

O jeito mais direto é [Vercel](https://vercel.com) (integra nativamente com
Next.js): conecte o repositório, configure as mesmas variáveis de ambiente do
`.env` nas configurações do projeto na Vercel, e rode `npm run db:push` (ou
`prisma migrate deploy`) apontando pro banco de produção antes do primeiro
deploy.
