/* events.js – notices, events & exhibitions + registrations. */
import { read, write, persistent } from './storage.js';
import { logActivity } from './activity.js';
import { getUserById } from './auth.js';
import { apiRequest } from './api.js';

const EVENTS_KEY = 'scriptorium.events';
const REG_KEY = 'scriptorium.registrations';
let eventsCache = null;
let regsCache = null;
let usingApi = false;

const normEvent = e => ({
  ...e,
  date: Number(e.date || 0),
  registerBy: e.registerBy ?? (e.register_by ? Number(e.register_by) : null),
});

export async function syncEvents() {
  try {
    const [evs, regs] = await Promise.all([
      apiRequest('events.php'),
      apiRequest('events.php?action=all_registrations').catch(() => null),
    ]);
    if (Array.isArray(evs)) {
      usingApi = true;
      eventsCache = evs.map(normEvent);
      write(persistent, EVENTS_KEY, eventsCache);
    }
    if (Array.isArray(regs)) {
      regsCache = regs;
      write(persistent, REG_KEY, regsCache);
    }
    return eventsCache;
  } catch { /* fallback to local */ }
  return allEvents();
}

function seed() {
  if (read(persistent, EVENTS_KEY)) return;
  const d = 864e5, now = Date.now();
  write(persistent, EVENTS_KEY, [
    { id: 'e1', kind: 'Exhibition', title: 'Scriptorium Annual Art Exhibition', date: now + 21 * d, venue: 'University Main Hall',
      description: 'Our yearly showcase of student paintings, crafts and photography. Selected pieces will be displayed and open to the public.', registerBy: now + 14 * d },
    { id: 'e2', kind: 'Event', title: 'Open Mic Poetry Evening', date: now + 9 * d, venue: 'Library Auditorium',
      description: 'Read your own poems or just come to listen. Sign up for a 5-minute slot.', registerBy: now + 7 * d },
    { id: 'e3', kind: 'Event', title: 'Photography Walk – Old Town', date: now + 6 * d, venue: 'Meet at the main gate',
      description: 'A guided golden-hour walk with tips on composition. Bring any camera, phones are welcome.', registerBy: now + 4 * d },
    { id: 'e4', kind: 'Event', title: 'Artcraft Workshop: Paper & Clay', date: now + 30 * d, venue: 'Fine Arts Studio 2',
      description: 'A hands-on workshop for beginners. Materials are provided. Limited seats.', registerBy: now + 24 * d },
    { id: 'n1', kind: 'Notice', title: 'Submissions open for the E-Chapbook', date: now + 2 * d, venue: 'Online',
      description: 'Share your poems and short prose through Create Post. Selected work will be featured in the next digital chapbook.', registerBy: null },
  ]);
}

export function allEvents() {
  if (eventsCache !== null) return [...eventsCache].sort((a, b) => a.date - b.date);
  seed();
  return read(persistent, EVENTS_KEY, []).map(normEvent).sort((a, b) => a.date - b.date);
}
export const getEvent = id => allEvents().find(e => e.id === id);
export const canRegister = e => e.kind !== 'Notice' && (!e.registerBy || e.registerBy > Date.now());

const regs = () => (regsCache !== null ? [...regsCache] : read(persistent, REG_KEY, []));
export const isRegistered = (eventId, userId) => regs().some(r => r.eventId === eventId && r.userId === userId);

export async function registerForEvent(eventId, userId, data) {
  if (isRegistered(eventId, userId)) throw new Error('You are already registered for this event.');
  try {
    await apiRequest('events.php?action=register', { method: 'POST', body: { event_id: eventId } });
    await syncEvents();
    return;
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  const list = regs();
  list.push({ eventId, userId, ...data, createdAt: Date.now() });
  if (regsCache !== null) regsCache = list;
  if (!write(persistent, REG_KEY, list)) throw new Error('Could not save your registration (browser storage is blocked).');
  logActivity('register');
}

/* ---------- admin: manage events ---------- */
export const allRegistrations = () => regs();
export const registrationsFor = eventId => regs().filter(r => r.eventId === eventId).sort((a, b) => a.createdAt - b.createdAt)
  .map(r => ({ ...r, user: getUserById(r.userId) }));

/** data: { kind, title, date(ts), venue, description, registerBy(ts|null) }. Throws Error(message). */
function clean(d) {
  const title = (d.title || '').trim(), venue = (d.venue || '').trim();
  if (title.length < 3) throw new Error('Please enter a title.');
  if (!d.date) throw new Error('Please choose the date and time.');
  if (!venue) throw new Error('Please enter a venue.');
  if (d.registerBy && d.registerBy > d.date) throw new Error('Registration must close before the event date.');
  return { kind: d.kind, title, venue, date: d.date, description: (d.description || '').trim(), registerBy: d.kind === 'Notice' ? null : (d.registerBy || null) };
}
export async function createEvent(d) {
  const c = clean(d);
  try {
    await apiRequest('events.php?action=create', { method: 'POST', body: { ...c, register_by: c.registerBy } });
    await syncEvents();
    return;
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  const list = allEvents(); list.push({ id: 'e_' + Date.now().toString(36), ...c });
  if (eventsCache !== null) eventsCache = list;
  write(persistent, EVENTS_KEY, list);
}
export async function updateEvent(id, d) {
  const c = clean(d);
  try {
    await apiRequest(`events.php?action=update&id=${encodeURIComponent(id)}`, { method: 'POST', body: { id, ...c, register_by: c.registerBy } });
    await syncEvents();
    return;
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  const list = allEvents(), i = list.findIndex(e => e.id === id);
  if (i < 0) throw new Error('Event not found.');
  list[i] = { ...list[i], ...c };
  if (eventsCache !== null) eventsCache = list;
  write(persistent, EVENTS_KEY, list);
}
export async function deleteEvent(id) {
  try {
    await apiRequest(`events.php?action=delete&id=${encodeURIComponent(id)}`, { method: 'POST', body: { id } });
    await syncEvents();
    return;
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  const nextEvs = allEvents().filter(e => e.id !== id);
  const nextRegs = regs().filter(r => r.eventId !== id);
  if (eventsCache !== null) eventsCache = nextEvs;
  if (regsCache !== null) regsCache = nextRegs;
  write(persistent, EVENTS_KEY, nextEvs);
  write(persistent, REG_KEY, nextRegs);
}
