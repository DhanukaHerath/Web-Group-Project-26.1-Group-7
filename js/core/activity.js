import { read, write, persistent } from './storage.js';

const KEY = 'scriptorium.activity';
const SEED = 'scriptorium.activity.seed.v1';
export const TYPES = ['view', 'login', 'post', 'register', 'signup'];

export const dayKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function load() {
  let data = read(persistent, KEY, {});
  if (!read(persistent, SEED)) {
    
    let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 29; i >= 1; i--) {
      const k = dayKey(Date.now() - i * 864e5);
      if (data[k]) continue;
      const view = Math.round(90 + rnd() * 160 + (30 - i) * 2);
      data[k] = { view, login: Math.round(view * (0.18 + rnd() * 0.12)), post: Math.round(rnd() * 5), register: Math.round(rnd() * 4), signup: Math.round(rnd() * 3) };
    }
    write(persistent, KEY, data); write(persistent, SEED, true);
  }
  return data;
}

export function logActivity(type) {
  const data = load(), k = dayKey(Date.now());
  const day = data[k] || (data[k] = { view: 0, login: 0, post: 0, register: 0, signup: 0 });
  day[type] = (day[type] || 0) + 1;
  write(persistent, KEY, data);
}
export const activityByDay = () => load();
