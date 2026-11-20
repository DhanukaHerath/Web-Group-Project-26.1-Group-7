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

export function render(container, ctx) {}