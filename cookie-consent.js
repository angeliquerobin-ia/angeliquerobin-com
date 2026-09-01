(function () {
  var STORAGE_KEY = 'cookie_consent';
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}

  if (saved === 'granted') {
    gtag('consent', 'update', {
      analytics_storage: 'granted'
    });
    return;
  }
  if (saved === 'denied') return;

  var banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Consentement cookies');
  banner.innerHTML =
    '<p>Ce site utilise des cookies pour mesurer l’audience via Google Analytics.' +
    ' Aucune donnée personnelle n’est partagée à des fins publicitaires.</p>' +
    '<div class="cb-buttons">' +
    '<button id="cb-accept">Accepter</button>' +
    '<button id="cb-refuse">Refuser</button>' +
    '</div>';
  document.body.appendChild(banner);

  function close(choice) {
    gtag('consent', 'update', { analytics_storage: choice });
    try { localStorage.setItem(STORAGE_KEY, choice); } catch (e) {}
    banner.remove();
  }

  document.getElementById('cb-accept').addEventListener('click', function () {
    close('granted');
  });
  document.getElementById('cb-refuse').addEventListener('click', function () {
    close('denied');
  });
})();
