/* users – list, filter, add, export; suspend / ban / promote. */
import { allUsers, effectiveStatus, adminCreateUser, setRole, banUser, suspendUser, restoreUser } from '../../core/auth.js';
import { FACULTIES, BATCHES, optionsHTML } from '../../core/options.js';
import { avatarHTML } from '../../humation/avatar-view.js';
import { openModal, closeModal, confirmModal } from '../../components/modal.js';
import { downloadFile, toCSV } from '../../components/report.js';
import { toast, esc, timeAgo, fmtDate } from '../../core/dom.js';

const f = { q: '', role: 'all', status: 'all', date: 'all' };
const DAYS = { 7: 7, 30: 30, 90: 90 };

export function render(container, ctx) {
  const el = document.createElement('div'); container.replaceChildren(el);

  const filtered = () => allUsers().filter(u => {
    const st = effectiveStatus(u), hay = `${u.fullName || ''} ${u.username} ${u.email}`.toLowerCase();
    return (!f.q || hay.includes(f.q.toLowerCase())) && (f.role === 'all' || u.role === f.role) && (f.status === 'all' || st === f.status) &&
      (f.date === 'all' || u.createdAt > Date.now() - DAYS[f.date] * 864e5);
  }).sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0));

  function statusCell(u) {
    const st = effectiveStatus(u);
    if (st === 'banned') return '<span class="status-pill disapproved">Banned</span>';
    if (st === 'suspended') return `<span class="status-pill pending">Suspended</span><small class="note-line">until ${fmtDate(u.suspendedUntil)}</small>`;
    return '<span class="status-pill approved">Active</span>';
  }
  function actions(u) {
    if (u.id === ctx.user.id) return '<span class="muted">You</span>';
    const st = effectiveStatus(u), b = (a, t, cls = '') => `<button type="button" class="mini ${cls}" data-act="${a}" data-id="${esc(u.id)}">${t}</button>`;
    if (u.role === 'admin') return b('demote', 'Remove admin');
    if (st === 'banned') return b('restore', 'Unban');
    return (st === 'suspended' ? b('restore', 'Lift suspension') : b('suspend', 'Suspend')) + b('ban', 'Ban', 'danger') + b('promote', 'Make admin');
  }
  function last(u) {
    const t = u.lastActiveAt, fresh = t && Date.now() - t < 15 * 60e3;
    return `<span class="live ${fresh ? 'on' : ''}"></span>${t ? (fresh ? 'Active now' : 'Active ' + timeAgo(t)) : 'Never active'}`;
  }

  function paint() {
    const list = filtered();
    el.querySelector('tbody').innerHTML = list.map(u => `<tr>
      <td><div class="creator">${avatarHTML(u, { size: 36 })}<div><b>${esc(u.fullName || u.username)}</b><small>@${esc(u.username)} · ${esc(u.email)}</small></div></div></td>
      <td><span class="role-tag ${u.role}">${u.role === 'admin' ? 'Admin' : 'Member'}</span></td>
      <td>${esc([u.faculty, u.batch].filter(Boolean).join(' · ') || '–')}</td>
      <td>${statusCell(u)}</td><td class="nowrap">${last(u)}</td><td class="nowrap">${fmtDate(u.createdAt)}</td>
      <td class="acts">${actions(u)}</td></tr>`).join('') || '<tr><td colspan="7" class="end-note">No users match.</td></tr>';
    el.querySelector('#count').textContent = `${list.length} user${list.length === 1 ? '' : 's'}`;
  }

  el.innerHTML = `
  <div class="user-toolbar">
    <input type="search" id="uq" placeholder="Search name, username or email" value="${esc(f.q)}" aria-label="Search users">
    <select id="ur" aria-label="Role"><option value="all">Role: All</option><option value="member">Members</option><option value="admin">Admins</option></select>
    <select id="us" aria-label="Status"><option value="all">Status: All</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="banned">Banned</option></select>
    <select id="ud" aria-label="Joined"><option value="all">Joined: Any time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>
    <span class="grow"></span><span class="muted" id="count"></span>
    <button type="button" class="btn-outline" data-export>Export</button>
    <button type="button" class="btn-solid" data-adduser>＋ Add User</button>
  </div>
  <section class="table-card flat"><div class="scroll-x"><table class="dtable users">
    <thead><tr><th>User</th><th>Role</th><th>Faculty · Batch</th><th>Status</th><th>Last active</th><th>Joined</th><th>Actions</th></tr></thead><tbody></tbody></table></div></section>`;
  el.querySelector('#ur').value = f.role; el.querySelector('#us').value = f.status; el.querySelector('#ud').value = f.date;
  paint();

  el.addEventListener('input', e => { if (e.target.id === 'uq') { f.q = e.target.value; paint(); } });
  el.addEventListener('change', e => { const m = { ur: 'role', us: 'status', ud: 'date' }[e.target.id]; if (m) { f[m] = e.target.value; paint(); } });

  el.addEventListener('click', async e => {
    if (e.target.closest('[data-export]')) {
      const list = filtered();
      downloadFile('scriptorium-users.csv', toCSV('Scriptorium users', [{ heading: `${list.length} users`, columns: ['Name', 'Username', 'Email', 'Role', 'Faculty', 'Batch', 'Status', 'Last active', 'Joined'],
        rows: list.map(u => [u.fullName || '', u.username, u.email, u.role, u.faculty || '', u.batch || '', effectiveStatus(u), u.lastActiveAt ? timeAgo(u.lastActiveAt) : 'never', fmtDate(u.createdAt)]) }]));
      return;
    }
    if (e.target.closest('[data-adduser]')) return addUserModal(ctx);
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const id = btn.dataset.id, u = allUsers().find(x => x.id === id), name = esc(u.fullName || u.username);
    try {
      switch (btn.dataset.act) {
        case 'suspend': return suspendModal(u, ctx);
        case 'ban': if (await confirmModal({ title: 'Ban user?', message: `<b>${name}</b> will be signed out and unable to log in until unbanned.`, confirmLabel: 'Ban', danger: true })) { await banUser(id); toast('User banned'); ctx.refresh(); } break;
        case 'restore': await restoreUser(id); toast('Account restored'); ctx.refresh(); break;
        case 'promote': if (await confirmModal({ title: 'Make admin?', message: `<b>${name}</b> will get full admin privileges: approve posts, manage users, categories and events.`, confirmLabel: 'Promote' })) { await setRole(id, 'admin'); toast('Promoted to admin'); ctx.refresh(); } break;
        case 'demote': if (await confirmModal({ title: 'Remove admin rights?', message: `<b>${name}</b> will become a regular member.`, confirmLabel: 'Remove admin', danger: true })) { await setRole(id, 'member'); toast('Admin rights removed'); ctx.refresh(); } break;
      }
    } catch (x) { toast(x.message, 'error'); }
  });
}

