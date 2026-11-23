/* storage.js – tiny safe wrappers around Web Storage (never throws). */

/** Read JSON from a storage area; returns `fallback` when missing/corrupt/blocked. */
export function read(area, key, fallback = null) {
  try {
    const raw = area.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}

/** Write JSON to a storage area; returns true on success. */
export function write(area, key, value) {
  try { area.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function remove(area, key) {
  try { area.removeItem(key); } catch { /* ignore */ }
}

/** Accessors that fail soft if storage is blocked (private mode etc.). */
export const persistent = (() => { try { return window.localStorage; } catch { return memoryArea(); } })();
export const session = (() => { try { return window.sessionStorage; } catch { return memoryArea(); } })();

function memoryArea() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}
