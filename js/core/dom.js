/* dom.js – small DOM helpers shared by all pages. */

/** Escape text for safe use inside HTML / attribute values. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Show a short status toast at the bottom of the screen. */
export function toast(message, type = 'ok') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.className = `toast ${type} show`;
  el.textContent = message;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2600);
}

/** "active 14 hours ago" style text. */
export function timeAgo(ts) {
  if (!ts) return 'never';
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 300) return 'just now';
  const f = (n, u) => `${Math.floor(n)} ${u}${Math.floor(n) === 1 ? '' : 's'} ago`;
  if (s < 3600) return f(s / 60, 'minute');
  if (s < 86400) return f(s / 3600, 'hour');
  if (s < 86400 * 30) return f(s / 86400, 'day');
  return f(s / (86400 * 30), 'month');
}
export const fmtDate = ts => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
