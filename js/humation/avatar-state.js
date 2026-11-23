/* avatar-state.js – the saved avatar shape and helpers.
   Saved shape (stored on the user record):
     { selections: {head, body, bottom, item, glasses}  // part ids
       colors:     {hair, skin, clothes, bottom, stroke}  // hex without '#'
       background: 'F6F5F4' }
   If a user has no saved avatar, one is generated from their user ID (seed). */
import { createAvatar } from '@humation/core';
import { manifest } from './setup.js';

const SKINS = ['FFE0CC', 'F1C9A5', 'D9A066', 'B97A4B', '8D5524', '5C3A21'];
const HAIRS = ['000000', '3B2415', '6B4423', 'B5651D', 'D4A017', 'C0C0C0', '8A2BE2', 'D2395C'];
const CLOTHES = ['FFFFFF', '002D50', 'E4572E', '2E8B57', 'F2C14E', '7B6CF6', 'F28EAE'];
const BACKGROUNDS = ['F6F5F4', 'DCE9F5', 'F8E1E7', 'E3F1DF', 'FFF1C9', 'E6E0F5'];
const pick = list => list[Math.floor(Math.random() * list.length)];

/** True when a saved state can be rendered by Humation. */
export function isValidState(state) {
  try {
    if (!state || typeof state !== 'object') return false;
    createAvatar(manifest, { selections: state.selections, colors: state.colors, background: state.background }).toString();
    return true;
  } catch { return false; }
}

/** Full state generated deterministically from a seed (e.g. the user ID). */
export function stateFromSeed(seed) {
  const j = createAvatar(manifest, { seed: String(seed) }).toJSON();
  return { selections: j.selections, colors: j.colors, background: j.background };
}

/** The avatar to show for a user: saved one, or seed-based fallback. */
export function resolveAvatar(user, fallbackSeed = 'guest') {
  if (user?.avatar && isValidState(user.avatar)) return normalize(user.avatar);
  return stateFromSeed(user?.id ?? fallbackSeed);
}

/** Brand-new random look (parts + colours) for the "Randomize" button. */
export function randomState() {
  const s = stateFromSeed(Math.random().toString(36).slice(2));
  s.colors = { ...s.colors, skin: pick(SKINS), hair: pick(HAIRS), clothes: pick(CLOTHES), bottom: pick(HAIRS) };
  s.background = pick(BACKGROUNDS);
  return s;
}

/** Copy with every value normalised to what Humation expects. */
export function normalize(state) {
  const base = stateFromSeed('default-base');
  const hex = v => String(v).replace(/^#/, '').toUpperCase();
  return {
    selections: { ...base.selections, ...state.selections },
    colors: Object.fromEntries(Object.entries({ ...base.colors, ...state.colors }).map(([k, v]) => [k, hex(v)])),
    background: hex(state.background ?? base.background),
  };
}
