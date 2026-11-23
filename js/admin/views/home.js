/* admin home – website status + user interaction (Chart.js). */

import { series, sum, delta, overview } from '../stats.js';
import { avatarHTML } from '../../humation/avatar-view.js';
import { openSiteReport } from '../reports.js';
import { esc } from '../../core/dom.js';

const PURPLE = '#6a35c9', LIGHT = '#d9cbf7', GREEN = '#17c11a', CYAN = '#2ec5f5';
let charts = [];

const deltaTag = d => d === null ? '' : `<span class="delta ${d < 0 ? 'down' : 'up'}">${d > 0 ? '+' : ''}${d}%</span>`;
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export function render(container, ctx) {
    charts.forEach(c => c.destroy()); charts = [];
    const el = document.createElement('div'); container.replaceChildren(el);
    const o = overview(), now14 = series(14), prev14 = series(14, 14), s10 = series(10);
    const avgPosts = (sum(now14.posts) / 14).toFixed(1);
    const regs14 = sum(now14.regs), views14 = sum(now14.views);
    const todayViews = now14.views.at(-1);

    el.innerHTML = `
  <div class="welcome-banner">
    ${avatarHTML(ctx.user, { size: 48 })}
    <div><h2>Welcome back! ${esc((ctx.user.fullName || ctx.user.username).split(' ')[0])} 👋</h2><p>Check your reports</p></div>
    <button type="button" class="btn-solid" data-report="30">Generate website report</button>
  </div>

  <div class="spark-row">
    <div class="spark"><canvas id="sp1"></canvas><div><b>${avgPosts}</b>${deltaTag(delta(sum(now14.posts), sum(prev14.posts)))}<small>Posts per day (14 days)</small></div></div>
    <div class="spark"><canvas id="sp2"></canvas><div><b>${regs14}</b>${deltaTag(delta(regs14, sum(prev14.regs)))}<small>Event registrations (14 days)</small></div></div>
    <div class="spark"><canvas id="sp3"></canvas><div><b>${views14.toLocaleString()}</b>${deltaTag(delta(views14, sum(prev14.views)))}<small>Page views (14 days)</small></div></div>
  </div>

  <section class="big-card">
    <h3>Active users right now</h3>
    <div class="big-grid">
      <div class="big-left">
        <div class="big-num">${o.active15m}</div>
        <p class="big-sub">members active in the last 15 min · ${o.active24h} in the last 24 h</p>
        <div class="pv"><span class="pv-ic"><svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6zm8 1.500V8h4.500z"/></svg></span><span>Page views<br>today: <b>${todayViews}</b></span></div>
        <canvas id="spBig" height="60"></canvas>
        <p class="big-cap">Page views, last 14 days</p>
      </div>
      <div class="chart-box"><canvas id="bars"></canvas></div>
    </div>
    <div class="tiles">
      <div class="tile"><div class="tile-h"><i class="ti t-purple"></i>Members</div><b>${o.members}</b><div class="bar"><span class="c-purple" style="width:${pct(o.active7d, o.members)}%"></span></div><small>${pct(o.active7d, o.members)}% active this week</small></div>
      <div class="tile"><div class="tile-h"><i class="ti t-blue"></i>Posts</div><b>${o.approved}</b><div class="bar"><span class="c-blue" style="width:${pct(o.approved, o.posts)}%"></span></div><small>${o.posts} submitted · ${o.featured} featured</small></div>
      <div class="tile"><div class="tile-h"><i class="ti t-red"></i>Pending</div><b>${o.pending}</b><div class="bar"><span class="c-red" style="width:${pct(o.pending, o.posts)}%"></span></div><small><a href="#queue/pending">Review now</a> · ${o.disapproved} disapproved</small></div>
      <div class="tile"><div class="tile-h"><i class="ti t-cyan"></i>Registrations</div><b>${o.registrations}</b><div class="bar"><span class="c-cyan" style="width:${pct(o.registeredMembers, o.members)}%"></span></div><small>${pct(o.registeredMembers, o.members)}% of members registered</small></div>
    </div>
  </section>`;

    /* ---- Chart.js ---- */
    if (!window.Chart) { el.querySelector('.big-grid').insertAdjacentHTML('beforeend', '<p class="empty-box">Charts could not load (vendor/chartjs/chart.umd.js missing).</p>'); }
    else {
        Chart.defaults.font.family = '"Plus Jakarta Sans", Arial, sans-serif';
        const line = (id, data, color) => charts.push(new Chart(el.querySelector(id), {
            type: 'line', data: { labels: now14.labels, datasets: [{ data, borderColor: color, borderWidth: 2, tension: .4, pointRadius: 0, fill: false }] },
            options: { responsive: true, maintainAspectRatio: false, animation: false, events: [], plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } },
        }));
        line('#sp1', now14.posts, PURPLE); line('#sp2', now14.regs, GREEN); line('#sp3', now14.views, CYAN); line('#spBig', now14.views, PURPLE);

        charts.push(new Chart(el.querySelector('#bars'), {
            type: 'bar',
            data: {
                labels: s10.labels, datasets: [
                    { label: 'Page views', data: s10.views, backgroundColor: LIGHT, borderRadius: 4, barThickness: 8, grouped: false, order: 2 },
                    { label: 'Interactions (logins, posts, likes, comments, follows…)', data: s10.interactions, backgroundColor: PURPLE, borderRadius: 4, barThickness: 8, grouped: false, order: 1 },
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 } } } },
                scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.06)', borderDash: [4, 4] } } }
            },
        }));
    }

    el.addEventListener('click', e => { const r = e.target.closest('[data-report]'); if (r) openSiteReport(+r.dataset.report); });
}
