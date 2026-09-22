/* Shared bilingual controller for Softec Vision legal documents.
   Reads window.LEGAL_I18N (defined per page), resolves the language from
   ?lang= then the shared 'softec-language' preference, applies direction,
   renders content, and keeps the language across links. Tolerates blocked
   storage. No dependencies. */
(function () {
  'use strict';

  var STORAGE_KEY = 'softec-language';

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function resolveLang() {
    var requested = new URLSearchParams(location.search).get('lang');
    if (requested === 'he' || requested === 'en') return requested;
    var saved = safeGet(STORAGE_KEY);
    if (saved === 'he' || saved === 'en') return saved;
    return 'he';
  }

  var i18n = window.LEGAL_I18N || {};
  var lang = resolveLang();

  function text(key) {
    var entry = i18n[key];
    if (!entry) return key;
    return entry[lang] || entry.he || key;
  }

  function render() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      node.textContent = text(node.getAttribute('data-i18n'));
    });
    // Trusted, author-written markup (links, lists, emphasis).
    document.querySelectorAll('[data-i18n-html]').forEach(function (node) {
      node.innerHTML = text(node.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (node) {
      node.setAttribute('aria-label', text(node.getAttribute('data-i18n-aria')));
    });

    if (i18n['meta.title']) document.title = text('meta.title');
    var desc = document.querySelector('meta[name="description"]');
    if (desc && i18n['meta.description']) desc.setAttribute('content', text('meta.description'));

    // Keep the chosen language on every internal navigation link.
    document.querySelectorAll('[data-keep-lang]').forEach(function (link) {
      try {
        var url = new URL(link.getAttribute('href'), location.href);
        url.searchParams.set('lang', lang);
        link.setAttribute('href', url.pathname + url.search + url.hash);
      } catch (e) {}
    });

    var toggle = document.getElementById('legalLang');
    if (toggle) {
      var other = lang === 'he' ? 'en' : 'he';
      toggle.textContent = lang === 'he' ? 'EN' : 'עב';
      toggle.setAttribute('lang', other);
      toggle.setAttribute('aria-label', text('ui.switchLanguage'));
    }
  }

  function switchLang() {
    lang = lang === 'he' ? 'en' : 'he';
    safeSet(STORAGE_KEY, lang);
    var params = new URLSearchParams(location.search);
    params.set('lang', lang);
    history.replaceState(null, '', location.pathname + '?' + params.toString() + location.hash);
    render();
  }

  function init() {
    render();
    var toggle = document.getElementById('legalLang');
    if (toggle) toggle.addEventListener('click', switchLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
