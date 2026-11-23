import { getPartsForSlot, createPartPreview } from "@humation/core";
import { manifest, SELECTION_SLOTS, COLOR_SLOTS } from "./setup.js";
import { normalize, randomState } from "./avatar-state.js";
import { avatarFromState } from "./avatar-view.js";
import { esc } from "../core/dom.js";

// IDs of the editable colors
const EDITABLE_COLORS = COLOR_SLOTS.map((c) => c.id);

const cap = (s) => s.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

/**
 * @param {HTMLElement} root
 * @param {object} initial       avatar state in the start
 * @param {(state)=>void} onChange  called after every edit
 */
export function createAvatarPicker(root, initial, onChange = () => {}) {
  let state = normalize(initial);
  let activeSlot = SELECTION_SLOTS[0].id;

  root.innerHTML = `
    <div class="ap-preview" data-ref="preview" aria-live="polite"></div>
    <div class="ap-actions">
      <button type="button" class="btn-outline" data-action="random">🎲 Randomize</button>
      <button type="button" class="btn-outline" data-action="reset">Undo changes</button>
    </div>
    <div class="ap-tabs" role="tablist" data-ref="tabs">
      ${SELECTION_SLOTS.map((s) => `<button type="button" role="tab" data-slot="${s.id}">${esc(s.label)}</button>`).join("")}
    </div>
    <div class="ap-parts" data-ref="parts" role="listbox"></div>
    <div class="ap-colors" data-ref="colors"></div>`;

  const ref = (n) => root.querySelector(`[data-ref="${n}"]`);

  const original = normalize(initial);

  // Big avatar preview at the top
  function renderPreview() {
    ref("preview").innerHTML = avatarFromState(state, {
      size: 200,
      title: "Your avatar preview",
    });
  }

  // highlighting the currently open category tab
  function renderTabs() {
    ref("tabs")
      .querySelectorAll("button")
      .forEach((b) => {
        const on = b.dataset.slot === activeSlot;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on);
      });
  }

  function renderParts() {
    const selected = state.selections[activeSlot];

    ref("parts").innerHTML = getPartsForSlot(manifest, activeSlot)
      .map((part) => {
        const uri = createPartPreview(manifest, part, {
          colors: state.colors,
        }).toDataUri();

        return `<button type="button" role="option" class="ap-part${part.id === selected ? " selected" : ""}" data-part="${esc(part.id)}" aria-selected="${part.id === selected}" title="${esc(cap(part.name))}">
        <img src="${uri}" alt="${esc(cap(part.name))}" loading="lazy" width="64" height="64"></button>`;
      })
      .join("");
  }

  function renderColors() {
    ref("colors").innerHTML = COLOR_SLOTS.map(
      (c) =>
        `<label class="ap-color"><span>${esc(c.label)}</span>
        <input type="color" data-color="${c.id}" value="#${state.colors[c.id] ?? state.background}"></label>`,
    ).join("");
  }
  function renderAll() {
    renderPreview();
    renderTabs();
    renderParts();
    renderColors();
  }

  // Tell the page something changed
  const emit = () => onChange(structuredClone(state));

  root.addEventListener("click", (e) => {
    const slotBtn = e.target.closest("[data-slot]");
    const partBtn = e.target.closest("[data-part]");
    const action = e.target.closest("[data-action]")?.dataset.action;

    if (slotBtn) {
      activeSlot = slotBtn.dataset.slot;
      renderTabs();
      renderParts();
    } else if (partBtn) {
      state.selections[activeSlot] = partBtn.dataset.part;
      renderPreview();
      renderParts();
      emit();
    } else if (action === "random") {
      state = normalize(randomState());
      renderAll();
      emit();
    } else if (action === "reset") {
      state = structuredClone(original);
      renderAll();
      emit();
    }
  });

  root.addEventListener("input", (e) => {
    const id = e.target.dataset?.color;
    if (!id) return;

    // storing the color as a uppercaase without '#'
    const hex = e.target.value.replace("#", "").toUpperCase();

    if (id === "background") {
      state.background = hex;
    } else {
      state.colors[id] = hex;
    }

    renderPreview();
    emit();
  });

  // when the user lets go of the colour picker, refresh the part thumbnails
  root.addEventListener("change", (e) => {
    if (e.target.dataset?.color) renderParts();
  });
  renderAll();
  return { getState: () => structuredClone(state) };
}
