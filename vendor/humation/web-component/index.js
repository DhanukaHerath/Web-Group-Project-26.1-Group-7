//library
import { createAvatar } from "@humation/core";

export function renderAvatarMarkup(assets, options = {}) {
  const { seed, selections, background, crop, size, title } = options;
  const data = createAvatar(assets, {
    seed,
    selections,
    background,
    crop,
  }).toRenderData();
  const { viewBox } = data;
  const width = size !== null && size !== void 0 ? size : viewBox.width;
  const height =
    size != null ? (size * viewBox.height) / viewBox.width : viewBox.height;
  const a11y = title
    ? `role="img"><title>${escapeText(title)}</title>`
    : 'aria-hidden="true">';
  const backgroundRect =
    data.background === "transparent"
      ? ""
      : `<rect x="${viewBox.x}" y="${viewBox.y}" width="${viewBox.width}" height="${viewBox.height}" fill="#${data.background}" />`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}" width="${width}" height="${height}" ${a11y}` +
    backgroundRect +
    data.content +
    "</svg>"
  );
}

export function defineAvatarElement(assets, tagName = "humation-avatar") {
  if (typeof customElements === "undefined") {
    throw new Error("defineAvatarElement requires a DOM environment");
  }
  if (customElements.get(tagName)) return;
  const slotIds = assets.selectionSlots.map((slot) => slot.id);
  class HumationAvatarElement extends HTMLElement {
    connectedCallback() {
      this.render();
    }
    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }
    render() {
      var _a, _b, _c, _d, _e;
      const selections = {};
      for (const id of slotIds) {
        const value = this.getAttribute(id);
        if (value) selections[id] = value;
      }
      const sizeAttr = this.getAttribute("size");
      const markup = renderAvatarMarkup(assets, {
        seed:
          (_a = this.getAttribute("seed")) !== null && _a !== void 0
            ? _a
            : undefined,
        selections,
        background:
          (_b = this.getAttribute("background")) !== null && _b !== void 0
            ? _b
            : undefined,
        crop:
          (_c = this.getAttribute("crop")) !== null && _c !== void 0
            ? _c
            : undefined,
        size: sizeAttr ? Number(sizeAttr) : undefined,
        title:
          (_d = this.getAttribute("title")) !== null && _d !== void 0
            ? _d
            : undefined,
      });
      const root =
        (_e = this.shadowRoot) !== null && _e !== void 0
          ? _e
          : this.attachShadow({ mode: "open" });
      root.innerHTML =
        "<style>:host{display:inline-block;line-height:0}svg{display:block}</style>" +
        markup;
    }
  }
  HumationAvatarElement.observedAttributes = [
    ...slotIds,
    "seed",
    "background",
    "crop",
    "size",
    "title",
  ];
  customElements.define(tagName, HumationAvatarElement);
}
function escapeText(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
