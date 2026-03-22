const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const LEADS_FILE = path.join(__dirname, 'leads.json');

app.use(cors());
app.use(express.json());

if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, '[]');
}

app.post('/lead', (req, res) => {
  const { nome, telefone } = req.body;

  if (!nome || !telefone) {
    return res.status(400).json({ erro: 'nome e telefone sao obrigatorios' });
  }

  const leads = JSON.parse(fs.readFileSync(LEADS_FILE));
  leads.push({ nome, telefone, data: new Date().toISOString() });
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));

  const mensagem = encodeURIComponent('Ola ' + nome + ', tudo bem?');
  const numero = telefone.replace(/\D/g, '');
  const whatsappUrl = 'https://wa.me/55' + numero + '?text=' + mensagem;

  res.json({ sucesso: true, whatsappUrl: whatsappUrl });
});
app.get('/leads', (req, res) => {
  const leads = JSON.parse(fs.readFileSync(LEADS_FILE));
  res.json(leads);
});
app.listen(PORT, function() {
  console.log('Servidor rodando na porta ' + PORT);
});