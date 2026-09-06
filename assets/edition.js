/**
 * The edition countdown.
 *
 * The value is rendered on the server, so the page is already correct with this
 * script absent. All this does is keep it current, once a minute -- never once
 * a second, which would make the polite live region unusable.
 *
 * The live region is section-local on purpose. #CartStatus belongs to cart
 * operations, and interleaving "three days, four hours" with "Added to your
 * bag" would make both harder to follow.
 *
 * Every English string arrives in a data attribute as a [count] template, the
 * same idiom as window.Aurelia.strings, so no copy lives in here.
 */

class AureliaEdition extends HTMLElement {
  connectedCallback() {
    this.output = this.querySelector('[data-edition-output]');
    this.deadline = Date.parse(this.getAttribute('data-deadline'));
    if (!this.output || isNaN(this.deadline)) return;

    this.onVisible = () => {
      if (!document.hidden) this.tick();
    };

    this.tick();
    this.schedule();
    document.addEventListener('visibilitychange', this.onVisible);
  }

  disconnectedCallback() {
    // The theme editor tears sections down and rebuilds them constantly.
    clearTimeout(this.timer);
    clearInterval(this.interval);
    document.removeEventListener('visibilitychange', this.onVisible);
  }

  schedule() {
    // Land the first tick on the minute boundary, then hold to it.
    this.timer = setTimeout(() => {
      this.tick();
      this.interval = setInterval(() => this.tick(), 60000);
    }, 60000 - (Date.now() % 60000));
  }

  unit(count, template, singular) {
    return count === 1 ? singular : template.replace('[count]', String(count));
  }

  read(name) {
    return this.getAttribute(`data-${name}`) || '';
  }

  tick() {
    const remaining = Math.floor((this.deadline - Date.now()) / 1000);
    if (remaining <= 0) {
      this.expire();
      return;
    }

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const pair = this.read('pair');

    let text;
    if (days > 0) {
      text = pair
        .replace('[major]', this.unit(days, this.read('days'), this.read('days-one')))
        .replace('[minor]', this.unit(hours, this.read('hours'), this.read('hours-one')));
    } else if (hours > 0) {
      text = pair
        .replace('[major]', this.unit(hours, this.read('hours'), this.read('hours-one')))
        .replace('[minor]', this.unit(minutes, this.read('minutes'), this.read('minutes-one')));
    } else if (minutes > 0) {
      text = this.unit(minutes, this.read('minutes'), this.read('minutes-one'));
    } else {
      text = this.read('imminent');
    }

    // Nothing changed, so say nothing. A live region that rewrites the same
    // string announces it again.
    if (this.output.textContent.trim() === text) return;
    this.output.textContent = text;
  }

  expire() {
    clearTimeout(this.timer);
    clearInterval(this.interval);

    if (this.read('expiry') === 'hide') {
      const root = this.closest('[data-edition-root]');
      if (root) root.hidden = true;
      return;
    }

    const message = document.createElement('p');
    message.className = 'edition__expired';
    message.textContent = this.read('expired-text');
    this.replaceWith(message);
  }
}

if (!customElements.get('aurelia-edition')) {
  customElements.define('aurelia-edition', AureliaEdition);
}
