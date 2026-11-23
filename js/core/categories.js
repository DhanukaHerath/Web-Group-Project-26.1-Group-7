import { read, write, persistent } from './storage.js';

const KEY = 'scriptorium.categories';
const DEFAULTS = [
  { id: 'artwork',     label: 'Artwork',     plural: 'Artworks',    type: 'image', description: 'Paintings and drawings' },
  { id: 'artcraft',    label: 'Artcraft',    plural: 'Artcrafts',   type: 'image', description: 'Handmade crafts' },
  { id: 'photography', label: 'Photography', plural: 'Photography', type: 'image', description: 'Photographs' },
  { id: 'poem',        label: 'Poem',        plural: 'Poems',       type: 'text',  description: 'Poems and verse' },
];

export function getCategories() {
  let list = read(persistent, KEY);
  if (!list) { list = DEFAULTS; write(persistent, KEY, list); }
  return list;
}
export const categoryOf = id => getCategories().find(c => c.id === id);
export const isTextCategory = id => categoryOf(id)?.type === 'text';

const pluralOf = l => /(s|phy)$/i.test(l) ? l : /[^aeiou]y$/i.test(l) ? l.slice(0, -1) + 'ies' : l + 's';

export function addCategory({ label, type, description = '' }) {
  label = (label || '').trim();
  if (label.length < 2) throw new Error('Please enter a category name.');
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const list = getCategories();
  if (!id || list.some(c => c.id === id || c.label.toLowerCase() === label.toLowerCase())) throw new Error('A category with that name already exists.');
  list.push({ id, label, plural: pluralOf(label), type: type === 'text' ? 'text' : 'image', description: description.trim() });
  write(persistent, KEY, list);
}

export function removeCategory(id, postCount) {
  if (postCount > 0) throw new Error(`${postCount} post${postCount === 1 ? '' : 's'} still use this category, so it can't be removed.`);
  write(persistent, KEY, getCategories().filter(c => c.id !== id));
}
