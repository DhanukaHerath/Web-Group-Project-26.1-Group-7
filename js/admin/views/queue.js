/* approval queue – review posts (pending / approved / disapproved). */
import { allPosts, authorOf, displayName, reviewPost, getPost, categoryOf, isTextCategory } from '../../core/posts.js';
import { openPostDetail } from '../../components/post-card.js';
import { openModal, closeModal } from '../../components/modal.js';
import { avatarHTML } from '../../humation/avatar-view.js';
import { toast, esc, fmtDate } from '../../core/dom.js';

const ICON_OK = '<svg viewBox="0 0 24 24"><path d="m4 12.500 5 5L20 6.500" fill="none" stroke="#17b34a" stroke-width="2.500" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_NO = '<svg viewBox="0 0 24 24"><path d="m5 5 14 14M19 5 5 19" fill="none" stroke="#e11d2e" stroke-width="2.500" stroke-linecap="round"/></svg>';
let month = 'all';

export function render(container, ctx, status) {
  const el = document.createElement('div'); container.replaceChildren(el);
  const q = ctx.query.toLowerCase();
  const inStatus = allPosts().filter(p => p.status === status);
  const months = [...new Set(inStatus.map(p => monthKey(p.createdAt)))].sort().reverse();
  if (month !== 'all' && !months.includes(month)) month = 'all';
  const rows = inStatus.filter(p => (month === 'all' || monthKey(p.createdAt) === month) &&
    (!q || `${p.title} ${displayName(authorOf(p))} ${p.authorName} ${categoryOf(p.category)?.label || ''}`.toLowerCase().includes(q)))
    .sort((a, b) => (status === 'pending' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt)); // oldest first in the queue

  const statusCell = p => p.status === 'pending'
    ? `<button type="button" class="icon-act ok" data-approve="${esc(p.id)}" title="Approve" aria-label="Approve">${ICON_OK}</button>
       <button type="button" class="icon-act no" data-reject="${esc(p.id)}" title="Disapprove" aria-label="Disapprove">${ICON_NO}</button>`
    : `<span class="status-pill ${p.status}">${p.status === 'approved' ? 'Approved' : 'Disapproved'}</span>${p.reviewNote ? `<small class="note-line" title="${esc(p.reviewNote)}">“${esc(p.reviewNote)}”</small>` : ''}`;

  el.innerHTML = `
  <section class="table-card">
    <div class="tc-head"><h2>${{ pending: 'Approval Queue', approved: 'Approved', disapproved: 'Disapproved' }[status]}</h2>
      <select id="monthSel" aria-label="Filter by month"><option value="all">All time</option>${months.map(m => `<option value="${m}"${m === month ? ' selected' : ''}>${monthLabel(m)}</option>`).join('')}</select></div>
    <table class="dtable">
      <thead><tr><th>Creator</th><th>Content Type</th><th>Title</th><th class="c">${status === 'pending' ? 'Status' : 'Decision'}</th></tr></thead>
      <tbody>${rows.map(p => { const a = authorOf(p); return `
        <tr data-view="${esc(p.id)}" tabindex="0">
          <td><div class="creator">${avatarHTML(a, { size: 34 })}<div><b>${esc(displayName(a))}</b><small>${isTextCategory(p.category) ? 'Writer' : 'Artist'} · ${fmtDate(p.createdAt)}</small></div></div></td>
          <td>${esc(categoryOf(p.category)?.label || p.category)}</td>
          <td>${esc(p.title)}</td>
          <td class="c status-cell">${statusCell(p)}</td>
        </tr>`; }).join('')}</tbody>
    </table>
    <p class="end-note">${rows.length ? 'End of the Queue' : (status === 'pending' ? 'Nothing is waiting for review. 🎉' : 'Nothing here yet.')}</p>
  </section>`;

  el.querySelector('#monthSel').addEventListener('change', e => { month = e.target.value; render(container, ctx, status); });

  let busy = false;
  const approve = async id => {
    if (busy) return;
    busy = true;
    try {
      await reviewPost(id, ctx.user, { decision: 'approved' });
      toast('Approved – it is now in the gallery');
      ctx.refresh();
    } catch (x) { toast(x.message, 'error'); }
    finally { busy = false; }
  };
  const reject = id => {
    const post = getPost(id);
    const m = openModal(`<form id="rejForm" novalidate><h1>Disapprove</h1>
      <p class="reg-for"><b>${esc(post.title)}</b><br><small>The note below is sent to the creator as a notification.</small></p>
      <label>Reason for disapproval<textarea name="note" rows="4" maxlength="300" placeholder="e.g. The image is too low-resolution – please upload a clearer version."></textarea></label>
      <p class="form-error" role="alert"></p>
      <button type="submit" class="auth-submit danger">Disapprove &amp; notify</button></form>`);
    m.querySelector('textarea').focus();
    m.querySelector('#rejForm').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      try { await reviewPost(id, ctx.user, { decision: 'disapproved', note: e.target.note.value }); closeModal(); toast('Disapproved – the creator was notified'); ctx.refresh(); }
      catch (x) { e.target.querySelector('.form-error').textContent = x.message; btn.disabled = false; }
    });
  };

  el.addEventListener('click', e => {
    const ok = e.target.closest('[data-approve]'), no = e.target.closest('[data-reject]'), row = e.target.closest('[data-view]');
    if (ok) return approve(ok.dataset.approve);
    if (no) return reject(no.dataset.reject);
    if (row) viewContent(getPost(row.dataset.view), approve, reject);
  });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-view]')) viewContent(getPost(e.target.dataset.view), approve, reject); });
}

/* full content view with decision buttons for pending posts */
function viewContent(post, approve, reject) {
  openPostDetail(post);
  if (post.status !== 'pending') return;
  const card = document.querySelector('.modal-backdrop .detail');
  card.insertAdjacentHTML('beforeend', `<div class="decide"><button type="button" class="btn-outline reject-btn" data-d="no">✕ Disapprove</button><button type="button" class="btn-solid" data-d="ok">✓ Approve</button></div>`);
  card.addEventListener('click', e => {
    const d = e.target.closest('[data-d]')?.dataset.d; if (!d) return;
    closeModal(); d === 'ok' ? approve(post.id) : reject(post.id);
  });
}
const monthKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const monthLabel = k => new Date(k + '-01T12:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
