/* reports – generate the website status report for a period. */

import { openSiteReport } from '../reports.js';
import { overview } from '../stats.js';

export function render(container) {
    const el = document.createElement('div');
    container.replaceChildren(el);

    const o = overview();
    el.innerHTML = `<section class="create report-pick">
        <h2>Website status report</h2>
        <p class="muted">Users, how they interacted over time, and how much content there is. Download it as CSV or print / save it as a PDF.</p>
        <label>Time period<select id="period"><option value="7">Last 7 days</option><option value="30" selected>Last 30 days</option><option value="90">Last 90 days</option></select></label>
        <button type="button" class="btn-solid post-btn" data-go>Generate report</button>
        <p class="hint-note">Right now: ${o.users} users · ${o.posts} posts (${o.pending} pending) · ${o.registrations} event registrations.<br>
        Per-event attendee reports are under <a href="#events">Events → Registrations</a>.</p></section>`;

    el.querySelector('[data-go]').addEventListener(
        'click',
        () => openSiteReport(
            +el.querySelector('#period').value
        )
    );
}