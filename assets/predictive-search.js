/**
 * Predictive search.
 *
 * Debounced fetch of the `predictive-search` section through the Predictive
 * Search API, painted into the overlay's results region.
 *
 * The count is announced politely rather than assertively: someone typing a
 * query does not want to be interrupted after every keystroke. An in-flight
 * request is aborted when the next keystroke arrives, so results can never
 * arrive out of order and overwrite a newer answer with an older one.
 */

class AureliaPredictiveSearch extends HTMLElement {
  connectedCallback() {
    if (this.dataset.enabled !== 'true') return;

    this.input = this.querySelector('[data-predictive-input]');
    this.results = this.querySelector('[data-predictive-results]');
    this.count = this.querySelector('[data-predictive-count]');
    if (!this.input || !this.results) return;

    this.limit = Number(this.dataset.limit) || 6;
    this.controller = null;
    this.timer = null;

    this.input.addEventListener('input', () => this.onInput());
    this.input.addEventListener('focus', () => this.onInput());
  }

  onInput() {
    clearTimeout(this.timer);
    const query = this.input.value.trim();

    if (query.length < 2) {
      this.clear();
      return;
    }

    this.timer = setTimeout(() => this.search(query), 250);
  }

  clear() {
    if (this.controller) this.controller.abort();
    this.results.innerHTML = '';
    if (this.count) this.count.textContent = '';
  }

  async search(query) {
    // Abandon whatever is in flight; a newer query always wins.
    if (this.controller) this.controller.abort();
    this.controller = new AbortController();

    const params = new URLSearchParams({
      q: query,
      'resources[type]': 'product,article,page',
      'resources[limit]': String(this.limit),
      'resources[options][unavailable_products]': 'last',
      section_id: 'predictive-search',
    });

    const routes = (window.Aurelia && window.Aurelia.routes) || {};
    const url = `${routes.predictiveSearch}?${params.toString()}`;

    try {
      const response = await fetch(url, { signal: this.controller.signal });
      if (!response.ok) throw new Error(String(response.status));

      const markup = await response.text();
      const parsed = new DOMParser().parseFromString(markup, 'text/html');
      const section = parsed.querySelector('.shopify-section');

      this.results.innerHTML = section ? section.innerHTML : '';
      this.updateCount();
    } catch (error) {
      if (error.name === 'AbortError') return;
      this.clear();
    }
  }

  updateCount() {
    if (!this.count) return;
    const announcement = this.results.querySelector('[data-predictive-announce]');
    this.count.textContent = announcement ? announcement.textContent.trim() : '';
  }
}

if (!customElements.get('aurelia-predictive-search')) {
  customElements.define('aurelia-predictive-search', AureliaPredictiveSearch);
}
