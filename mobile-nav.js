(function () {
  function wire(nav, linksDiv) {
    linksDiv.classList.add('nav-links');

    var btn = document.createElement('button');
    btn.className = 'mobile-menu-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(btn);

    btn.addEventListener('click', function () {
      var open = linksDiv.classList.toggle('nav-open');
      btn.classList.toggle('is-open', open);
    });

    linksDiv.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      if (link.getAttribute('href') === '#') {
        e.preventDefault();
        var dd = link.closest('.has-dd');
        if (dd) dd.classList.toggle('open');
        return;
      }
      linksDiv.classList.remove('nav-open');
      btn.classList.remove('is-open');
    });
  }

  function setup() {
    var nav = document.querySelector('header nav');
    if (!nav) return;
    if (nav.querySelector(':scope > .mobile-menu-btn')) return; // this nav instance is already wired
    var linksDiv = nav.querySelector(':scope > div');
    if (!linksDiv) return;
    wire(nav, linksDiv);
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
