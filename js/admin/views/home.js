import { series, sum, delta, overview } from '../stats.js';
import { avatarHTML } from '../../humation/avatar-view.js';
import { openSiteReport } from '../reports.js';
import { esc } from '../../core/dom.js';

const PURPLE = '#6a35c9';
const LIGHT = '#d9cbf7';
const GREEN = '#17c11a';
const CYAN = '#2ec5f5';

let charts = [];

const deltaTag = d => d === null ? '' : `<span class="delta ${d < 0 ? 'down' : 'up'}">${d > 0 ? '+' : ''}${d}%</span>`;
const pct = (a, b) => (
    b ? Math.round((a / b) * 100) : 0
);

export function render(container, ctx) {
    charts.forEach(
        c => c.destroy()
    );
    charts = [];
    const el = document.createElement('div');
    container.replaceChildren(el);

    const o = overview();
    const now14 = series(14);
    const prev14 = series(14, 14);
    const s10 = series(10);

    const avgPosts = (sum(now14.posts) / 14).toFixed(1);

    const regs14 = sum(now14.regs);
    const views14 = sum(now14.views);

    const todayViews = now14.views.at(-1);

    el.innerHTML = ``;
}