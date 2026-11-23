/* auth.js – front-end only accounts, roles and sessions.
   - Accounts live in localStorage ("scriptorium.users"); the logged-in session in
     sessionStorage ("scriptorium.session") so it ends when the tab is closed.
   - Roles: 'member' | 'admin'.  Status: 'active' | 'suspended' (until a date) | 'banned'.
   - A first-run seed adds ONE admin account and a few DEMO members (they cannot log in).
   NOTE: there is no server – passwords are hashed but this is NOT real security.
   Replace these functions with API calls once a backend exists. */
import { read, write, remove, persistent, session } from './storage.js';
import { logActivity } from './activity.js';
import { apiRequest } from './api.js';

const USERS_KEY = 'scriptorium.users';
const SESSION_KEY = 'scriptorium.session';
const SEED_KEY = 'scriptorium.users.seed.v1';

/* Seeded admin login ->  email: admin@scriptorium.lk   password: Admin@2026   (change it in Edit profile) */
const ADMIN_HASH = 'c9f6d71b2738aaaaec5a836fcd8324a86601f70d8b2357df38055991d4ade2f6';

const H = 36e5, D = 864e5;
// [id, fullName, username, email, faculty, batch, lastActive(hours ago), joined(days ago), status, suspended-for(days)]
const DEMO_MEMBERS = [
  ['seed-nethmi',  'Nethmi Silva',      'nethmi_silva', 'nethmi@example.com',  'Faculty of Fine Arts & Design', '2024', 0.1, 58],
  ['seed-kavindu', 'Kavindu Fernando',  'kavindu_f',    'kavindu@example.com', 'Faculty of Arts',               '2023', 14,  51],
  ['seed-ishara',  'Ishara Jayasuriya', 'ishara_j',     'ishara@example.com',  'Faculty of Humanities & Social Sciences', '2024', 30, 44],
  ['seed-dilan',   'Dilan Perera',      'dilan_p',      'dilan@example.com',   'Faculty of IT / Computing',    '2022', 76,  37],
  ['seed-sanduni', 'Sanduni Wickrama',  'sanduni_w',    'sanduni@example.com', 'Faculty of Fine Arts & Design', '2025', 5,   29],
  ['seed-ayesha',  'Ayesha Khan',       'ayesha_k',     'ayesha@example.com',  'Faculty of Management & Commerce', '2024', 120, 21, 'suspended', 3],
  ['seed-chamath', 'Chamath Rajapaksa', 'chamath_r',    'chamath@example.com', 'Faculty of Engineering',      '2023', 400, 15, 'banned'],
];

function seedUsers() {
  if (read(persistent, SEED_KEY)) return;
  const users = read(persistent, USERS_KEY, []), now = Date.now();
  if (!users.some(u => u.email === 'admin@scriptorium.lk')) {
    users.push({ id: 'u_admin', fullName: 'Scriptorium Admin', username: 'admin', email: 'admin@scriptorium.lk', faculty: '', batch: '',
      passwordHash: ADMIN_HASH, role: 'admin', status: 'active', bio: 'Site administrator.', avatar: null, createdAt: now - 90 * D, lastActiveAt: now });
  }
  DEMO_MEMBERS.forEach(([id, fullName, username, email, faculty, batch, hrs, joined, status = 'active', susDays]) => {
    if (users.some(u => u.id === id)) return;
    users.push({ id, fullName, username, email, faculty, batch, passwordHash: '!', role: 'member', status, bio: '', avatar: null,
      suspendedUntil: status === 'suspended' ? now + susDays * D : null, createdAt: now - joined * D, lastActiveAt: now - hrs * H, demo: true });
  });
  write(persistent, USERS_KEY, users);
  write(persistent, SEED_KEY, true);
}
let usersCache = null;
let usingUsersApi = false;
const getUsers = () => { if (usersCache !== null) return [...usersCache]; seedUsers(); return read(persistent, USERS_KEY, []); };
const saveUsers = users => { if (usersCache !== null) usersCache = users; return write(persistent, USERS_KEY, users) || usersCache !== null; };

/** Fetch all users from MySQL (/api/users.php?action=all) for admin views. */
export async function syncUsers() {
  try {
    const rows = await apiRequest('users.php?action=all');
    if (Array.isArray(rows)) {
      usingUsersApi = true;
      usersCache = rows;
      write(persistent, USERS_KEY, rows);
      write(persistent, SEED_KEY, true);
      return rows;
    }
  } catch { /* fallback to local cache if offline / non-admin */ }
  return allUsers();
}

