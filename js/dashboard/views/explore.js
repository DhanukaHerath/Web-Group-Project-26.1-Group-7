/* explore view – the main gallery, browsable by category or by artist. */
import { getCategories, publicPosts, authorOf, displayName } from '../../core/posts.js';
import { postCard, openPostDetail } from '../../components/post-card.js';
import { avatarHTML } from '../../humation/avatar-view.js';
import { esc } from '../../core/dom.js';

export function render(container, ctx) {
  const el = document.createElement('div'); container.replaceChildren(el);
  const st = ctx.explore;                       // { mode: 'category'|'artists', cat: 'all'|id, artist: id|null }
  const q = ctx.query.toLowerCase();
  const posts = publicPosts();

  function artistsView() {
    const map = new Map();
    posts.forEach(p => { const a = authorOf(p); (map.get(a.id) || map.set(a.id, { a, n: 0 }).get(a.id)).n++; });
    const list = [...map.values()].filter(({ a }) => !q || `${displayName(a)} ${a.username}`.toLowerCase().includes(q))
      .sort((x, y) => y.n - x.n);
    return list.length ? `<div class="artists">${list.map(({ a, n }) => `
      <button type="button" class="artist" data-artist="${esc(a.id)}">${avatarHTML(a, { size: 84 })}
        <strong>${esc(displayName(a))}</strong><small>${n} work${n === 1 ? '' : 's'}</small></button>`).join('')}</div>`
      : '<div class="empty-box">No artists match your search.</div>';
  }

  function galleryView() {
    const list = posts.filter(p => (st.cat === 'all' || p.category === st.cat) && (!st.artist || p.authorId === st.artist) &&
      (!q || `${p.title} ${p.authorName} ${p.text || ''}`.toLowerCase().includes(q)));
    const who = st.artist && authorOf(posts.find(p => p.authorId === st.artist) || { authorId: st.artist });
    return `<div class="chips">
        ${[{ id: 'all', label: 'All' }, ...getCategories().map(c => ({ id: c.id, label: c.plural }))]
          .map(c => `<button type="button" class="chip${st.cat === c.id ? ' on' : ''}" data-cat="${c.id}">${c.label}</button>`).join('')}
        ${who ? `<button type="button" class="chip on artist-chip" data-clear-artist>Works by ${esc(displayName(who))} ✕</button>` : ''}
      </div>
      ${list.length ? `<div class="grid">${list.map(postCard).join('')}</div>` : '<div class="empty-box">No posts match.</div>'}`;
  }

  el.innerHTML = `
    <div class="segmented" role="tablist">
      <button type="button" data-mode="category" class="${st.mode === 'category' ? 'on' : ''}">Browse by Category</button>
      <button type="button" data-mode="artists" class="${st.mode === 'artists' ? 'on' : ''}">Browse by Artist</button>
    </div>
    ${st.mode === 'artists' ? artistsView() : galleryView()}`;

  const rerender = () => render(container, ctx);
  el.addEventListener('click', e => {
    const t = e.target;
    const mode = t.closest('[data-mode]'), cat = t.closest('[data-cat]'), artist = t.closest('[data-artist]'), card = t.closest('[data-post]');
    if (mode) { st.mode = mode.dataset.mode; if (st.mode === 'artists') st.artist = null; rerender(); }
    else if (cat) { st.cat = cat.dataset.cat; rerender(); }
    else if (t.closest('[data-clear-artist]')) { st.artist = null; rerender(); }
    else if (artist) { st.mode = 'category'; st.cat = 'all'; st.artist = artist.dataset.artist; rerender(); }
    else if (card) openPostDetail(posts.find(p => p.id === card.dataset.post));
  });
  el.addEventListener('keydown', e => { const c = e.key === 'Enter' && e.target.closest('[data-post]'); if (c) openPostDetail(posts.find(p => p.id === c.dataset.post)); });
}
