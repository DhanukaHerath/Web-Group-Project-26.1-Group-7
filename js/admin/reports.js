import { allUsers, effectiveStatus } from '../core/auth.js';
import { allPosts, getCategories } from '../core/posts.js';
import { allEvents, registrationsFor } from '../core/events.js';
import { series, sum, overview } from './stats.js';
import { openReport } from '../components/report.js';
import { fmtDate, timeAgo } from '../core/dom.js';

export function openSiteReport(days) {
    const n = days || 30, s = series(n), o = overview();
    const label = days ? `Last ${days} days` : 'Last 30 days (all recorded history)';
    const from = Date.now() - n * 864e5;
    const posts = allPosts();

    openReport({
        title: 'Scriptorium - Website Status Report',
        subtitle: label,
        filename: `scriptorium-site-report-${n}d`,
        sections: [],
    });
}

export function openEventReport() {}