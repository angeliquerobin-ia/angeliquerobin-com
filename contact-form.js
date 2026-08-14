(function () {
  function setup() {
    var form = document.getElementById('contact-form');
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';

    var hero = document.getElementById('contact-hero');
    var success = document.getElementById('contact-success');
    var error = document.getElementById('contact-error');
    var fallback = document.getElementById('contact-fallback');
    var btn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      btn.disabled = true;
      var originalLabel = btn.textContent;
      btn.textContent = 'Envoi…';
      error.style.display = 'none';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            form.style.display = 'none';
            if (fallback) fallback.style.display = 'none';
            if (hero) hero.style.display = 'none';
            success.style.display = 'block';
          } else {
            error.style.display = 'block';
            btn.disabled = false;
            btn.textContent = originalLabel;
          }
        })
        .catch(function () {
          error.style.display = 'block';
          btn.disabled = false;
          btn.textContent = originalLabel;
        });
    });
  }

  setup();
  document.addEventListener('DOMContentLoaded', setup);
  window.addEventListener('load', setup);
  [150, 400, 800, 1500, 3000].forEach(function (ms) {
    setTimeout(setup, ms);
  });

  var observer = new MutationObserver(setup);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
