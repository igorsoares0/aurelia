/**
 * Scroll reveal.
 *
 * Elements marked `data-reveal` fade in with a 20px rise, once, the first time
 * they enter the viewport. Nothing scales, lifts or rotates.
 *
 * Three guards are what make this safe rather than merely pretty, and all three
 * were learned from real failures:
 *
 *   1. If the document is already hidden when this runs -- a background tab, a
 *      thumbnail capture, a print job -- nothing is hidden in the first place.
 *   2. Elements already inside the viewport at init are never hidden, so the
 *      top of the page does not flash.
 *   3. `beforeprint` and `visibilitychange` force everything visible.
 *
 * Without them, print, PDF export and thumbnail capture come out blank.
 */

(function () {
  'use strict';

  const HIDDEN = 'hidden-until-revealed';
  const REVEALED = 'data-revealed';

  function reveal(element) {
    element.removeAttribute(HIDDEN);
    element.setAttribute(REVEALED, '');
  }

  function revealAll() {
    document.querySelectorAll('[data-reveal]').forEach(reveal);
  }

  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < viewportHeight && rect.bottom > 0;
  }

  function init() {
    const elements = Array.from(document.querySelectorAll('[data-reveal]'));
    if (elements.length === 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Guard 1 and the reduced-motion case: never hide anything.
    if (document.hidden || reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.06 }
    );

    elements.forEach(function (element) {
      // Guard 2: what is already on screen stays on screen.
      if (isInViewport(element)) {
        reveal(element);
        return;
      }
      element.setAttribute(HIDDEN, '');
      observer.observe(element);
    });

    // Guard 3: the failsafe.
    window.addEventListener('beforeprint', revealAll);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) return;
      revealAll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Sections re-render in the theme editor; re-scan when they do.
  document.addEventListener('shopify:section:load', init);
})();
