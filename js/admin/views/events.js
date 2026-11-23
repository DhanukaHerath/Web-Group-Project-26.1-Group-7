/* admin events – create / edit / delete events, exhibitions & notices; see registrants; generate reports. */
import { allEvents, createEvent, updateEvent, deleteEvent, registrationsFor, getEvent } from '../../core/events.js';
import { openModal, closeModal, confirmModal } from '../../components/modal.js';
import { openEventReport } from '../reports.js';
import { toast, esc, fmtDate, timeAgo } from '../../core/dom.js';

const KINDS = ['Event', 'Exhibition', 'Notice'];
const toLocalInput = ts => { if (!ts) return ''; const d = new Date(ts - new Date(ts).getTimezoneOffset() * 6e4); return d.toISOString().slice(0, 16); };
const fromLocalInput = v => (v ? new Date(v).getTime() : null);

export function render(container, ctx) {
    const el = document.createElement('div'); container.replaceChildren(el);
    const q = ctx.query.toLowerCase();
    const list = allEvents().filter(e => !q || `${e.title} ${e.kind} ${e.venue}`.toLowerCase().includes(q));

    el.innerHTML = `<div class="page-actions"><button type="button" class="btn-solid" data-new>＋ New event / exhibition</button></div>
    ${list.length ? `<div class="notices">${list.map(e => {
        const n = registrationsFor(e.id).length, past = e.date < Date.now(); return `
      <article class="notice ${e.kind.toLowerCase()}${past ? ' past' : ''}">
        <div class="notice-date"><b>${new Date(e.date).getDate()}</b><span>${new Date(e.date).toLocaleDateString(undefined, { month: 'short' })}</span></div>
        <div class="notice-body"><span class="badge">${esc(e.kind)}</span>${past ? ' <span class="muted">· past</span>' : ''}
          <h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>
          <small>📍 ${esc(e.venue)} · ${esc(fmtDate(e.date))}${e.registerBy ? ` · Register by ${esc(fmtDate(e.registerBy))}` : ''}</small></div>
        <div class="notice-action col">
          ${e.kind === 'Notice' ? '' : `<button type="button" class="btn-outline" data-regs="${esc(e.id)}">Registrations (${n})</button>`}
          <button type="button" class="mini" data-edit="${esc(e.id)}">Edit</button>
          <button type="button" class="mini danger" data-del="${esc(e.id)}">Delete</button>
        </div></article>`;
    }).join('')}</div>` : '<div class="empty-box">No events yet.</div>'}`;

    el.addEventListener('click', async e => {
        const t = id => e.target.closest(id);
        if (t('[data-new]')) return eventForm(null, ctx);
        if (t('[data-edit]')) return eventForm(getEvent(t('[data-edit]').dataset.edit), ctx);
        if (t('[data-regs]')) return registrants(getEvent(t('[data-regs]').dataset.regs));
        const d = t('[data-del]');
        if (d) {
            const ev = getEvent(d.dataset.del), n = registrationsFor(ev.id).length;
            if (await confirmModal({ title: 'Delete this?', message: `<b>${esc(ev.title)}</b>${n ? ` and its ${n} registration${n === 1 ? '' : 's'}` : ''} will be removed permanently.`, confirmLabel: 'Delete', danger: true })) { deleteEvent(ev.id); toast('Deleted'); ctx.refresh(); }
        }
    });
}

function registrants(ev) {
    const regs = registrationsFor(ev.id);
    const m = openModal(`<h1>Registrations</h1>
    <p class="reg-for"><span class="badge">${esc(ev.kind)}</span> ${esc(ev.title)}<br><small>${regs.length} registered · ${esc(fmtDate(ev.date))} · ${esc(ev.venue)}</small></p>
    ${regs.length ? `<div class="scroll-x"><table class="rtable"><thead><tr><th>Name</th><th>Email</th><th>Faculty</th><th>Batch</th><th>Registered</th></tr></thead><tbody>
      ${regs.map(r => `<tr><td>${esc(r.fullName)}</td><td>${esc(r.email)}</td><td>${esc(r.faculty)}</td><td>${esc(r.batch)}</td><td>${timeAgo(r.createdAt)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nobody has registered yet.</p>'}
    <div class="confirm-actions"><button type="button" class="auth-submit" data-report>Generate report</button></div>`, { wide: true });
    m.querySelector('[data-report]').addEventListener('click', () => openEventReport(ev));
}

function eventForm(ev, ctx) {
    const m = openModal(`<form id="evForm" novalidate><h1>${ev ? 'Edit' : 'New'} event</h1>
    <div class="row"><label>Type<select name="kind">${KINDS.map(k => `<option${ev?.kind === k ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
      <label>Date &amp; time<input type="datetime-local" name="date" value="${toLocalInput(ev?.date)}" required></label></div>
    <label>Title<input type="text" name="title" maxlength="80" value="${esc(ev?.title || '')}" placeholder="e.g. Annual Art Exhibition" required></label>
    <label>Venue<input type="text" name="venue" maxlength="80" value="${esc(ev?.venue || '')}" placeholder="Where is it?" required></label>
    <label>Description<textarea name="description" rows="3" maxlength="400" placeholder="What should members know?">${esc(ev?.description || '')}</textarea></label>
    <label data-reg>Registration closes <small>(optional)</small><input type="datetime-local" name="registerBy" value="${toLocalInput(ev?.registerBy)}"></label>
    <p class="form-error" role="alert"></p><button type="submit" class="auth-submit">${ev ? 'Save changes' : 'Publish'}</button></form>`);
    const form = m.querySelector('#evForm');
    const sync = () => { form.querySelector('[data-reg]').hidden = form.kind.value === 'Notice'; };
    form.kind.addEventListener('change', sync); sync();
    form.addEventListener('submit', e => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(form));
        const data = { kind: d.kind, title: d.title, venue: d.venue, description: d.description, date: fromLocalInput(d.date), registerBy: fromLocalInput(d.registerBy) };
        try { ev ? updateEvent(ev.id, data) : createEvent(data); closeModal(); toast(ev ? 'Saved' : 'Published'); ctx.refresh(); }
        catch (x) { form.querySelector('.form-error').textContent = x.message; }
    });
}
