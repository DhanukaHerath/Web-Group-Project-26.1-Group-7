/* notifications.js – per-user notifications (e.g. post approved / disapproved). */
import { read, write, persistent } from './storage.js';
import { apiRequest } from './api.js';
const KEY = 'scriptorium.notifications';
let cache = null;

const norm = n => ({
  ...n,
  userId: n.userId ?? n.user_id,
  postId: n.postId ?? n.post_id ?? null,
  createdAt: Number(n.createdAt ?? n.created_at ?? 0),
  read: n.read ?? Boolean(n.is_read),
});
const all = () => (cache !== null ? [...cache] : read(persistent, KEY, []).map(norm));

export async function syncNotifications() {
  try {
    const data = await apiRequest('notifications.php');
    if (data && Array.isArray(data.notifications)) {
      cache = data.notifications.map(norm);
      write(persistent, KEY, cache);
      return cache;
    }
  } catch { /* fallback to local */ }
  return all();
}

export function addNotification({ userId, type, title, message, postId = null }) {
  const list = all();
  list.push({ id: 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), userId, type, title, message, postId, createdAt: Date.now(), read: false });
  if (cache !== null) cache = list;
  write(persistent, KEY, list);
}
export const notificationsFor = userId => all().filter(n => n.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
export const unreadCount = userId => all().filter(n => n.userId === userId && !n.read).length;
export function markAllRead(userId) {
  const list = all(); let changed = false;
  list.forEach(n => { if (n.userId === userId && !n.read) { n.read = true; changed = true; } });
  if (changed) {
    if (cache !== null) cache = list;
    write(persistent, KEY, list);
  }
  apiRequest('notifications.php', { method: 'POST', body: { id: 'all' } }).catch(() => {});
}
