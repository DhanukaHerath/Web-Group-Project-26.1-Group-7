/* gallery.js – public gallery page: Gallery (images), Poems (text) and Explore (by category / artist).
   Guests can browse; liking, commenting and following need a login (handled in the post detail). */
import { initNav } from '../components/nav.js';
import { currentUser } from '../core/auth.js';
import { publicPosts, getCategories, authorOf, displayName, isRealMember } from '../core/posts.js';
import { likeCount, commentCount, isFollowing, followerCount, toggleFollow } from '../core/social.js';
import { openPostDetail } from '../components/post-card.js';
import { avatarHTML } from '../humation/avatar-view.js';
import { logActivity } from '../core/activity.js';
import { closeModal } from '../components/modal.js';
import { esc, toast } from '../core/dom.js';

initNav(); logActivity('view');
const view = document.getElementById('galView');
const st = { cat: 'all', artist: null, sort: 'new', q: '', mode: 'category' };   // shared filter state
const TABS = ['gallery', 'poems', 'explore'];
const startCat = new URLSearchParams(location.search).get('cat');   // e.g. gallery.html?cat=photography
if (startCat) st.cat = startCat;
const tab = () => (TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'gallery');

const isText = p => getCategories().find(c => c.id === p.category)?.type === 'text';
const matches = p => !st.q || `${p.title} ${p.authorName} ${displayName(authorOf(p))}`.toLowerCase().includes(st.q.toLowerCase());
const sorted = list => (st.sort === 'liked' ? [...list].sort((a, b) => likeCount(b.id) - likeCount(a.id) || b.createdAt - a.createdAt) : list);

/* ---------- artist header (shown when browsing one artist's work) ---------- */
function artistHeader() {
  if (!st.artist) return '';
  const a = authorOf({ authorId: st.artist, authorName: '' }), me = currentUser();
  const n = publicPosts().filter(p => p.authorId === st.artist).length, f = followerCount(st.artist);
  return `<div class="artist-head">${avatarHTML(a, { size: 72 })}
    <div><h2>${esc(displayName(a))}</h2><p>${n} work${n === 1 ? '' : 's'} · ${f} follower${f === 1 ? '' : 's'}</p></div>
    ${isRealMember(a) ? `<a class="btn-outline" href="profile.html?u=${encodeURIComponent(a.id)}">Profile</a>` : ''}
    ${me && me.id !== a.id && !a.id.startsWith('x') ? followBtn(a.id) : ''}
    <button type="button" class="chip on" data-clear-artist>✕ Show everyone</button></div>`;
}
const followBtn = id => { const me = currentUser(); return me && me.id !== id ? `<button type="button" class="follow-btn${isFollowing(me.id, id) ? ' on' : ''}" data-follow="${esc(id)}">${isFollowing(me.id, id) ? '✓ Following' : '+ Follow'}</button>` : ''; };

/* ---------- Pinterest-style masonry ---------- */
function masonryCard(p) {
  const a = authorOf(p), likes = likeCount(p.id), cc = commentCount(p.id);
  const meta = `<span class="m-stats">♥ ${likes} · 💬 ${cc}</span>`;
  return isText(p)
    ? `<article class="m-card poem" data-post="${esc(p.id)}" tabindex="0" role="button"><h4>${esc(p.title)}</h4><p>${esc(p.text)}</p>
        <div class="m-foot"><span class="p-by">${avatarHTML(a, { size: 24 })}<span>${esc(displayName(a))}</span></span>${meta}</div></article>`
    : `<article class="m-card" data-post="${esc(p.id)}" tabindex="0" role="button"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" draggable="false">
        <div class="m-over"><strong>${esc(p.title)}</strong><div class="m-foot"><span class="p-by">${avatarHTML(a, { size: 24 })}<span>${esc(displayName(a))}</span></span>${meta}</div></div></article>`;
}

function feed(kind) {          // kind: 'image' | 'text'
  const cats = getCategories().filter(c => c.type === kind);
  if (st.cat !== 'all' && !cats.some(c => c.id === st.cat)) st.cat = 'all';
  const list = sorted(publicPosts().filter(p => cats.some(c => c.id === p.category) && (st.cat === 'all' || p.category === st.cat) &&
    (!st.artist || p.authorId === st.artist) && matches(p)));
  view.innerHTML = `${artistHeader()}
    <div class="gal-bar">
      <div class="chips">${[{ id: 'all', label: 'All' }, ...cats.map(c => ({ id: c.id, label: c.plural }))]
        .map(c => `<button type="button" class="chip${st.cat === c.id ? ' on' : ''}" data-cat="${esc(c.id)}">${esc(c.label)}</button>`).join('')}</div>
      <select id="sortSel" aria-label="Sort"><option value="new"${st.sort === 'new' ? ' selected' : ''}>Newest</option><option value="liked"${st.sort === 'liked' ? ' selected' : ''}>Most liked</option></select>
    </div>
    ${list.length ? `<div class="masonry">${list.map(masonryCard).join('')}</div>` : '<div class="empty-box">Nothing here yet.</div>'}`;
}

