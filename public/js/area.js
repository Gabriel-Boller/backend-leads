document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var slug = params.get('area');

  SiteConfig.carregar().then(function (config) {
    document.documentElement.style.setProperty('--cor-primaria', config.tema.corPrimaria);
    document.documentElement.style.setProperty('--cor-secundaria', config.tema.corSecundaria);
    Tracking.iniciar(config.tracking);

    var area = config.areasDeAtuacao.find(function (a) { return a.slug === slug; });

    if (!area) {
      document.getElementById('conteudo-area').innerHTML = '<p>Área não encontrada. <a href="/index.html">Voltar</a></p>';
      return;
    }

    document.title = area.titulo + ' — ' + config.tema.nomeSite;
    document.getElementById('area-titulo').textContent = area.titulo;
    document.getElementById('area-resumo').textContent = area.resumoCurto;

    var lista = document.getElementById('problemas-lista');
    area.problemasComuns.forEach(function (problema) {
      var li = document.createElement('li');
      li.textContent = problema;
      lista.appendChild(li);
    });

    var qualificacaoWrap = document.getElementById('qualificacao-wrap');
    if (area.perguntaQualificacao) {
      var label = document.createElement('label');
      label.setAttribute('for', 'resposta-qualificacao');
      label.textContent = area.perguntaQualificacao.label;
      qualificacaoWrap.appendChild(label);

      var select = document.createElement('select');
      select.id = 'resposta-qualificacao';
      select.required = true;

      var optionVazia = document.createElement('option');
      optionVazia.value = '';
      optionVazia.textContent = 'Selecione uma opção';
      select.appendChild(optionVazia);

      area.perguntaQualificacao.opcoes.forEach(function (opcao) {
        var opt = document.createElement('option');
        opt.value = opcao;
        opt.textContent = opcao;
        select.appendChild(opt);
      });

      qualificacaoWrap.appendChild(select);
    }

    var form = document.getElementById('lead-form');
    var mensagemErro = document.getElementById('mensagem-erro');
    var botaoEnviar = document.getElementById('botao-enviar');

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      mensagemErro.textContent = '';
      botaoEnviar.disabled = true;
      botaoEnviar.textContent = 'Enviando...';

      var nome = document.getElementById('nome').value.trim();
      var telefone = document.getElementById('telefone').value.trim();
      var respostaSelect = document.getElementById('resposta-qualificacao');
      var respostaQualificacao = respostaSelect ? respostaSelect.value : null;
      var utm = Utm.obter();

      fetch('/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome,
          telefone: telefone,
          area: area.slug,
          respostaQualificacao: respostaQualificacao,
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          utm_content: utm.utm_content,
          utm_term: utm.utm_term,
          gclid: utm.gclid,
          fbclid: utm.fbclid,
          paginaOrigem: utm.pagina_origem
        })
      })
        .then(function (resposta) { return resposta.json(); })
        .then(function (dados) {
          if (!dados.sucesso) {
            throw new Error(dados.erro || 'Erro ao enviar');
          }
          Tracking.rastrearLead(area.slug);
          window.location.href = dados.whatsappUrl;
        })
        .catch(function () {
          mensagemErro.textContent = 'Não foi possível enviar. Tente novamente.';
          botaoEnviar.disabled = false;
          botaoEnviar.textContent = 'Falar com o advogado no WhatsApp';
        });
    });
  });
});
