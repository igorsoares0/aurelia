/**
 * Deferred video, for the video-with-text section.
 *
 * The poster and the play control are in the DOM; the player waits inside a
 * <template> so nothing of it -- and, for an external embed, nothing of the
 * third party -- is fetched until a person asks. The swap puts the player into
 * the poster's own `.media` box rather than replacing the box, so the fixed
 * height and the absolute positioning in critical.css still apply.
 *
 * The control is an <a href>. Without this script it opens the video directly.
 */

class AureliaVideo extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', (event) => {
      const control = event.target.closest('[data-video-play]');
      if (!control) return;

      event.preventDefault();
      this.play(control);
    });
  }

  play(control) {
    const template = this.querySelector('[data-video-template]');
    const frame = this.querySelector('.media');
    if (!template || !frame) return;

    const player = template.content.firstElementChild;
    if (!player) return;

    // `video_tag` takes no arbitrary attributes, so the accessible name is set
    // here. The iframe already carries its own `title`.
    const label = this.getAttribute('data-video-label');
    if (label && player.tagName === 'VIDEO') player.setAttribute('aria-label', label);

    const poster = frame.querySelector('img, svg');
    frame.appendChild(player);
    if (poster) poster.remove();
    control.remove();

    // Deferred players start paused. This one plays because a person asked.
    if (typeof player.play === 'function') player.play();
    if (player.focus) player.focus();
  }
}

if (!customElements.get('aurelia-video')) {
  customElements.define('aurelia-video', AureliaVideo);
}
