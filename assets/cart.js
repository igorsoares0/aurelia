/**
 * Cart behaviour: adding to the bag, changing a quantity, removing a line.
 *
 * Everything goes through Shopify's cart AJAX API and re-renders the affected
 * sections with the Section Rendering API rather than reloading the page.
 *
 * Two accessibility rules are enforced here rather than left to each template:
 * a quantity change is announced through a polite live region, and a failure to
 * add is announced through `role="alert"` while a success is announced through
 * `role="status"`. A blocking failure interrupts; a confirmation does not.
 */

const routes = (window.Aurelia && window.Aurelia.routes) || {};
const strings = (window.Aurelia && window.Aurelia.strings) || {};

function sectionsToRender() {
  return Array.from(document.querySelectorAll('[data-cart-section]'))
    .map((element) => element.getAttribute('data-cart-section'))
    .filter((id, index, all) => all.indexOf(id) === index);
}

function renderSections(sections) {
  if (!sections) return;

  Object.keys(sections).forEach((id) => {
    document.querySelectorAll(`[data-cart-section="${id}"]`).forEach((target) => {
      const parsed = new DOMParser().parseFromString(sections[id], 'text/html');
      const source = parsed.querySelector(`[data-cart-section="${id}"]`);
      if (source) target.innerHTML = source.innerHTML;
    });
  });
}

function announce(message, assertive) {
  const region = document.getElementById(assertive ? 'CartAlert' : 'CartStatus');
  if (!region) return;
  region.textContent = '';
  // A same-tick rewrite is not announced by every screen reader; a frame apart is.
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

async function postCart(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}

/* -------------------------------------------------------------------------
   Adding to the bag
   ------------------------------------------------------------------------- */

class AureliaProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    if (!this.form) return;

    this.submitButton = this.querySelector('[type="submit"]');
    this.errorTarget = this.querySelector('[data-form-error]');
    this.form.addEventListener('submit', (event) => this.onSubmit(event));
  }

  onSubmit(event) {
    // A missing required option is a validation failure, not a cart failure --
    // let the section's own validation handle it and never reach the network.
    if (this.hasAttribute('data-requires-selection')) {
      event.preventDefault();
      this.dispatchEvent(new CustomEvent('product-form:invalid', { bubbles: true }));
      return;
    }

    if (window.Aurelia && window.Aurelia.cartType !== 'drawer') return;

    event.preventDefault();
    this.addToCart();
  }

  async addToCart() {
    this.setPending(true);
    this.clearError();

    const formData = new FormData(this.form);
    const body = { items: [], sections: sectionsToRender(), sections_url: window.location.pathname };

    const item = { id: formData.get('id'), quantity: Number(formData.get('quantity') || 1) };
    const properties = {};
    formData.forEach((value, key) => {
      const match = key.match(/^properties\[(.+)\]$/);
      if (match && String(value).trim() !== '') properties[match[1]] = value;
    });
    if (Object.keys(properties).length > 0) item.properties = properties;

    const sellingPlan = formData.get('selling_plan');
    if (sellingPlan) item.selling_plan = sellingPlan;

    body.items.push(item);

    try {
      const data = await postCart(routes.cartAdd, body);
      renderSections(data.sections);
      announce(strings.addedToBag);
      this.openDrawer();
    } catch (error) {
      const message = (error && error.description) || strings.addToBagError;
      this.showError(message);
      announce(message, true);
    } finally {
      this.setPending(false);
    }
  }

  openDrawer() {
    const drawer = document.getElementById('CartDrawer');
    if (drawer && typeof drawer.open === 'function') drawer.open(this.submitButton);
  }

  setPending(pending) {
    if (!this.submitButton) return;
    this.submitButton.classList.toggle('is-pending', pending);
    this.submitButton.disabled = pending;
    this.submitButton.setAttribute('aria-busy', pending ? 'true' : 'false');
  }

  showError(message) {
    if (!this.errorTarget) return;
    this.errorTarget.textContent = message;
    this.errorTarget.hidden = false;
  }

  clearError() {
    if (!this.errorTarget) return;
    this.errorTarget.textContent = '';
    this.errorTarget.hidden = true;
  }
}

/* -------------------------------------------------------------------------
   Quantity and removal
   ------------------------------------------------------------------------- */

class AureliaCartItems extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', (event) => {
      const step = event.target.closest('[data-quantity-step]');
      if (step) {
        event.preventDefault();
        this.step(step);
        return;
      }

      const remove = event.target.closest('[data-cart-remove]');
      if (remove) {
        event.preventDefault();
        this.change(remove.getAttribute('data-cart-remove'), 0);
      }
    });

    this.addEventListener('change', (event) => {
      const input = event.target.closest('[data-quantity-input]');
      if (!input) return;
      this.change(input.getAttribute('data-line'), Number(input.value));
    });
  }

  step(button) {
    const wrapper = button.closest('[data-quantity]');
    const input = wrapper.querySelector('[data-quantity-input]');
    const delta = button.getAttribute('data-quantity-step') === 'up' ? 1 : -1;
    const next = Math.max(0, Number(input.value) + delta);

    input.value = next;
    this.change(input.getAttribute('data-line'), next);
  }

  async change(line, quantity) {
    this.setAttribute('aria-busy', 'true');

    try {
      const data = await postCart(routes.cartChange, {
        line: Number(line),
        quantity,
        sections: sectionsToRender(),
        sections_url: window.location.pathname,
      });

      renderSections(data.sections);
      announce(strings.quantityUpdated);

      // A cart emptied through the drawer should not leave a stale page behind.
      if (data.item_count === 0 && window.location.pathname === routes.cart) {
        window.location.reload();
      }
    } catch (error) {
      announce((error && error.description) || strings.addToBagError, true);
    } finally {
      this.removeAttribute('aria-busy');
    }
  }
}

if (!customElements.get('aurelia-product-form')) {
  customElements.define('aurelia-product-form', AureliaProductForm);
}

if (!customElements.get('aurelia-cart-items')) {
  customElements.define('aurelia-cart-items', AureliaCartItems);
}
