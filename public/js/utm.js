(function () {
  var PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
  var STORAGE_KEY = 'lead_tracking_data';

  function capturar() {
    var url = new URLSearchParams(window.location.search);
    var dados = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    var mudou = false;

    PARAMS.forEach(function (param) {
      var valor = url.get(param);
      if (valor) {
        dados[param] = valor;
        mudou = true;
      }
    });

    if (!dados.pagina_origem && document.referrer) {
      dados.pagina_origem = document.referrer;
      mudou = true;
    }

    if (mudou) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    }

    return dados;
  }

  window.Utm = {
    obter: function () {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    }
  };

  capturar();
})();
