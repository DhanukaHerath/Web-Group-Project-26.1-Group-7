/* categories ("Storehouse") – add / remove categories. */
import { getCategories, addCategory, removeCategory } from '../../core/categories.js';
import { allPosts } from '../../core/posts.js';
import { openModal, closeModal, confirmModal } from '../../components/modal.js';
import { toast, esc } from '../../core/dom.js';

export function render(container, ctx) {
  const el = document.createElement('div'); container.replaceChildren(el);
  const q = ctx.query.toLowerCase(), posts = allPosts();
  const cats = getCategories().filter(c => !q || c.label.toLowerCase().includes(q));

  const cover = (c, items) => c.type === 'text'
    ? `<div class="collage text">${items.slice(0, 6).map(p => `<span>${esc((p.text || '').slice(0, 60))}</span>`).join('') || '<em>No posts yet</em>'}</div>`
    : `<div class="collage">${Array.from({ length: 6 }, (_, i) => items[i] ? `<img src="${esc(items[i].image)}" alt="" loading="lazy">` : '<i></i>').join('')}</div>`;

  el.innerHTML = `<div class="cat-grid">
    ${cats.map(c => { const mine = posts.filter(p => p.category === c.id), appr = mine.filter(p => p.status === 'approved');
      return `<article class="cat-card">
        <button type="button" class="cat-del" data-del="${esc(c.id)}" title="Remove category" aria-label="Remove ${esc(c.label)}">&#128465;</button>
        ${cover(c, appr)}
        <div class="cat-info"><h3>${esc(c.plural)}</h3><p>${esc(c.description || 'Gallery for the Creative minds')}</p>
          <small>${c.type === 'text' ? 'Text posts' : 'Image posts'} · ${appr.length} approved · ${mine.length - appr.length} other</small></div></article>`; }).join('')}
    <button type="button" class="cat-card add" data-add><span>＋</span>Add category</button>
  </div>`;

  el.addEventListener('click', async e => {
    if (e.target.closest('[data-add]')) {
      const m = openModal(`<form id="catForm" novalidate><h1>New category</h1>
        <label>Name<input type="text" name="label" maxlength="30" placeholder="e.g. Short Story" required></label>
        <label>Type<select name="type"><option value="image">Image post – upload + title + description</option><option value="text">Text post – title + written piece</option></select></label>
        <label>Description <small>(optional)</small><input type="text" name="description" maxlength="60" placeholder="Shown on the category card"></label>
        <p class="form-error" role="alert"></p><button type="submit" class="auth-submit">Add category</button></form>`);
      m.querySelector('input').focus();
      m.querySelector('#catForm').addEventListener('submit', async ev => {
        ev.preventDefault();
        const btn = ev.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        try { await addCategory(Object.fromEntries(new FormData(ev.target))); closeModal(); toast('Category added'); ctx.refresh(); }
        catch (x) { ev.target.querySelector('.form-error').textContent = x.message; btn.disabled = false; }
      });
    }
    const del = e.target.closest('[data-del]');
    if (del) {
      const c = getCategories().find(x => x.id === del.dataset.del), n = posts.filter(p => p.category === c.id).length;
      if (n) return toast(`${n} post${n === 1 ? '' : 's'} still use “${c.label}”, so it can't be removed.`, 'error');
      if (await confirmModal({ title: 'Remove category?', message: `“${esc(c.label)}” will no longer be available to members.`, confirmLabel: 'Remove', danger: true })) {
        try { await removeCategory(c.id, 0); toast('Category removed'); ctx.refresh(); } catch (x) { toast(x.message, 'error'); }
      }
    }
  });
}
