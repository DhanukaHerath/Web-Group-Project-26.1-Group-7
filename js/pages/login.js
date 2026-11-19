

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