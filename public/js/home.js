document.addEventListener('DOMContentLoaded', function () {
  SiteConfig.carregar().then(function (config) {
    document.title = config.tema.nomeSite;
    document.getElementById('nome-site').textContent = config.tema.nomeSite;
    document.getElementById('footer-advogado').textContent =
      config.advogado.nome + ' — ' + config.advogado.cidade;

    if (config.tema.logoUrl) {
      var logo = document.getElementById('logo');
      logo.src = config.tema.logoUrl;
      logo.style.display = 'block';
    }

    document.documentElement.style.setProperty('--cor-primaria', config.tema.corPrimaria);
    document.documentElement.style.setProperty('--cor-secundaria', config.tema.corSecundaria);

    var sufixoUtm = window.location.search ? window.location.search.replace('?', '&') : '';
    var grid = document.getElementById('areas-grid');

    config.areasDeAtuacao.forEach(function (area) {
      var link = document.createElement('a');
      link.href = 'area.html?area=' + encodeURIComponent(area.slug) + sufixoUtm;
      link.className = 'area-card';
      link.innerHTML = '<h3>' + area.titulo + '</h3><p>' + area.resumoCurto + '</p>';
      grid.appendChild(link);
    });

    Tracking.iniciar(config.tracking);
  });
});
