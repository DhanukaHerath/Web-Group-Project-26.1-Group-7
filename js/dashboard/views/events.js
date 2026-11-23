/* events view – notices, events & exhibitions with registration. */
import { allEvents, getEvent, canRegister, isRegistered, registerForEvent } from '../../core/events.js';
import { FACULTIES, BATCHES, optionsHTML } from '../../core/options.js';
import { openModal, closeModal } from '../../components/modal.js';
import { toast, esc } from '../../core/dom.js';

const fmt = ts => new Date(ts).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export function render(container, ctx) {
  const el = document.createElement('div'); container.replaceChildren(el);
  const q = ctx.query.toLowerCase();
  const list = allEvents().filter(e => !q || `${e.title} ${e.kind} ${e.venue}`.toLowerCase().includes(q));

  const action = e => {
    if (e.kind === 'Notice') return '';
    if (isRegistered(e.id, ctx.user.id)) return '<span class="reg-done">✓ You are registered</span>';
    return canRegister(e) ? `<button type="button" class="btn-solid" data-register="${esc(e.id)}">Register</button>` : '<span class="muted">Registration closed</span>';
  };
  el.innerHTML = list.length ? `<div class="notices">${list.map(e => `
    <article class="notice ${e.kind.toLowerCase()}">
      <div class="notice-date"><b>${new Date(e.date).getDate()}</b><span>${new Date(e.date).toLocaleDateString(undefined, { month: 'short' })}</span></div>
      <div class="notice-body">
        <span class="badge">${esc(e.kind)}</span>
        <h3>${esc(e.title)}</h3>
        <p>${esc(e.description)}</p>
        <small>📍 ${esc(e.venue)} · ${esc(fmt(e.date))}${e.registerBy ? ` · Register by ${esc(fmt(e.registerBy))}` : ''}</small>
      </div>
      <div class="notice-action">${action(e)}</div>
    </article>`).join('')}</div>` : '<div class="empty-box">No notices match your search.</div>';

  el.addEventListener('click', e => {
    const b = e.target.closest('[data-register]'); if (b) openRegistration(getEvent(b.dataset.register), ctx, () => render(container, ctx));
  });
}

/* Registration form – same glass design as Login / Register. */
function openRegistration(ev, ctx, done) {
  const u = ctx.user;
  const m = openModal(`
    <form id="regForm" novalidate>
      <h1>Register</h1>
      <p class="reg-for"><span class="badge">${esc(ev.kind)}</span> ${esc(ev.title)}<br><small>${esc(fmt(ev.date))} · ${esc(ev.venue)}</small></p>
      <div class="row">
        <label>Full Name<input type="text" name="fullName" value="${esc(u.fullName || '')}" placeholder="Alex Perera" required></label>
        <label>Username<input type="text" name="username" value="${esc(u.username)}" readonly></label>
      </div>
      <label>Email<input type="email" name="email" value="${esc(u.email)}" placeholder="name@example.com" required></label>
      <div class="row">
        <label>Faculty<select name="faculty" required>${optionsHTML('Select faculty', FACULTIES, u.faculty)}</select></label>
        <label>Batch<select name="batch" required>${optionsHTML('Select batch', BATCHES, u.batch)}</select></label>
      </div>
      <label>Phone <small>(optional)</small><input type="tel" name="phone" placeholder="07X XXX XXXX"></label>
      <label>Note to organisers <small>(optional)</small><input type="text" name="note" maxlength="160" placeholder="Anything we should know?"></label>
      <p class="form-error" role="alert"></p>
      <button type="submit" class="auth-submit">Confirm Registration</button>
    </form>`);
  m.querySelector('#regForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, d = Object.fromEntries(new FormData(f)), err = f.querySelector('.form-error');
    if ((d.fullName || '').trim().length < 2) return void (err.textContent = 'Please enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) return void (err.textContent = 'Please enter a valid email address.');
    if (!d.faculty || !d.batch) return void (err.textContent = 'Please select your faculty and batch.');
    try { registerForEvent(ev.id, u.id, d); closeModal(); toast(`Registered for ${ev.title}`); done(); }
    catch (x) { err.textContent = x.message; }
  });
}
