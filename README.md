# Gestão das Lojas

Site único dos sistemas de gestão das lojas. Todo link passa primeiro pelo **login**;
depois do login a pessoa cai no **HUB** (página inicial), que mostra só os sistemas
que ela pode abrir:

| Endereço | Sistema | Quem vê hoje |
|---|---|---|
| `/login` | Login (e-mail + senha) | todos |
| `/` | HUB — lista dos sistemas liberados | todos logados |
| `/app` | Checklist das Lojas | todos |
| `/financeiro/compras` | Compras | Dono |
| `/financeiro/despesas` | Despesas | Dono |
| `/financeiro/dre` | DRE | Dono |
| `/financeiro/fluxo-caixa` | Fluxo de Caixa | Dono |

Quem vê o quê está em `src/lib/apps.ts` (`appsDoUsuario`). Os painéis financeiros
vieram do repositório `CLOUD` (HTML em `src/financeiro/`) e leem a planilha Google
Sheets através do servidor (`/financeiro/dados/*`), só pra quem está logado e tem
acesso — o link da planilha nunca vai pro navegador.

## Checklist das Lojas

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
4. Link da planilha dos painéis financeiros: no Google Sheets, **Arquivo →
   Compartilhar → Publicar na Web**, formato CSV. Copie o link e guarde só a parte
   até `/pub` (sem `?gid=...`) → variável `PLANILHA_PUB_URL`. Ex:
   `https://docs.google.com/spreadsheets/d/e/XXXX/pub`
5. Em **Storage**, crie um bucket chamado `fotos-tarefas` e deixe-o
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
6. **Líder/Dono** → aba "Produção" → central de fichas técnicas e produção
   diária:
   - **Itens**: cadastro único de produtos (o que a loja produz) e insumos
     (matéria-prima), com unidade de medida — é a referência que produção,
     lojas e (no futuro) estoque usam em comum, sem duplicar cadastro.
   - **Fichas técnicas**: pra cada produto, quais insumos e em que
     quantidade são necessários pra produzir 1 unidade dele.
   - **Registro diário**: por loja e data, define a meta de produção do dia,
     registra a produção real (pode lançar mais de uma vez no dia) e o
     consumo real de insumos.
   - **Comparativo**: por período, compara produção planejada vs. realizada,
     e consumo esperado (ficha técnica × produção real) vs. consumo real
     lançado — ajuda a identificar desperdício, perda ou erro de
     porcionamento.

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
