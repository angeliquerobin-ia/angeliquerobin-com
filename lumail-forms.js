(function () {
  function submit(payload) {
    return fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (json) {
        return { ok: response.ok, status: response.status, body: json };
      });
    });
  }

  function errorMessage(result) {
    if (result && result.status === 402) {
      return "Liste complète pour le moment. Écris-moi directement à contact@angeliquerobin.com.";
    }
    if (result && result.status === 400) {
      return 'Adresse e-mail invalide.';
    }
    return 'Une erreur est survenue. Réessaie dans un instant.';
  }

  function wireWaitlistForm() {
    var form = document.getElementById('colette-waitlist-form');
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';

    var success = document.getElementById('colette-waitlist-success');
    var error = document.getElementById('colette-waitlist-error');
    var btn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var prenom = form.querySelector('#colette-prenom').value.trim();
      var nom = form.querySelector('#colette-nom').value.trim();
      var email = form.querySelector('#colette-email').value.trim();

      btn.disabled = true;
      var originalLabel = btn.textContent;
      btn.textContent = 'Envoi…';
      if (error) error.style.display = 'none';

      submit({ email: email, name: [prenom, nom].filter(Boolean).join(' '), tag: 'colette-ia-liste' })
        .then(function (result) {
          if (result.ok) {
            form.style.display = 'none';
            if (success) success.style.display = 'block';
          } else {
            if (error) {
              error.textContent = errorMessage(result);
              error.style.display = 'block';
            }
            btn.disabled = false;
            btn.textContent = originalLabel;
          }
        })
        .catch(function () {
          if (error) {
            error.textContent = errorMessage();
            error.style.display = 'block';
          }
          btn.disabled = false;
          btn.textContent = originalLabel;
        });
    });
  }

  function wireNewsletterForm() {
    var form = document.getElementById('newsletter-form');
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';

    var success = document.getElementById('newsletter-success');
    var error = document.getElementById('newsletter-error');
    var btn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.querySelector('#newsletter-email').value.trim();

      btn.disabled = true;
      var originalLabel = btn.textContent;
      btn.textContent = '…';
      if (error) error.style.display = 'none';

      submit({ email: email, tag: 'Newsletter Lotus' })
        .then(function (result) {
          if (result.ok) {
            form.style.display = 'none';
            if (success) success.style.display = 'block';
          } else {
            if (error) {
              error.textContent = errorMessage(result);
              error.style.display = 'block';
            }
            btn.disabled = false;
            btn.textContent = originalLabel;
          }
        })
        .catch(function () {
          if (error) {
            error.textContent = errorMessage();
            error.style.display = 'block';
          }
          btn.disabled = false;
          btn.textContent = originalLabel;
        });
    });
  }

  function setup() {
    wireWaitlistForm();
    wireNewsletterForm();
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