async function hash(text) {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('scriptorium:' + text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return 'x' + btoa(unescape(encodeURIComponent(text))); // fallback (insecure contexts)
}

const newId = () => 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const publicUser = u => { if (!u) return null; const { passwordHash, ...rest } = u; return { role: 'member', status: 'active', ...rest }; };

export const isAdmin = u => u?.role === 'admin';
/** 'active' | 'suspended' | 'banned' (a suspension that has run out counts as active). */
export function effectiveStatus(u) {
  if (u.status === 'banned') return 'banned';
  if (u.status === 'suspended' && u.suspendedUntil > Date.now()) return 'suspended';
  return 'active';
}

let lastTouch = 0;
/** Returns the logged-in user (without password hash) or null. Blocks banned/suspended accounts. */
export function currentUser() {
  const s = read(session, SESSION_KEY);
  if (!s) return null;
  const users = getUsers(), u = users.find(x => x.id === s.userId);
  if (!u || effectiveStatus(u) !== 'active') { remove(session, SESSION_KEY); return null; }
  if (Date.now() - (u.lastActiveAt || 0) > 6e4 && Date.now() - lastTouch > 6e4) { // "last active" heartbeat
    lastTouch = Date.now(); u.lastActiveAt = Date.now(); saveUsers(users);
  }
  return publicUser(u);
}

export const getUserById = id => publicUser(getUsers().find(u => u.id === id));
export const allUsers = () => getUsers().map(publicUser);

/** Shared validation + record creation (used by register and by admins). */
async function buildUser({ fullName, username, email, faculty, batch, password, confirmPassword, role = 'member' }, users) {
  fullName = (fullName || '').trim(); username = (username || '').trim(); email = (email || '').trim().toLowerCase();
  if (fullName.length < 2) throw new Error('Please enter your full name.');
  if (username.length < 2) throw new Error('Username must be at least 2 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  if (!faculty) throw new Error('Please select a faculty.');
  if (!batch) throw new Error('Please select a batch.');
  if ((password || '').length < 6) throw new Error('Password must be at least 6 characters.');
  if (confirmPassword !== undefined && password !== confirmPassword) throw new Error('Passwords do not match.');
  if (users.some(u => u.email === email)) throw new Error('An account with this email already exists.');
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) throw new Error('That username is taken.');
  return { id: newId(), fullName, username, email, faculty, batch, passwordHash: await hash(password), role, status: 'active',
    bio: '', avatar: null, createdAt: Date.now(), lastActiveAt: Date.now() };
}

function cacheUser(u) {
  if (!u) return null;
  const users = getUsers(), i = users.findIndex(x => x.id === u.id);
  if (i >= 0) users[i] = { ...users[i], ...u }; else users.push(u);
  saveUsers(users);
  write(session, SESSION_KEY, { userId: u.id });
  return publicUser(u);
}

/** Sync the logged-in user from the PHP session cookie (/api/auth.php?action=me). */
export async function syncAuth() {
  try {
    const data = await apiRequest('auth.php?action=me');
    if (data?.user) return cacheUser(data.user);
    remove(session, SESSION_KEY);
    return null;
  } catch {
    return currentUser(); // fallback if offline / no PHP server
  }
}

/** Create an account and sign in. Throws Error(message) on validation problems. */
export async function register(data) {
  try {
    const res = await apiRequest('auth.php?action=register', { method: 'POST', body: data });
    return cacheUser(res.user);
  } catch (err) {
    if (err.status && err.status !== 404) throw err;
  }
  const users = getUsers(), user = await buildUser({ ...data, role: 'member' }, users);
  users.push(user);
  if (!saveUsers(users)) throw new Error('Could not save your account (browser storage is blocked).');
  write(session, SESSION_KEY, { userId: user.id });
  logActivity('signup'); logActivity('login');
  return publicUser(user);
}

export async function login({ email, password }) {
  try {
    const res = await apiRequest('auth.php?action=login', { method: 'POST', body: { email, password } });
    return cacheUser(res.user);
  } catch (err) {
    if (err.status && err.status !== 404) throw err;
  }
  email = (email || '').trim().toLowerCase();
  const users = getUsers(), user = users.find(u => u.email === email);
  if (!user || user.passwordHash !== await hash(password || '')) throw new Error('Incorrect email or password.');
  const st = effectiveStatus(user);
  if (st === 'banned') throw new Error('This account has been banned. Please contact an administrator.');
  if (st === 'suspended') throw new Error('This account is suspended until ' + new Date(user.suspendedUntil).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) + '.');
  user.lastActiveAt = Date.now(); saveUsers(users);
  write(session, SESSION_KEY, { userId: user.id });
  logActivity('login');
  return publicUser(user);
}

