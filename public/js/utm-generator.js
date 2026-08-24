document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('url-base').value = window.location.origin;

  document.getElementById('gerar').addEventListener('click', function () {
    var base = document.getElementById('url-base').value.trim();
    var origem = document.getElementById('origem').value;
    var meio = document.getElementById('meio').value.trim();
    var campanha = document.getElementById('campanha').value.trim();

    if (!base) {
      alert('Informe a URL base do site.');
      return;
    }

    var url;
    try {
      url = new URL(base);
    } catch (erro) {
      alert('URL inválida.');
      return;
    }

    url.searchParams.set('utm_source', origem);
    if (meio) url.searchParams.set('utm_medium', meio);
    if (campanha) url.searchParams.set('utm_campaign', campanha);

    var linkGerado = url.toString();
    document.getElementById('link-gerado').textContent = linkGerado;
    document.getElementById('resultado').style.display = 'block';

    document.getElementById('copiar').onclick = function () {
      navigator.clipboard.writeText(linkGerado);
    };
  });
});
