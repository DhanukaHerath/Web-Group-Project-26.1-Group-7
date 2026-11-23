/* posts.js – posts store (localStorage) with an approval workflow.
   status: 'pending' → 'approved' | 'disapproved'. Only approved posts are public.
   Demo content is seeded on first run. */
import { read, write, persistent } from './storage.js';
import { getUserById } from './auth.js';
import { addNotification } from './notifications.js';
import { getCategories, categoryOf, isTextCategory } from './categories.js';
import { apiRequest } from './api.js';

export { getCategories, categoryOf, isTextCategory };
const KEY = 'scriptorium.posts';
const SEEDED = 'scriptorium.posts.seeded.v1';

/* sample authors for the demo posts (they are also listed as demo members) */
const SEED_AUTHORS = ['seed-nethmi', 'seed-kavindu', 'seed-ishara', 'seed-dilan', 'seed-sanduni'];
const SEED_NAMES = ['nethmi_silva', 'kavindu_f', 'ishara_j', 'dilan_p', 'sanduni_w'];
const TITLES = ['Blue Blossom', 'The Dancer', 'Garden Wanderer', 'Lighthouse Swirl', 'Skeleton Bouquet', 'Eiffel at Night',
  'Self-Portrait with Violinist', 'Mona Lisa, Reimagined', 'Shadows Below', 'Koi Pond', 'Painted Earth'];
const POEMS = [
  ['Monsoon Window', 'The rain writes slow letters on the glass,\nand I read each one aloud —\nsmall rivers learning how to leave.'],
  ['Ink', 'I borrowed the night to write with,\nbut the morning kept asking\nfor its colours back.'],
  ['Home Is a Verb', 'Not the roof, not the road —\nthe way your name sounds\nwhen someone calls it kindly.'],
  ['Brushstroke', 'One line, and the blank page\nstops being afraid of itself.'],
];
const PENDING_DEMO = [ // waiting in the admin approval queue
  ['Rain on Tin Roofs', 'poem', 'Every drop knocks twice —\nonce on the roof, once on memory.', 'seed-kavindu', 'kavindu_f'],
  ['Sunday Market', 'poem', 'Mangoes stacked like small suns,\nthe vendor counts change in a song.', 'seed-sanduni', 'sanduni_w'],
];

function seed() {
  if (read(persistent, SEEDED)) return;
  const day = 864e5, now = Date.now();
  const posts = TITLES.map((title, i) => ({
    id: 'p_seed_art' + (i + 1), authorId: SEED_AUTHORS[i % 5], authorName: SEED_NAMES[i % 5],
    category: 'artwork', title, description: 'A sample artwork from the Scriptorium community.',
    image: `images/gallery/art${i + 1}.jpg`, createdAt: now - (i * 1.3 + 1) * day, status: 'approved', featured: true,
  })).concat(POEMS.map(([title, text], i) => ({
    id: 'p_seed_poem' + (i + 1), authorId: SEED_AUTHORS[(i + 2) % 5], authorName: SEED_NAMES[(i + 2) % 5],
    category: 'poem', title, text, createdAt: now - (i * 2 + 0.5) * day, status: 'approved',
  }))).concat(PENDING_DEMO.map(([title, category, text, authorId, authorName], i) => ({
    id: 'p_seed_pend' + (i + 1), authorId, authorName, category, title, text, createdAt: now - (i + 0.2) * 36e5 * 5, status: 'pending',
  })));
  write(persistent, KEY, posts);
  write(persistent, SEEDED, true);
}

const norm = p => ({
  status: 'approved',
  featured: false,
  ...p,
  authorId: p.authorId ?? p.author_id,
  authorName: p.authorName ?? p.author_name,
  createdAt: Number(p.createdAt ?? p.created_at ?? 0),
  reviewNote: p.reviewNote ?? p.review_note ?? '',
  reviewedAt: p.reviewedAt ?? (p.reviewed_at ? Number(p.reviewed_at) : null),
  reviewedBy: p.reviewedBy ?? p.reviewed_by ?? null,
});

let usingApi = false;
let postsCache = null;

