(function () {
  var params = new URLSearchParams(window.location.search);
  var choix = document.getElementById('choix');
  var resultat = document.getElementById('resultat');
  var bouton = document.getElementById('desinscrire');

  bouton.addEventListener('click', function () {
    bouton.disabled = true;
    fetch('/api/demo-desinscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: params.get('e'), signature: params.get('s') }),
    })
      .then(function (r) {
        if (r.ok) {
          choix.style.display = 'none';
          resultat.textContent = 'C’est fait, tu es désinscrit·e. Merci d’avoir regardé Cléobule.';
          return;
        }
        bouton.disabled = false;
        resultat.textContent = r.status === 403
          ? 'Ce lien n’est pas valide. Écris-moi à contact@angeliquerobin.com et je m’en occupe.'
          : 'Ça n’a pas marché. Réessaie dans un instant ou écris-moi à contact@angeliquerobin.com.';
      })
      .catch(function () {
        bouton.disabled = false;
        resultat.textContent = 'Ça n’a pas marché. Réessaie dans un instant.';
      });
  });
})();
