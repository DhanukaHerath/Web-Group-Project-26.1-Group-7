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
}