/* ---------- Explore: browse by category or by artist ---------- */
function explore() {
  const posts = publicPosts();
  const catCards = getCategories().map(c => {
    const mine = posts.filter(p => p.category === c.id);
    const imgs = mine.filter(p => p.image).slice(0, 4);
    return `<button type="button" class="ex-cat" data-explore-cat="${esc(c.id)}">
      <div class="ex-collage ${c.type === 'text' ? 'text' : ''}">${c.type === 'text'
        ? (mine.slice(0, 3).map(p => `<span>${esc((p.text || '').slice(0, 70))}</span>`).join('') || '<em>No posts yet</em>')
        : (imgs.length ? imgs.map(p => `<img src="${esc(p.image)}" alt="" loading="lazy">`).join('') : '<em>No posts yet</em>')}</div>
      <strong>${esc(c.plural)}</strong><small>${mine.length} post${mine.length === 1 ? '' : 's'}</small></button>`;
  }).join('');

  const map = new Map();
  posts.forEach(p => { const a = authorOf(p); (map.get(a.id) || map.set(a.id, { a, n: 0 }).get(a.id)).n++; });
  const artists = [...map.values()].filter(({ a }) => matches({ title: '', authorName: a.username, ...{} }) || !st.q)
    .filter(({ a }) => !st.q || `${displayName(a)} ${a.username}`.toLowerCase().includes(st.q.toLowerCase()))
    .sort((x, y) => y.n - x.n);
  const artistCards = artists.map(({ a, n }) => `<div class="ex-artist" data-explore-artist="${esc(a.id)}" tabindex="0" role="button">
      ${avatarHTML(a, { size: 84 })}<strong>${esc(displayName(a))}</strong><small>${n} work${n === 1 ? '' : 's'} · ${followerCount(a.id)} follower${followerCount(a.id) === 1 ? '' : 's'}</small>
      ${followBtn(a.id)}</div>`).join('');

  view.innerHTML = `<div class="segmented"><button type="button" data-mode="category" class="${st.mode === 'category' ? 'on' : ''}">Browse by Category</button>
      <button type="button" data-mode="artists" class="${st.mode === 'artists' ? 'on' : ''}">Browse by Artist</button></div>
    ${st.mode === 'artists' ? (artists.length ? `<div class="ex-artists">${artistCards}</div>` : '<div class="empty-box">No artists match.</div>') : `<div class="ex-cats">${catCards}</div>`}`;
}

/* ---------- render + events ---------- */
function render() {
  const t = tab();
  document.querySelectorAll('#galTabs a').forEach(a => a.classList.toggle('active', a.dataset.tab === t));
  if (t === 'explore') explore(); else feed(t === 'poems' ? 'text' : 'image');
}
render();
window.addEventListener('hashchange', () => { closeModal(); st.cat = 'all'; render(); });
window.addEventListener('social-change', () => { const y = scrollY; render(); scrollTo(0, y); });
document.getElementById('galSearch').addEventListener('input', e => { st.q = e.target.value.trim(); render(); });

const open = id => openPostDetail(publicPosts().find(p => p.id === id));
view.addEventListener('click', e => {
  const t = e.target, f = t.closest('[data-follow]');
  if (f) { e.stopPropagation(); try { toggleFollow(currentUser().id, f.dataset.follow); render(); } catch (x) { toast(x.message, 'error'); } return; }
  const cat = t.closest('[data-cat]'), mode = t.closest('[data-mode]'), exCat = t.closest('[data-explore-cat]'),
    exArtist = t.closest('[data-explore-artist]'), card = t.closest('[data-post]');
  if (cat) { st.cat = cat.dataset.cat; render(); }
  else if (t.closest('[data-clear-artist]')) { st.artist = null; render(); }
  else if (mode) { st.mode = mode.dataset.mode; render(); }
  else if (exCat) { const c = getCategories().find(x => x.id === exCat.dataset.exploreCat); st.cat = c.id; st.artist = null; location.hash = c.type === 'text' ? '#poems' : '#gallery'; /* hashchange resets cat */ setTimeout(() => { st.cat = c.id; render(); }, 0); }
  else if (exArtist) { st.artist = exArtist.dataset.exploreArtist; st.cat = 'all'; location.hash = '#gallery'; if (tab() === 'gallery') render(); }
  else if (card) open(card.dataset.post);
});
view.addEventListener('keydown', e => { if (e.key !== 'Enter') return; const c = e.target.closest('[data-post]'); if (c) open(c.dataset.post); });
view.addEventListener('change', e => { if (e.target.id === 'sortSel') { st.sort = e.target.value; render(); } });
