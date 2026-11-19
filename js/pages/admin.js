import { requireAdmin } from '../core/auth.js';
import { logActivity } from '../core/activity.js';
import { closeModal } from '../components/modal.js';
import { renderShell, TITLES } from '../admin/shell.js';

const user = requireAdmin();
if (user) {
    const ctx = { user, query: ''};
    const shell = renderShell(document.getElementById('app'),ctx,{
        onSearch(q) {
            ctx.query = q;
            route();
        }
    });

    function currentRoute() {
        let r = location.hash.slice(1) || 'home';
        if (r === 'queue') {
            r = 'queue/pending';
        }
        return r in TITLES ? r : 'home';
    }

    let last = null;
    function route() {
        const r = currentRoute();
        if (r !== last) {
            ctx.query = '';
            shell.clearSearch();
            last = r;
        }
        shell.setActive(r);
        const refresh = () => {
            shell.refreshBell();
            route();
        };
        ctx.refresh = refresh;
        const [kind, status] = r.split('/');
        if (kind === 'queue') {
            queue(shell.view, ctx, status);
        } else {
            ({ home,
                categories,
                featured,
                users,
                events,
                reports
            })[kind](shell.view, ctx);
        }
        longActivity('view');
    }

    window.addEventListener('hashchange', () => {
        closeModal();
        window.scrollTo(0, 0);
        route();
    });
    route();
}