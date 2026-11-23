/* admin.js – entry point: admin-only guard + hash router. */
import { requireAdmin, syncAuth, syncUsers } from '../core/auth.js';
import { syncPosts } from '../core/posts.js';
import { syncSocial } from '../core/social.js';
import { logActivity } from '../core/activity.js';
import { closeModal } from '../components/modal.js';
import { renderShell, TITLES } from '../admin/shell.js';
import { render as home } from '../admin/views/home.js';
import { render as queue } from '../admin/views/queue.js';
import { render as categories } from '../admin/views/categories.js';
import { render as featured } from '../admin/views/featured.js';
import { render as users } from '../admin/views/users.js';
import { render as events } from '../admin/views/events.js';
import { render as reports } from '../admin/views/reports.js';

await syncAuth();
await Promise.all([syncUsers(), syncPosts(), syncSocial()]);
const user = requireAdmin();               // members → dashboard.html, guests → login.html
if (user) {
  const ctx = { user, query: '' };
  const shell = renderShell(document.getElementById('app'), ctx, { onSearch(q) { ctx.query = q; route(); } });

  function currentRoute() {
    let r = location.hash.slice(1) || 'home';
    if (r === 'queue') r = 'queue/pending';
    return r in TITLES ? r : 'home';
  }
  let last = null;
  function route() {
    const r = currentRoute();
    if (r !== last) { ctx.query = ''; shell.clearSearch(); last = r; }
    shell.setActive(r);
    const refresh = () => { shell.refreshBell(); route(); };
    ctx.refresh = refresh;
    const [kind, status] = r.split('/');
    if (kind === 'queue') queue(shell.view, ctx, status);
    else ({ home, categories, featured, users, events, reports })[kind](shell.view, ctx);
    logActivity('view');
  }
  window.addEventListener('hashchange', () => { closeModal(); window.scrollTo(0, 0); route(); });
  route();
}
