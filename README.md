# Checklist das Lojas

App de checklist de tarefas para gestão de lojas, com três papéis (dono, líder,
colaborador), escalas de trabalho, tarefas recorrentes, fotos de conclusão e
relatórios.

- **Stack:** Next.js (App Router) + TypeScript + Prisma + PostgreSQL (Supabase)
  + Supabase Storage (fotos) + sessão própria (PIN com hash bcrypt, cookie
    httpOnly).
- **Login:** nome + PIN numérico (sem e-mail/senha), fluxo "sou dono" ou "sou
  líder/colaborador de uma loja".

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
npm run db:seed      # cria o primeiro usuário "dono" (nome/PIN do .env)
npm run dev
```

Abra `http://localhost:3000`, entre como "Sou o dono" e use o nome/PIN
definidos em `SEED_DONO_NOME` / `SEED_DONO_PIN` do `.env`.

## 3. Fluxo básico de uso

1. **Dono** faz login → aba "Equipe" → cria as lojas → cria os líderes de
   cada loja (nome + PIN).
2. **Líder** faz login (via "Sou líder ou colaborador") → aba
   "Colaboradores" → cadastra os colaboradores da sua loja (nome + PIN +
   escala: todos os dias, dias fixos da semana, ou 12x36).
3. **Líder/Dono** → aba "Tarefas" → cria as tarefas (recorrência diária,
   semanal ou mensal; atribuição para todos ou colaboradores específicos;
   se exige foto para concluir).
4. **Colaborador** faz login → aba "Minhas tarefas" → marca como feito ou
   envia foto, conforme exigido.
5. **Líder/Dono** acompanham em "Hoje" (progresso do dia), "Relatórios"
   (histórico filtrável com fotos) e "Alertas" (pendências dos últimos dias).

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
