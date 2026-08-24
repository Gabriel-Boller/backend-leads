(function () {
  function injetarGA4(id) {
    if (!id) return;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
  }

  function injetarMetaPixel(id) {
    if (!id) return;

    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  window.Tracking = {
    iniciar: function (trackingConfig) {
      injetarGA4(trackingConfig.ga4Id);
      injetarMetaPixel(trackingConfig.metaPixelId);
    },
    rastrearLead: function (area) {
      if (window.gtag) {
        window.gtag('event', 'lead_enviado', { area_atuacao: area });
      }
      if (window.fbq) {
        window.fbq('track', 'Lead', { content_name: area });
      }
    }
  };
})();
