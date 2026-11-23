/* profile-edit.js – edit username/bio/password and build/change the avatar.
   The avatar can be changed here at any time; saving updates the user record
   so it is shown on the profile page, in the navbar and on poem cards. */
import { initNav } from '../components/nav.js';
import { requireLogin, syncAuth, updateProfile, updateAvatar } from '../core/auth.js';
import { resolveAvatar } from '../humation/avatar-state.js';
import { createAvatarPicker } from '../humation/avatar-picker.js';
import { toast, $ } from '../core/dom.js';

await syncAuth();
const user = requireLogin();
if (user) {
  initNav();
  const params = new URLSearchParams(location.search);
  if (params.has('welcome')) $('#welcome').hidden = false;

  const form = $('#editForm');
  form.username.value = user.username;
  form.bio.value = user.bio || '';

  // Start from the saved avatar, or the seed-based one when none is saved yet.
  const picker = createAvatarPicker($('#avatarPicker'), resolveAvatar(user), () => { dirty = true; });
  let dirty = false;
  form.addEventListener('input', () => { dirty = true; });
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = $('.form-error', form);
    const btn = $('button[type="submit"]', form);
    errEl.textContent = ''; btn.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      await updateProfile(user.id, data);                 // username, bio, optional password
      await updateAvatar(user.id, picker.getState());     // avatar (parts + colours)
      dirty = false;
      toast('Profile saved');
      setTimeout(() => { location.href = 'profile.html'; }, 600);
    } catch (err) { errEl.textContent = err.message; btn.disabled = false; }
  });
}
