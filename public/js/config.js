window.SiteConfig = {
  _promise: null,
  carregar: function () {
    if (!this._promise) {
      this._promise = fetch('/config/site.config.json').then(function (resposta) {
        return resposta.json();
      });
    }
    return this._promise;
  }
};
