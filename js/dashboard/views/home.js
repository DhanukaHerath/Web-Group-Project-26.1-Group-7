/* home view – latest posts per category. */
import { getCategories, publicPosts } from '../../core/posts.js';
import { postCard, openPostDetail } from '../../components/post-card.js';

export function render(container, ctx) {
  const el = document.createElement('div'); container.replaceChildren(el);
  const q = ctx.query.toLowerCase();
  const posts = publicPosts().filter(p => !q || `${p.title} ${p.authorName}`.toLowerCase().includes(q));

  el.innerHTML = getCategories().map(cat => {
    const latest = posts.filter(p => p.category === cat.id).slice(0, 4);
    return `<section class="block">
      <div class="block-head"><h2>Latest ${cat.plural}</h2><a href="#explore" data-cat="${cat.id}" class="see-all">See all</a></div>
      ${latest.length ? `<div class="grid">${latest.map(postCard).join('')}</div>`
        : `<div class="empty-box">Nothing here yet. <a href="#create">Be the first to post ${/^[aeiou]/i.test(cat.label) ? 'an' : 'a'} ${cat.label.toLowerCase()}</a>.</div>`}
    </section>`;
  }).join('');

  const byId = id => publicPosts().find(p => p.id === id);
  const open = t => { const c = t.closest('[data-post]'); if (c) openPostDetail(byId(c.dataset.post)); };
  el.addEventListener('click', e => {
    const see = e.target.closest('.see-all');
    if (see) { ctx.explore = { mode: 'category', cat: see.dataset.cat, artist: null }; return; } // router follows the link
    open(e.target);
  });
  el.addEventListener('keydown', e => { if (e.key === 'Enter') open(e.target); });
}
