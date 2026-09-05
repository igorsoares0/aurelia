/**
 * Filtering and sorting.
 *
 * The form works without this file: it is a real GET form with a real submit
 * button. What this adds is submitting on change and replacing only the grid,
 * so the page does not jump back to the top after every filter.
 *
 * The submit button is only hidden once this script is running, so a customer
 * without JavaScript never loses the way to apply a filter.
 */

class AureliaFacets extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('[data-facets-form]');
    if (!this.form) return;

    this.form.classList.add('facets--auto');
    this.debounce = null;

    this.form.addEventListener('change', (event) => {
      if (!event.target.matches('[data-facets-input]')) return;
      this.queue();
    });

    // A price field fires `input` far more often than it fires `change`.
    this.form.addEventListener('input', (event) => {
      if (!event.target.matches('input[type="number"][data-facets-input]')) return;
      this.queue(500);
    });

    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.apply();
    });

    this.relocate();
    this.viewport = window.matchMedia('(min-width: 990px)');
    this.viewport.addEventListener('change', () => this.relocate());
  }

  /**
   * Moves the one set of filter controls between the sidebar and the mobile
   * sheet. The node itself travels; the controls are never duplicated, so the
   * two layouts cannot drift apart or submit different values.
   */
  relocate() {
    const panel = this.querySelector('[data-facets-panel]');
    const slot = this.querySelector('[data-facets-slot]');
    const home = this.querySelector('[data-facets-home]');
    if (!panel || !slot || !home) return;

    const wide = window.matchMedia('(min-width: 990px)').matches;
    const target = wide ? home : slot;
    if (panel.parentElement === target) return;

    target.appendChild(panel);
  }

  queue(wait) {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.apply(), wait || 0);
  }

  buildUrl() {
    const data = new FormData(this.form);
    const params = new URLSearchParams();

    for (const [key, value] of data.entries()) {
      if (String(value).trim() === '') continue;
      params.append(key, value);
    }

    const base = window.location.pathname;
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  }

  async apply() {
    const url = this.buildUrl();
    const sectionId = this.dataset.sectionId;

    this.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}section_id=${sectionId}`);
      if (!response.ok) throw new Error(String(response.status));

      const markup = await response.text();
      const parsed = new DOMParser().parseFromString(markup, 'text/html');
      const fresh = parsed.querySelector('[data-facets-root]');
      const current = this.querySelector('[data-facets-root]');

      if (fresh && current) {
        const focusedId = document.activeElement ? document.activeElement.id : null;
        current.innerHTML = fresh.innerHTML;
        this.form = this.querySelector('[data-facets-form]');
        if (this.form) this.form.classList.add('facets--auto');
        this.relocate();

        if (focusedId) {
          const restored = document.getElementById(focusedId);
          if (restored) restored.focus();
        }
      }

      // The URL is part of the result: a filtered grid should be shareable.
      window.history.pushState({ url }, '', url);
    } catch (error) {
      // Fall back to a full navigation rather than leaving a stale grid.
      window.location.href = url;
    } finally {
      this.removeAttribute('aria-busy');
    }
  }
}

window.addEventListener('popstate', () => {
  window.location.reload();
});

if (!customElements.get('aurelia-facets')) {
  customElements.define('aurelia-facets', AureliaFacets);
}
