/* featured – choose which approved artworks appear in the landing-page gallery carousel. */
import { publicPosts, setFeatured, authorOf, displayName } from '../../core/posts.js';
import { toast, esc } from '../../core/dom.js';

const MAX = 12; // the landing page shows up to 12

export function render(container, ctx) {
    const el = document.createElement('div'); container.replaceChildren(el);
    const q = ctx.query.toLowerCase();
    const all = publicPosts().filter(p => p.image);
    const count = all.filter(p => p.featured).length;
    const list = all.filter(p => !q || `${p.title} ${p.authorName}`.toLowerCase().includes(q));

    el.innerHTML = `<p class="feat-info"><b>${count}</b> of ${MAX} featured · these appear in the <a href="index.html#gallery" target="_blank" rel="noopener">landing-page gallery</a>. Only approved images can be featured.</p>
    ${list.length ? `<div class="grid">${list.map(p => `
      <article class="p-card feat${p.featured ? ' on' : ''}">
        <img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">
        <div class="p-cap"><strong>${esc(p.title)}</strong><span class="p-by"><span>${esc(displayName(authorOf(p)))}</span></span></div>
        <button type="button" class="star-btn" data-feature="${esc(p.id)}" aria-pressed="${p.featured}">${p.featured ? '★ Featured' : '☆ Feature'}</button>
      </article>`).join('')}</div>` : '<div class="empty-box">No approved images yet.</div>'}`;

    el.addEventListener('click', async e => {
        const b = e.target.closest('[data-feature]'); if (!b) return;
        const post = all.find(p => p.id === b.dataset.feature), on = !post.featured;
        if (on && count >= MAX) return toast(`You can feature up to ${MAX} artworks. Un-feature one first.`, 'error');
        try { await setFeatured(post.id, on); toast(on ? 'Featured on the homepage' : 'Removed from the homepage'); render(container, ctx); }
        catch (x) { toast(x.message, 'error'); }
    });
}
