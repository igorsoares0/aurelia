/**
 * Product page behaviour: variant selection, deferred media, and the mobile
 * gallery counter.
 *
 * Variant selection re-renders the section on the server rather than patching
 * the DOM from a client-side variant matrix. That matters because availability
 * here is per combination -- Shopify computes `value.variant` for each option
 * value against everything else currently selected, and reproducing that in
 * JavaScript is exactly the kind of duplicate logic that drifts out of sync
 * with the Liquid and starts lying about what is in stock.
 *
 * The cost is one request per option change. The benefit is that the dashed
 * states, the price, the sold-out branch and the media are all computed by the
 * same code that rendered the page.
 */

class AureliaVariants extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.productUrl = this.dataset.productUrl;

    // Delegated, and every lookup is fresh: the section's inner HTML is
    // replaced on each selection, so any node held from before is stale.
    this.addEventListener('change', (event) => {
      if (!event.target.matches('.option__input')) return;
      this.onSelect();
    });
  }

  selectedOptions() {
    return Array.from(this.querySelectorAll('.option__input:checked')).map((input) => input.value);
  }

  async onSelect() {
    if (!this.querySelector('[data-variant-picker]')) return;

    const options = this.selectedOptions();
    const variant = this.findVariant(options);
    if (!variant) return;

    // Keep the address bar honest: a shared link should open this variant.
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url.toString());

    this.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(`${this.productUrl}?variant=${variant.id}&section_id=${this.sectionId}`);
      if (!response.ok) throw new Error(String(response.status));

      const markup = await response.text();
      const parsed = new DOMParser().parseFromString(markup, 'text/html');
      const fresh = parsed.querySelector('[data-product-root]');
      const current = this.querySelector('[data-product-root]');

      if (fresh && current) {
        // Keep the focused control's identity across the swap so the keyboard
        // does not get dropped back at the top of the page.
        const focusedId = document.activeElement ? document.activeElement.id : null;
        current.innerHTML = fresh.innerHTML;
        if (focusedId) {
          const restored = document.getElementById(focusedId);
          if (restored) restored.focus();
        }
      }
    } catch (error) {
      // A failed refresh leaves the page as it was, which is still correct --
      // the form posts the id it already holds.
    } finally {
      this.removeAttribute('aria-busy');
    }
  }

  get variants() {
    if (!this.variantData) {
      const script = this.querySelector('[data-variant-data]');
      this.variantData = script ? JSON.parse(script.textContent) : [];
    }
    return this.variantData;
  }

  findVariant(options) {
    return this.variants.find((variant) => {
      return variant.options.every((option, index) => option === options[index]);
    });
  }
}

/* -------------------------------------------------------------------------
   Media: deferred players and the mobile position counter
   ------------------------------------------------------------------------- */

class AureliaGallery extends HTMLElement {
  connectedCallback() {
    this.list = this.querySelector('[data-gallery-list]');
    this.counter = this.querySelector('[data-gallery-counter]');

    this.addEventListener('click', (event) => {
      const play = event.target.closest('[data-gallery-play]');
      if (!play) return;
      this.play(play.closest('.gallery__item'));
    });

    if (this.list && this.counter) {
      this.list.addEventListener('scroll', () => this.onScroll(), { passive: true });
    }
  }

  play(item) {
    const template = item.querySelector('[data-gallery-template]');
    if (!template) return;

    const player = template.content.firstElementChild;
    if (!player) return;

    item.querySelector('.gallery__media').replaceWith(player);
    item.querySelector('.gallery__play').remove();
    const badge = item.querySelector('.gallery__badge');
    if (badge) badge.remove();

    // Deferred players start paused; play only because a person asked.
    if (typeof player.play === 'function') player.play();
    if (player.focus) player.focus();
  }

  onScroll() {
    clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      const items = Array.from(this.list.children);
      if (items.length === 0) return;

      const index = Math.round(this.list.scrollLeft / this.list.clientWidth);
      const position = Math.min(items.length, Math.max(1, index + 1));
      const template = (window.Aurelia && window.Aurelia.strings.mediaPosition) || '[index] / [total]';

      this.counter.textContent = template
        .replace('[index]', String(position))
        .replace('[total]', String(items.length));
    }, 120);
  }
}

/* -------------------------------------------------------------------------
   Recommendations, fetched after first paint
   ------------------------------------------------------------------------- */

