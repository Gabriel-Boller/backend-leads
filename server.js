const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.URL_DO_BANCO_DE_DADOS,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

app.post('/lead', async (req, res) => {
  const { nome, telefone } = req.body;

  if (!nome || !telefone) {
    return res.status(400).json({ erro: 'nome e telefone são obrigatórios' });
  }

  await pool.query(
    'INSERT INTO leads (nome, telefone, data) VALUES ($1, $2, $3)',
    [nome, telefone, new Date().toISOString()]
  );

  const mensagem = encodeURIComponent('Ola ' + nome + ', tudo bem?');
  const numero = telefone.replace(/\D/g, '');
  const whatsappUrl = 'https://wa.me/55' + numero + '?text=' + mensagem;

  res.json({ sucesso: true, whatsappUrl: whatsappUrl });
});

app.get('/leads', async (req, res) => {
  const result = await pool.query('SELECT * FROM leads ORDER BY id DESC');
  res.json(result.rows);
});

app.listen(PORT, function() {
  console.log('Servidor rodando na porta ' + PORT);
});