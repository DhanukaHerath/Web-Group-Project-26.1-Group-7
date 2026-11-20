import { openSiteReport } from '../reports.js';
import { overview } from '../stats.js';

export function render(container) {
    const el = document.createElement('div');
    container.replaceChildren(el);

    const o = overview();
    el.innerHTML = ``;

    el.querySelector('[data-go]').addEventListener(
        'click',
        () => openSiteReport(
            +el.querySelector('#period').value
        )
    );
}