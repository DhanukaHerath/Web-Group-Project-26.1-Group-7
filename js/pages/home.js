/* home.js – landing page: gallery carousel, poem cards, subscribe form. */
import { initNav } from '../components/nav.js';
import { currentUser } from '../core/auth.js';
import { avatarHTML } from '../humation/avatar-view.js';
import { esc } from '../core/dom.js';
import { featuredPosts, publicPosts, isTextCategory, authorOf, displayName, syncPosts } from '../core/posts.js';
import { syncSocial } from '../core/social.js';
import { openPostDetail } from '../components/post-card.js';
import { logActivity } from '../core/activity.js';

logActivity('view');

initNav();
await Promise.all([syncPosts(), syncSocial()]);
const user = currentUser();

/* ---------- Gallery carousel: artworks the admin has featured ---------- */
const GALLERY = featuredPosts().slice(0, 12).map(p => ({ src: p.image, alt: p.title }));
const START = 0;

const track = document.getElementById('carTrack');
track.innerHTML = GALLERY.length
  ? GALLERY.map(g => `<div class="slide has-img"><img src="${esc(g.src)}" alt="${esc(g.alt)}" draggable="false" loading="lazy"></div>`).join('')
  : '<p class="empty-gallery">No featured artworks yet.</p>';

/* ---------- Poems: previews of approved poems by different members ---------- */
const poems = publicPosts().filter(p => isTextCategory(p.category)).slice(0, 8);
const cardsEl = document.getElementById('cards');
cardsEl.innerHTML = poems.length ? poems.map(p => { const a = authorOf(p); return `
  <article class="card" data-post="${esc(p.id)}">
    <div class="card-head">${avatarHTML(a, { size: 38 })}<span class="card-author">${esc(displayName(a))}</span></div>
    <h4>${esc(p.title)}</h4>
    <p>${esc(p.text)}</p>
    <button type="button">Read</button>
  </article>`; }).join('') : '<p class="card-empty">No poems yet.</p>';
cardsEl.addEventListener('click', e => {
  const c = e.target.closest('[data-post]'); if (!c) return;
  const post = poems.find(p => p.id === c.dataset.post); if (post) openPostDetail(post);
});

/* ---------- Gallery carousel ---------- */
const slides = [...track.querySelectorAll('.slide')];
const dotsEl = document.getElementById('dots');
let current = START;
let timer;

slides.forEach((_, i) => {
  const d = document.createElement('button');
  d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
  dotsEl.appendChild(d);
});

function render() {
  slides.forEach((s, i) => {
    let pos = i - current;
    if (pos > slides.length / 2) pos -= slides.length;   // wrap so it loops
    if (pos < -slides.length / 2) pos += slides.length;
    s.dataset.pos = Math.abs(pos) > 2 ? 'hidden' : pos;
  });
  [...dotsEl.children].forEach((d, i) => d.classList.toggle('active', i === current));
}
const go = i => { current = (i + slides.length) % slides.length; render(); restart(); };
function restart() { clearInterval(timer); timer = setInterval(() => { current = (current + 1) % slides.length; render(); }, 4000); }

// delegated clicks for buttons, dots and slides
document.getElementById('carousel').addEventListener('click', e => {
  if (e.target.closest('#nextBtn')) return go(current + 1);
  if (e.target.closest('#prevBtn')) return go(current - 1);
  const slide = e.target.closest('.slide'); if (slide) return go(slides.indexOf(slide));
});
dotsEl.addEventListener('click', e => { const i = [...dotsEl.children].indexOf(e.target.closest('button')); if (i >= 0) go(i); });

// swipe on touch screens
let startX = 0;
track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
track.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - startX;
  if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
});
render(); restart();

/* ---------- Subscribe form ---------- */
const form = document.getElementById('subscribeForm');
const msg = document.getElementById('subMsg');
form.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('subEmail').value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  msg.className = valid ? 'ok' : 'error';
  msg.textContent = valid ? 'Thank you for subscribing!' : 'Please enter a valid email address.';
  if (valid) form.reset();
});
