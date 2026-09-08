/* gmoskalev.com — shared behaviour: theme, nav, scrollspy, copy, GitHub stats. */
(function () {
  'use strict';

  // Theme toggle. Light is the default; the pre-paint script in <head> applies a saved 'dark' before first render.
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var html = document.documentElement;
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (next === 'dark') html.setAttribute('data-theme', 'dark');
      else html.removeAttribute('data-theme');
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
    });
  }

  // Nav hairline once the page has scrolled.
  var nav = document.querySelector('.nav');
  if (nav) {
    var ticking = false;
    var apply = function () { nav.classList.toggle('nav--scrolled', window.scrollY > 4); ticking = false; };
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }, { passive: true });
    apply();
  }

  // Mobile menu.
  var burger = document.getElementById('navBurger');
  var menu = document.getElementById('navMenu');
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    };
    burger.addEventListener('click', function (e) { e.stopPropagation(); setMenu(!menu.classList.contains('is-open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (burger.contains(e.target) || menu.contains(e.target)) return;
      setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
  }

  // Scrollspy: any link with data-spy="<id>" (nav links, TOC items) is marked
  // is-active while the section with that id is in the reading band.
  var spyLinks = document.querySelectorAll('[data-spy]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var ids = [];
    spyLinks.forEach(function (l) { var id = l.getAttribute('data-spy'); if (ids.indexOf(id) < 0) ids.push(id); });
    var targets = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        spyLinks.forEach(function (l) {
          var on = l.getAttribute('data-spy') === e.target.id;
          l.classList.toggle('is-active', on);
          if (on) l.setAttribute('aria-current', 'location'); else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  // Copy-to-clipboard: <button data-copy="text"> with optional [data-copy-label].
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var label = btn.querySelector('[data-copy-label]');
    var idle = label ? label.textContent : '';
    var timer;
    var done = function () {
      btn.classList.add('is-copied');
      if (label) label.textContent = 'copied';
      clearTimeout(timer);
      timer = setTimeout(function () { btn.classList.remove('is-copied'); if (label) label.textContent = idle; }, 1600);
    };
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text); });
      } else fallback(text);
    });
    function fallback(text) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* no clipboard */ }
      document.body.removeChild(ta);
    }
  });

  // Live GitHub stars per [data-repo] card (fills [data-stat="stars"]) and an
  // optional running total in #ghStars. Falls back to the hardcoded numbers.
  var cards = document.querySelectorAll('[data-repo]');
  var totalEl = document.getElementById('ghStars');
  if (cards.length) {
    var total = 0, resolved = 0;
    cards.forEach(function (card) {
      fetch('https://api.github.com/repos/' + card.getAttribute('data-repo'))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (d && typeof d.stargazers_count === 'number') {
            var el = card.querySelector('[data-stat="stars"]');
            if (el) el.textContent = d.stargazers_count;
            total += d.stargazers_count;
          }
        })
        .catch(function () {})
        .then(function () {
          resolved += 1;
          if (resolved === cards.length && total > 0 && totalEl) totalEl.textContent = total;
        });
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
