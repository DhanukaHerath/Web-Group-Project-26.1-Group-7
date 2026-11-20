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

    el.innerHTML = `
    <div class="welcome-banner">
        ${avatarHTML(
            ctx.user,
            { size: 48 }
        )}
        <div>
            <h2>Welcome back! ${
                esc(
                    (
                        ctx.user.fullName || ctx.user.username
                    ).split(' ')[0]
                )
            } 👋</h2><p>Check your reports</p>
        </div>
        <button type="button" class="btn-solid" data-report="30">
            Generate website report
        </button>
    </div>

    <div class="spark-row">
        <div class="spark">
            <canvas id="sp1"></canvas>
            <div>
                <b>${avgPosts}</b>${
                    deltaTag(
                        delta(
                            sum(now14.posts),
                            sum(prev14.posts)
                        )
                    )
                }<small>Posts per day (14 days)</small>
            </div>
        </div>
        <div class="spark">
            <canvas id="sp2"></canvas>
            <div>
                <b>${regs14}</b>${
                    deltaTag(
                        delta(
                            regs14,
                            sum(prev14.regs)
                        )
                    )
                }<small>Event registrations (14 days)</small>
            </div>
        </div>
        <div class="spark">
            <canvas id="sp3"></canvas>
            <div>
                <b>${
                    views14.toLocaleString()
                }</b>${
                    deltaTag(
                        delta(
                            views14,
                            sum(prev14.views)
                        )
                    )
                }<small>Page views (14 days)</small>
            </div>
        </div>
    </div>`;
}