const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.URL_DO_BANCO_DE_DADOS,
  ssl: { rejectUnauthorized: false }
});

const siteConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config', 'site.config.json'), 'utf-8')
);

async function garantirEsquema() {
  await pool.query(fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf-8'));
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/config', express.static(path.join(__dirname, 'config')));

app.post('/lead', async (req, res) => {
  const {
    nome,
    telefone,
    cpf,
    email,
    area,
    respostaQualificacao,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    gclid,
    fbclid,
    paginaOrigem
  } = req.body;

  if (!nome || !telefone) {
    return res.status(400).json({ erro: 'nome e telefone são obrigatórios' });
  }

  await pool.query(
    `INSERT INTO leads (
      nome, telefone, cpf, email, area_atuacao, resposta_qualificacao,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      gclid, fbclid, pagina_origem
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      nome,
      telefone,
      cpf || null,
      email || null,
      area || null,
      respostaQualificacao || null,
      utm_source || null,
      utm_medium || null,
      utm_campaign || null,
      utm_content || null,
      utm_term || null,
      gclid || null,
      fbclid || null,
      paginaOrigem || null
    ]
  );

  const areaConfig = siteConfig.areasDeAtuacao.find((a) => a.slug === area);
  const areaTitulo = areaConfig ? areaConfig.titulo : 'sua solicitação';
  const mensagem = encodeURIComponent(
    `Olá, meu nome é ${nome}. Vim pelo site e preciso de ajuda com ${areaTitulo}.`
  );
  const numero = siteConfig.advogado.whatsapp.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${numero}?text=${mensagem}`;

  res.json({ sucesso: true, whatsappUrl });
});

app.get('/leads', async (req, res) => {
  const result = await pool.query('SELECT * FROM leads ORDER BY id DESC');
  res.json(result.rows);
});

async function iniciar() {
  await garantirEsquema();
  app.listen(PORT, () => {
    console.log('Servidor rodando na porta ' + PORT);
  });
}

iniciar();
