import { requireLogin } from '../core/auth.js';
import { logActivity } from '../core/activity.js';
import { closeModal } from '../components/modal.js';
import { renderShell } from '../dashboard/shell.js';
import { render as home } from '../dashboard/views/home.js';
import { render as explore } from '../dashboard/views/explore.js';
import { render as events } from '../dashboard/views/events.js';
import { render as create } from '../dashboard/views/create.js';

const user = requireLogin();          
if (user) {
  const ctx = { user, query: '', explore: { mode: 'category', cat: 'all', artist: null } };
  const views = { home, explore, events, create };
  const shell = renderShell(document.getElementById('app'), ctx, {
    onSearch(q) {
      ctx.query = q;
      
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
