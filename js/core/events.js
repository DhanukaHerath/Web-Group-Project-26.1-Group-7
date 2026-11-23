/* events.js – notices, events & exhibitions + registrations (localStorage). */
import { read, write, persistent } from './storage.js';
import { logActivity } from './activity.js';
import { getUserById } from './auth.js';

const EVENTS_KEY = 'scriptorium.events';
const REG_KEY = 'scriptorium.registrations';

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

export function allEvents() { seed(); return read(persistent, EVENTS_KEY, []).sort((a, b) => a.date - b.date); }
export const getEvent = id => allEvents().find(e => e.id === id);
export const canRegister = e => e.kind !== 'Notice' && (!e.registerBy || e.registerBy > Date.now());

const regs = () => read(persistent, REG_KEY, []);
export const isRegistered = (eventId, userId) => regs().some(r => r.eventId === eventId && r.userId === userId);

export function registerForEvent(eventId, userId, data) {
  if (isRegistered(eventId, userId)) throw new Error('You are already registered for this event.');
  const list = regs();
  list.push({ eventId, userId, ...data, createdAt: Date.now() });
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
export function createEvent(d) {
  const list = allEvents(); list.push({ id: 'e_' + Date.now().toString(36), ...clean(d) });
  write(persistent, EVENTS_KEY, list);
}
export function updateEvent(id, d) {
  const list = allEvents(), i = list.findIndex(e => e.id === id);
  if (i < 0) throw new Error('Event not found.');
  list[i] = { ...list[i], ...clean(d) }; write(persistent, EVENTS_KEY, list);
}
export function deleteEvent(id) {
  write(persistent, EVENTS_KEY, allEvents().filter(e => e.id !== id));
  write(persistent, REG_KEY, regs().filter(r => r.eventId !== id));
}
