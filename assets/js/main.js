(function () {
  var motion = document.documentElement.classList.contains('motion');

  // 1. Scroll animations: each [data-animate] section plays once when it first comes into view.
  if (motion) {
    var animObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('[data-animate]').forEach(function (el) { animObserver.observe(el); });
  }

  // 2. Nav: fill in the button for the section currently in the middle of the screen.
  if ('IntersectionObserver' in window) {
    var links = {};
    document.querySelectorAll('.nav-link[data-section]').forEach(function (a) {
      links[a.getAttribute('data-section')] = a;
    });
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = links[entry.target.id];
        if (link) link.classList.toggle('is-current', entry.isIntersecting);
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) navObserver.observe(section);
    });
  }

  // 3. Local testing only: when the site is opened as a file (double-clicking index.html),
  //    folder links like "services/piloting/" need "index.html" added to open the page.
  //    Has no effect on the live site.
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (/^(https?:|mailto:|#)/.test(href)) return;
      var hash = href.indexOf('#') > -1 ? href.slice(href.indexOf('#')) : '';
      var path = hash ? href.slice(0, href.indexOf('#')) : href;
      if (/\/$/.test(path)) a.setAttribute('href', path + 'index.html' + hash);
    });
  }
})();
