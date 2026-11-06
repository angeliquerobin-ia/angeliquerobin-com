(function () {
  var form = document.getElementById('demo-form');
  if (!form) return;
  var erreur = document.getElementById('demo-error');
  var succes = document.getElementById('demo-success');
  var bouton = form.querySelector('button[type="submit"]');

  function messageErreur(code) {
    if (code === 'invalid_email') return 'Cette adresse e-mail ne semble pas valide.';
    if (code === 'invalid_phone') return 'Ce numéro de téléphone ne semble pas valide.';
    if (code === 'too_many_requests') return 'Tu as déjà fait plusieurs demandes. Regarde dans ta boîte mail, ton accès y est peut-être déjà.';
    return 'Ta demande n’est pas passée. Réessaie dans un instant ou écris-moi à contact@angeliquerobin.com.';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var prenom = form.querySelector('#demo-prenom').value.trim();
    var libelle = bouton.textContent;
    bouton.disabled = true;
    bouton.textContent = 'Envoi…';
    erreur.style.display = 'none';

    fetch('/api/demo-cleobule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        prenom: prenom,
        nom: form.querySelector('#demo-nom').value.trim(),
        telephone: form.querySelector('#demo-telephone').value.trim(),
        email: form.querySelector('#demo-email').value.trim(),
        consentement: form.querySelector('#demo-consentement').checked,
        texteConsentement: document.getElementById('demo-consentement-texte').textContent,
        site: form.querySelector('#demo-site').value,
      }),
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          return { ok: r.ok, code: j.error };
        });
      })
      .catch(function () {
        return { ok: false };
      })
      .then(function (resultat) {
        if (resultat.ok) {
          form.style.display = 'none';
          succes.textContent = 'C’est parti, ' + prenom + '. Ton accès arrive dans ta boîte mail dans quelques instants. Pense à regarder dans les indésirables.';
          succes.style.display = 'block';
          return;
        }
        erreur.textContent = messageErreur(resultat.code);
        erreur.style.display = 'block';
        bouton.disabled = false;
        bouton.textContent = libelle;
      });
  });
})();
