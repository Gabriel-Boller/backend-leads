# Site de Captação de Leads para Advogados

Template configurável: cada cliente (advogado) tem seu conteúdo, tema e IDs de
rastreamento definidos em `config/site.config.json`, sem precisar mexer no
código. O fluxo é: botão da área de atuação → página com as dores comuns
daquela área → formulário curto → lead salvo no banco e redirecionado para o
WhatsApp do advogado já com uma mensagem pronta.

## Rodando localmente

```bash
cp .env.example .env
# edite .env com a URL do Postgres
npm install
npm start
```

O site sobe em `http://localhost:3000`. A tabela `leads` é criada
automaticamente no banco se não existir (ver `db/schema.sql`).

## Estrutura

- `config/site.config.json` — dados do advogado, tema (cores/logo), IDs de
  GA4/Meta Pixel/Google Ads e as áreas de atuação (título, resumo, dores
  comuns, pergunta de qualificação).
- `public/` — frontend estático (HTML/CSS/JS puro), lê o config em
  `/config/site.config.json` e monta a página em cima dele.
- `public/utm-generator.html` — ferramenta interna para gerar os links com
  UTM que vão no Instagram, WhatsApp e Google Maps do cliente.
- `server.js` — API que recebe o lead (`POST /lead`), grava no Postgres com
  todos os dados de origem (UTM, gclid, fbclid, área) e devolve a URL do
  WhatsApp já pronta. `GET /leads` lista o histórico.

## Como duplicar para um novo cliente

1. Copie o repositório (ou crie um branch/deploy separado).
2. Edite só `config/site.config.json`: dados do advogado, cores, logo, áreas
   de atuação e os IDs de GA4/Meta Pixel.
3. Configure `URL_DO_BANCO_DE_DADOS` do novo cliente no `.env`/variáveis de
   ambiente do deploy.
4. Nenhum outro arquivo precisa mudar.

## Rastreamento

- UTMs são capturados na URL (`utm_source`, `utm_medium`, `utm_campaign`,
  `utm_content`, `utm_term`, `gclid`, `fbclid`) e guardados no
  `sessionStorage`, então sobrevivem à navegação entre a home, a página da
  área e o formulário.
- Cada lead salvo carrega esses dados junto com a área de atuação e a
  resposta da pergunta de qualificação — dá para saber exatamente de onde
  veio e o que a pessoa precisa antes mesmo de falar no WhatsApp.
- GA4 dispara `page_view` automático e um evento `lead_enviado` no envio do
  formulário. O Meta Pixel dispara `PageView` e `Lead`. Ambos só são
  carregados se os IDs estiverem preenchidos no config.

## Checklist de setup por cliente

- [ ] Preencher `config/site.config.json` com os dados reais do advogado.
- [ ] Criar o GA4 e o Pixel do Meta, colocar os IDs no config.
- [ ] Gerar os links de UTM em `/utm-generator.html` para Instagram (bio),
      WhatsApp Business (link direto) e Google Maps (campo "site").
- [ ] No Google Meu Negócio, usar como "site" a URL com
      `utm_source=google_maps` gerada no passo acima — assim esse tráfego
      aparece separado dos outros no `GET /leads` e no GA4.
