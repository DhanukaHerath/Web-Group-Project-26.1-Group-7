/* dashboard.js – entry point: session guard, hash router, search. */
import { requireLogin, syncAuth } from '../core/auth.js';
import { syncPosts } from '../core/posts.js';
import { syncSocial } from '../core/social.js';
import { logActivity } from '../core/activity.js';
import { closeModal } from '../components/modal.js';
import { renderShell } from '../dashboard/shell.js';
import { render as home } from '../dashboard/views/home.js';
import { render as explore } from '../dashboard/views/explore.js';
import { render as events } from '../dashboard/views/events.js';
import { render as create } from '../dashboard/views/create.js';

await syncAuth();
await Promise.all([syncPosts(), syncSocial()]);
const user = requireLogin();           // guests are sent to login.html
if (user) {
  const ctx = { user, query: '', explore: { mode: 'category', cat: 'all', artist: null } };
  const views = { home, explore, events, create };
  const shell = renderShell(document.getElementById('app'), ctx, {
    onSearch(q) {
      ctx.query = q;
      // searching from Events/Create keeps you on Events; otherwise jump to the gallery
      if (q && !['home', 'explore', 'events'].includes(currentId())) location.hash = '#explore';
      else route();
    },
  });

  const currentId = () => (location.hash.slice(1) in views ? location.hash.slice(1) : 'home');
  function route() {
    const id = currentId();
    shell.setActive(id);
    views[id](shell.view, ctx);
    logActivity('view');
    shell.refreshBell();
    document.title = `${id[0].toUpperCase() + id.slice(1)} – Scriptorium`;
  }
  window.addEventListener('hashchange', () => { closeModal(); window.scrollTo(0, 0); route(); });
  route();
}