function suspendModal(u, ctx) {
  const m = openModal(`<form id="susForm"><h1>Suspend</h1>
    <p class="reg-for"><b>${esc(u.fullName || u.username)}</b><br><small>They can log in again automatically when the suspension ends.</small></p>
    <label>Duration<select name="days"><option value="1">1 day</option><option value="3">3 days</option><option value="7" selected>7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label>
    <button type="submit" class="auth-submit danger">Suspend user</button></form>`);
  m.querySelector('#susForm').addEventListener('submit', async e => {
    e.preventDefault();
    try { await suspendUser(u.id, +e.target.days.value); closeModal(); toast('User suspended'); ctx.refresh(); }
    catch (x) { toast(x.message, 'error'); }
  });
}

function addUserModal(ctx) {
  const m = openModal(`<form id="addForm" novalidate><h1>Add user</h1>
    <div class="row"><label>Full Name<input type="text" name="fullName" placeholder="Alex Perera" required></label><label>Username<input type="text" name="username" placeholder="alex_art" required></label></div>
    <label>Email<input type="email" name="email" placeholder="name@example.com" required></label>
    <div class="row"><label>Faculty<select name="faculty" required>${optionsHTML('Select faculty', FACULTIES)}</select></label><label>Batch<select name="batch" required>${optionsHTML('Select batch', BATCHES)}</select></label></div>
    <div class="row"><label>Password<input type="password" name="password" placeholder="Minimum 6 characters" required></label>
      <label>Role<select name="role"><option value="member">Member</option><option value="admin">Admin</option></select></label></div>
    <p class="form-error" role="alert"></p><button type="submit" class="auth-submit">Create user</button></form>`);
  m.querySelector('#addForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try { await adminCreateUser(Object.fromEntries(new FormData(e.target))); closeModal(); toast('User created'); ctx.refresh(); }
    catch (x) { e.target.querySelector('.form-error').textContent = x.message; btn.disabled = false; }
  });
}
