/* notifications.js – per-user notifications */
import { read, write, persistent } from './storage.js';
const KEY = 'scriptorium.notifications';
const all = () => read(persistent, KEY, []);

export function addNotification({ userId, type, title, message, postId = null }) {
  const list = all();
  list.push({ id: 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), userId, type, title, message, postId, createdAt: Date.now(), read: false });
  write(persistent, KEY, list);
}
export const notificationsFor = userId => all().filter(n => n.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
export const unreadCount = userId => all().filter(n => n.userId === userId && !n.read).length;
export function markAllRead(userId) {
  const list = all(); let changed = false;
  list.forEach(n => { if (n.userId === userId && !n.read) { n.read = true; changed = true; } });
  if (changed) write(persistent, KEY, list);
}
