

const $ = (s, r = document) => r.querySelector(s);
const params = new URLSearchParams(location.search);
const next = params.get('next');
const safeNext = next && /^[\w-]+\.html(\?[\w=&.%-]*)?$/.test(next) ? next : null; // same-folder pages only

const home = u => (isAdmin(u) ? 'admin.html' : 'dashboard.html');
const already = currentUser();
if (already) location.replace(isAdmin(already) ? 'admin.html' : (safeNext || 'dashboard.html'));

/* dropdowns */
$('#facultySelect').innerHTML = optionsHTML('Select faculty', FACULTIES);
$('#batchSelect').innerHTML = optionsHTML('Select batch', BATCHES);

const forms = { login: $('#loginForm'), register: $('#registerForm') };
function showForm(name) {
  Object.entries(forms).forEach(([k, f]) => { f.hidden = k !== name; f.querySelector('.form-error').textContent = ''; });
  document.title = (name === 'login' ? 'Sign in' : 'Register') + ' – Scriptorium';
}
showForm(params.get('tab') === 'register' ? 'register' : 'login');

document.addEventListener('click', e => {
  const sw = e.target.closest('[data-switch]');
  if (sw) { e.preventDefault(); showForm(sw.dataset.switch); return; }
  const eye = e.target.closest('[data-action="toggle-pw"]');
  if (eye) {
    const input = eye.parentElement.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    eye.classList.toggle('on', show);
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    return;
  }
  if (e.target.closest('[data-action="forgot"]')) {
    e.preventDefault();
    forms.login.querySelector('.form-error').textContent = 'Password reset is not available yet (no backend).';
  }
});

async function submit(form, action, onDone) {
  const errEl = form.querySelector('.form-error');
  const btn = form.querySelector('.auth-submit');
  errEl.textContent = ''; btn.disabled = true;
  try { const u = await action(Object.fromEntries(new FormData(form))); onDone(u); }
  catch (err) { errEl.textContent = err.message; btn.disabled = false; }
}

forms.login.addEventListener('submit', e => { e.preventDefault(); submit(forms.login, login, u => location.href = isAdmin(u) ? 'admin.html' : (safeNext || 'dashboard.html')); });
forms.register.addEventListener('submit', e => { e.preventDefault(); submit(forms.register, register, () => location.href = 'profile-edit.html?welcome=1'); });