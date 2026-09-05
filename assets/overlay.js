/**
 * The shared behaviour behind every sheet in the theme -- the cart drawer, the
 * search overlay, the mobile filter sheet and the mobile menu.
 *
 * Each one slides from the edge it belongs to, moves focus in, traps it there,
 * closes on Escape or on the scrim, and returns focus to whatever opened it.
 * They differ only in which edge they come from, which is a CSS class.
 *
 * Markup contract:
 *
 *   <button data-overlay-open="CartDrawer" aria-expanded="false">Bag</button>
 *
 *   <aurelia-overlay id="CartDrawer" class="overlay overlay--end">
 *     <button class="overlay__scrim" data-overlay-close aria-label="Close"></button>
 *     <div class="overlay__sheet" role="dialog" aria-modal="true" aria-labelledby="CartDrawerTitle">
 *       ...
 *     </div>
 *   </aurelia-overlay>
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'details > summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

class AureliaOverlay extends HTMLElement {
  constructor() {
    super();
    this.opener = null;
    this.onKeydown = this.onKeydown.bind(this);
  }

  connectedCallback() {
    this.sheet = this.querySelector('.overlay__sheet');

    this.querySelectorAll('[data-overlay-close]').forEach((button) => {
      button.addEventListener('click', () => this.close());
    });
  }

  disconnectedCallback() {
    if (this.isOpen) this.releaseScrollLock();
    document.removeEventListener('keydown', this.onKeydown);
  }

  get isOpen() {
    return this.hasAttribute('data-open');
  }

  get focusable() {
    return Array.from(this.sheet.querySelectorAll(FOCUSABLE)).filter((element) => {
      return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement;
    });
  }

  open(opener) {
    if (this.isOpen) return;

    this.opener = opener || null;
    this.setAttribute('data-open', '');
    document.documentElement.classList.add('overlay-open');
    document.addEventListener('keydown', this.onKeydown);

    if (this.opener) this.opener.setAttribute('aria-expanded', 'true');

    // Wait one frame so the sheet has left its off-screen transform before
    // focus lands -- otherwise the browser scrolls to where it used to be.
    requestAnimationFrame(() => {
      const target = this.sheet.querySelector('[data-overlay-focus]') || this.focusable[0] || this.sheet;
      if (target === this.sheet) this.sheet.setAttribute('tabindex', '-1');
      target.focus();
    });

    this.dispatchEvent(new CustomEvent('overlay:open', { bubbles: true }));
  }

  close() {
    if (!this.isOpen) return;

    this.removeAttribute('data-open');
    this.releaseScrollLock();
    document.removeEventListener('keydown', this.onKeydown);

    if (this.opener) {
      this.opener.setAttribute('aria-expanded', 'false');
      this.opener.focus();
      this.opener = null;
    }

    this.dispatchEvent(new CustomEvent('overlay:close', { bubbles: true }));
  }

  releaseScrollLock() {
    const stillOpen = document.querySelector('aurelia-overlay[data-open]');
    if (stillOpen && stillOpen !== this) return;
    document.documentElement.classList.remove('overlay-open');
  }

  onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = this.focusable;
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!this.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }
}

if (!customElements.get('aurelia-overlay')) {
  customElements.define('aurelia-overlay', AureliaOverlay);
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-overlay-open]');
  if (!trigger) return;

  const overlay = document.getElementById(trigger.getAttribute('data-overlay-open'));
  if (!overlay || typeof overlay.open !== 'function') return;

  event.preventDefault();
  overlay.open(trigger);
});