class AureliaRecommendations extends HTMLElement {
  connectedCallback() {
    // Recommendations are generated per shopper, so they are fetched rather
    // than rendered inline -- holding the product page for them would cost
    // more than the row is worth.
    const url = this.dataset.url;
    if (!url) return;

    const load = () => this.load(url);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          load();
        },
        { rootMargin: '400px' }
      );
      observer.observe(this);
    } else {
      load();
    }
  }

  async load(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(String(response.status));

      const markup = await response.text();
      const parsed = new DOMParser().parseFromString(markup, 'text/html');
      const fresh = parsed.querySelector('aurelia-recommendations');

      if (fresh) this.innerHTML = fresh.innerHTML;
    } catch (error) {
      // No recommendations is a perfectly good outcome; leave the row empty.
    }
  }
}

/* -------------------------------------------------------------------------
   Gift card recipient
   ------------------------------------------------------------------------- */

/**
 * The recipient panel opens and closes in CSS, so it works with this file
 * blocked. What is added here is the two things CSS cannot do.
 *
 * A collapsed field is disabled, so an address that was typed and then
 * reconsidered is not still submitted as a line item property. And the buyer's
 * timezone offset is written into `__shopify_offset`, without which a card
 * scheduled for the 24th is sent against the shop's clock rather than the
 * buyer's and can arrive a day early.
 */
class AureliaGiftCardRecipient extends HTMLElement {
  connectedCallback() {
    this.fields = Array.from(this.querySelectorAll('[data-recipient-field]'));
    this.offset = this.querySelector('[data-recipient-offset]');
    this.toggle = this.querySelector('[data-recipient-toggle]');
    if (!this.toggle) return;

    if (this.offset) this.offset.value = new Date().getTimezoneOffset();

    this.toggle.addEventListener('change', () => this.sync());
    this.sync();
  }

  sync() {
    const sending = this.toggle.checked;

    this.fields.forEach((field) => {
      field.disabled = !sending;
    });
    if (this.offset) this.offset.disabled = !sending;

    if (!sending) this.clearErrors();
  }

  /**
   * `/cart/add.js` returns recipient failures keyed by field -- `email`,
   * `name`, `message`, `send_on` -- so each one is put under the field it
   * belongs to rather than summarised into the one line above the button.
   */
  showErrors(errors) {
    this.clearErrors();

    Object.keys(errors).forEach((key) => {
      const target = this.querySelector(`[data-recipient-error="${key}"]`);
      if (!target) return;

      const message = errors[key];
      target.querySelector('[data-recipient-error-text]').textContent = Array.isArray(message)
        ? message.join(', ')
        : message;
      target.hidden = false;

      const field = this.querySelector(`[data-recipient-field="${key}"]`);
      if (field) field.setAttribute('aria-invalid', 'true');
    });

    const first = this.querySelector('[data-recipient-field][aria-invalid="true"]');
    if (first) first.focus();
  }

  clearErrors() {
    this.querySelectorAll('[data-recipient-error]').forEach((target) => {
      target.querySelector('[data-recipient-error-text]').textContent = '';
      target.hidden = true;
    });
    this.fields.forEach((field) => field.removeAttribute('aria-invalid'));
  }
}

/* -------------------------------------------------------------------------
   Quantity steppers outside the cart
   ------------------------------------------------------------------------- */

document.addEventListener('click', (event) => {
  const step = event.target.closest('[data-quantity-step]');
  if (!step) return;
  if (step.closest('aurelia-cart-items')) return;

  const wrapper = step.closest('[data-quantity]');
  const input = wrapper.querySelector('[data-quantity-input]');
  const min = Number(input.min || 1);
  const delta = step.getAttribute('data-quantity-step') === 'up' ? 1 : -1;

  input.value = Math.max(min, Number(input.value) + delta);
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

if (!customElements.get('aurelia-variants')) {
  customElements.define('aurelia-variants', AureliaVariants);
}

if (!customElements.get('aurelia-gallery')) {
  customElements.define('aurelia-gallery', AureliaGallery);
}

if (!customElements.get('aurelia-recommendations')) {
  customElements.define('aurelia-recommendations', AureliaRecommendations);
}

if (!customElements.get('aurelia-gift-card-recipient')) {
  customElements.define('aurelia-gift-card-recipient', AureliaGiftCardRecipient);
}
