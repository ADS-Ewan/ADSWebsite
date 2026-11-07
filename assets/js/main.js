// Plays the Services slide-in once, when the section first scrolls into view.
(function () {
  if (!document.documentElement.classList.contains('motion')) return;
  var section = document.getElementById('services');
  if (!section) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        section.classList.add('is-in');
        observer.disconnect();
      }
    });
  }, { threshold: 0.2 });
  observer.observe(section);
})();