/** Fetch all posts from MySQL (/api/posts.php?status=all) and cache locally. */
export async function syncPosts() {
  try {
    const rows = await apiRequest('posts.php?status=all');
    if (Array.isArray(rows)) {
      usingApi = true;
      postsCache = rows.map(norm);
      write(persistent, KEY, postsCache);
      write(persistent, SEEDED, true);
      return postsCache;
    }
  } catch { /* fallback to local cache if offline / no PHP server */ }
  return allPosts();
}

export function allPosts() {
  if (postsCache !== null) return postsCache.map(norm).sort((a, b) => b.createdAt - a.createdAt);
  seed();
  return read(persistent, KEY, []).map(norm).sort((a, b) => b.createdAt - a.createdAt);
}
export const publicPosts = () => allPosts().filter(p => p.status === 'approved');
export const getPost = id => allPosts().find(p => p.id === id);
export const postsByStatus = s => allPosts().filter(p => p.status === s);
export const postsByUser = id => allPosts().filter(p => p.authorId === id);
export const featuredPosts = () => publicPosts().filter(p => p.featured && p.image);

function save(posts) {
  if (postsCache !== null) postsCache = posts;
  if (!write(persistent, KEY, posts) && postsCache === null) throw new Error('Could not save – browser storage is full.');
}
function patchPost(id, patch) {
  const posts = postsCache !== null ? [...postsCache] : (seed(), read(persistent, KEY, []));
  const i = posts.findIndex(p => p.id === id);
  if (i < 0) throw new Error('Post not found.');
  posts[i] = { ...posts[i], ...patch }; save(posts); return norm(posts[i]);
}

/** New posts go to the admin approval queue (status "pending"). */
export async function addPost(user, { category, title, description = '', text = '', image = '', file = null }) {
  try {
    let body;
    if (file) {
      body = new FormData();
      body.append('category', category);
      body.append('title', title.trim());
      body.append('description', description.trim());
      body.append('text', text.trim());
      body.append('file', file);
    } else {
      body = { category, title: title.trim(), description: description.trim(), text: text.trim(), image };
    }
    const res = await apiRequest('posts.php', { method: 'POST', body });
    await syncPosts();
    return res.post;
  } catch (err) {
    if (err.status && err.status !== 404) throw err;
  }
  seed();
  const posts = read(persistent, KEY, []);
  const post = { id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    authorId: user.id, authorName: user.username, category, title: title.trim(), description: description.trim(), text: text.trim(), image,
    createdAt: Date.now(), status: 'pending', featured: false };
  posts.push(post);
  if (!write(persistent, KEY, posts)) throw new Error('Could not save – browser storage is full. Try a smaller image.');
  return post;
}

/** Admin decision. A disapproval needs a note; the author gets a notification either way. */
export async function reviewPost(id, admin, { decision, note = '' }) {
  const post = getPost(id); if (!post) throw new Error('Post not found.');
  note = note.trim();
  if (decision === 'disapproved' && note.length < 5) throw new Error('Please write a short note explaining why (at least 5 characters).');
  try {
    await apiRequest(`posts.php?action=review&id=${encodeURIComponent(id)}`, {
      method: 'POST',
      body: { decision, note },
    });
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  const updated = patchPost(id, { status: decision, reviewNote: decision === 'disapproved' ? note : '', reviewedAt: Date.now(), reviewedBy: admin.id,
    featured: decision === 'approved' ? post.featured : false });
  addNotification(decision === 'approved'
    ? { userId: post.authorId, type: 'approved', postId: id, title: 'Post approved', message: `“${post.title}” was approved and is now in the gallery.` }
    : { userId: post.authorId, type: 'disapproved', postId: id, title: 'Post disapproved', message: `“${post.title}” was not approved. Reason: ${note}` });
  return updated;
}

export async function setFeatured(id, featured) {
  try {
    await apiRequest(`posts.php?action=feature&id=${encodeURIComponent(id)}`, {
      method: 'POST',
      body: { featured },
    });
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  return patchPost(id, { featured });
}

/** Author record for a post: real/demo member (so their latest avatar shows). */
export function authorOf(post) {
  return getUserById(post.authorId) || {
    id: post.authorId,
    username: post.authorName,
    fullName: post.full_name || post.authorName,
    avatar: post.author_avatar || null,
  };
}
export const isRealMember = a => /^u_/.test(a.id);
export const displayName = a => a.fullName || a.username;
