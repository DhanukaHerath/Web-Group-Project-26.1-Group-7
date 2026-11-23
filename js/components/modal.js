/* modal.js – generic modal (backdrop, Esc, ✕ and click-outside to close). */
export function openModal(innerHTML, { wide = false } = {}) {
  closeModal();
  const back = document.createElement('div');
  back.className = 'modal-backdrop';
  back.innerHTML = `
    <div class="auth-modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">
      <header class="auth-modal-head"><span class="auth-brand"><img src="images/logo.png" alt="" class="auth-logo" width="32" height="32">Scriptorium</span>
        <button type="button" class="auth-close" data-close aria-label="Close">&#10005;</button></header>
      <section class="auth-card">${innerHTML}</section>
    </div>`;
  const onKey = e => { if (e.key === 'Escape') closeModal(); };
  back.addEventListener('mousedown', e => { if (e.target === back || e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', onKey);
  back._cleanup = () => document.removeEventListener('keydown', onKey);
  document.body.appendChild(back);
  document.body.classList.add('modal-open');
  return back;
}
export function closeModal() {
  const m = document.querySelector('.modal-backdrop');
  if (m) { m._cleanup?.(); m.remove(); }
  document.body.classList.remove('modal-open');
}

/** Yes/no confirmation. Resolves true when the user confirms. */
export function confirmModal({ title, message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise(resolve => {
    const m = openModal(`<h1>${title}</h1><p class="confirm-msg">${message}</p>
      <div class="confirm-actions"><button type="button" class="btn-outline" data-no>Cancel</button>
      <button type="button" class="auth-submit ${danger ? 'danger' : ''}" data-yes>${confirmLabel}</button></div>`);
    let done = false;
    const finish = v => { if (done) return; done = true; closeModal(); resolve(v); };
    m.addEventListener('click', e => { if (e.target.closest('[data-yes]')) finish(true); else if (e.target.closest('[data-no],[data-close]')) finish(false); });
    m.addEventListener('mousedown', e => { if (e.target === m) finish(false); });
    new MutationObserver(() => { if (!document.body.contains(m)) finish(false); }).observe(document.body, { childList: true });
  });
}