export function logout() {
  remove(session, SESSION_KEY);
  apiRequest('auth.php?action=logout', { method: 'POST' }).catch(() => {});
}

/** Merge `patch` into the user record and persist. Returns the updated public user. */
export function updateUser(id, patch) {
  const users = getUsers();
  const i = users.findIndex(u => u.id === id);
  if (i < 0) throw new Error('User not found.');
  users[i] = { ...users[i], ...patch };
  if (!saveUsers(users)) throw new Error('Could not save (browser storage is blocked).');
  return publicUser(users[i]);
}

/** Change username/bio, optionally password. Validates uniqueness. */
export async function updateProfile(id, { username, bio, currentPassword, newPassword }) {
  const users = getUsers();
  const me = users.find(u => u.id === id);
  if (!me) throw new Error('User not found.');
  username = (username || '').trim();
  if (username.length < 2) throw new Error('Username must be at least 2 characters.');
  if (users.some(u => u.id !== id && u.username.toLowerCase() === username.toLowerCase())) throw new Error('That username is taken.');
  const patch = { username, bio: (bio || '').trim().slice(0, 240) };
  if (newPassword) {
    if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
    if (me.passwordHash !== await hash(currentPassword || '')) throw new Error('Current password is incorrect.');
    patch.passwordHash = await hash(newPassword);
  }
  return updateUser(id, patch);
}

/* ---------- admin operations ---------- */
export async function adminCreateUser(data) {
  try {
    const res = await apiRequest('users.php?action=create', { method: 'POST', body: data });
    await syncUsers();
    return publicUser(res.user);
  } catch (err) {
    if (usingUsersApi || (err.status && err.status !== 404)) throw err;
  }
  const users = getUsers(), user = await buildUser(data, users);
  users.push(user); saveUsers(users); return publicUser(user);
}
export async function setRole(id, role) {
  try {
    await apiRequest(`users.php?action=role&id=${encodeURIComponent(id)}`, { method: 'POST', body: { role } });
  } catch (err) {
    if (usingUsersApi || (err.status && err.status !== 404)) throw err;
  }
  return updateUser(id, { role });
}
export async function banUser(id) {
  try {
    await apiRequest(`users.php?action=status&id=${encodeURIComponent(id)}`, { method: 'POST', body: { status: 'banned' } });
  } catch (err) {
    if (usingUsersApi || (err.status && err.status !== 404)) throw err;
  }
  return updateUser(id, { status: 'banned', suspendedUntil: null });
}
export async function suspendUser(id, days) {
  try {
    await apiRequest(`users.php?action=status&id=${encodeURIComponent(id)}`, { method: 'POST', body: { status: 'suspended', days } });
  } catch (err) {
    if (usingUsersApi || (err.status && err.status !== 404)) throw err;
  }
  return updateUser(id, { status: 'suspended', suspendedUntil: Date.now() + days * D });
}
export async function restoreUser(id) {
  try {
    await apiRequest(`users.php?action=status&id=${encodeURIComponent(id)}`, { method: 'POST', body: { status: 'active' } });
  } catch (err) {
    if (usingUsersApi || (err.status && err.status !== 404)) throw err;
  }
  return updateUser(id, { status: 'active', suspendedUntil: null });
}

/** Redirect guests to the login page (remembering where they were going). */
export function requireLogin() {
  const u = currentUser();
  if (!u) {
    const next = location.pathname.split('/').pop() + location.search;
    location.replace('login.html?next=' + encodeURIComponent(next));
  }
  return u;
}
/** Only admins may stay; members go to their dashboard, guests to login. */
export function requireAdmin() {
  const u = requireLogin();
  if (u && !isAdmin(u)) { location.replace('dashboard.html'); return null; }
  return u;
}
