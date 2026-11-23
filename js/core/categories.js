/* categories.js – post categories (managed by admins). */
import { read, write, persistent } from './storage.js';
import { apiRequest } from './api.js';

const KEY = 'scriptorium.categories';
const DEFAULTS = [
  { id: 'artwork',     label: 'Artwork',     plural: 'Artworks',    type: 'image', description: 'Paintings and drawings' },
  { id: 'artcraft',    label: 'Artcraft',    plural: 'Artcrafts',   type: 'image', description: 'Handmade crafts' },
  { id: 'photography', label: 'Photography', plural: 'Photography', type: 'image', description: 'Photographs' },
  { id: 'poem',        label: 'Poem',        plural: 'Poems',       type: 'text',  description: 'Poems and verse' },
];

let catsCache = null;
let usingApi = false;

export async function syncCategories() {
  try {
    const rows = await apiRequest('categories.php');
    if (Array.isArray(rows) && rows.length) {
      usingApi = true;
      catsCache = rows;
      write(persistent, KEY, rows);
      return rows;
    }
  } catch { /* fallback to local */ }
  return getCategories();
}

export function getCategories() {
  if (catsCache !== null) return [...catsCache];
  let list = read(persistent, KEY);
  if (!list) { list = DEFAULTS; write(persistent, KEY, list); }
  return list;
}
export const categoryOf = id => getCategories().find(c => c.id === id);
export const isTextCategory = id => categoryOf(id)?.type === 'text';

const pluralOf = l => /(s|phy)$/i.test(l) ? l : /[^aeiou]y$/i.test(l) ? l.slice(0, -1) + 'ies' : l + 's';

/** type: 'image' (upload + description) or 'text' (written piece). Throws Error(message). */
export async function addCategory({ label, type, description = '' }) {
  label = (label || '').trim();
  if (label.length < 2) throw new Error('Please enter a category name.');
  try {
    await apiRequest('categories.php', { method: 'POST', body: { label, type, description: description.trim() } });
    await syncCategories();
    return;
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const list = getCategories();
  if (!id || list.some(c => c.id === id || c.label.toLowerCase() === label.toLowerCase())) throw new Error('A category with that name already exists.');
  list.push({ id, label, plural: pluralOf(label), type: type === 'text' ? 'text' : 'image', description: description.trim() });
  if (catsCache !== null) catsCache = list;
  write(persistent, KEY, list);
}

/** Removes a category. `postCount` = how many posts use it (blocked if > 0). */
export async function removeCategory(id, postCount) {
  if (postCount > 0) throw new Error(`${postCount} post${postCount === 1 ? '' : 's'} still use this category, so it can't be removed.`);
  try {
    await apiRequest(`categories.php?action=delete&id=${encodeURIComponent(id)}`, { method: 'POST', body: { id } });
    await syncCategories();
    return;
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  const next = getCategories().filter(c => c.id !== id);
  if (catsCache !== null) catsCache = next;
  write(persistent, KEY, next);
}
