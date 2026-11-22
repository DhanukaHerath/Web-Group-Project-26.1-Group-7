import { initNav } from "../components/nav.js";
import { requireLogin, updateProfile, updateUser } from "../core/auth.js";
import { resolveAvatar } from "../humation/avatar-state.js";
import { createAvatarPicker } from "../humation/avatar-picker.js";
import { toast, $ } from "../core/dom.js";

// required to login to make changes to profile
const user = requireLogin();

if (user) {
  // nav
  initNav();

  // welcome
  const params = new URLSearchParams(location.search);
  if (params.has("welcome")) $("#welcome").hidden = false;

  const form = $("#editForm");
  form.username.value = user.username;
  form.bio.value = user.bio || "";

  const picker = createAvatarPicker(
    $("#avatarPicker"),
    resolveAvatar(user),
    () => {
      dirty = true;
    },
  );

  // checks whether there are unsaved changes
  let dirty = false;

  // typing count as a change
  form.addEventListener("input", () => {
    dirty = true;
  });

  // warning if there are unsaved changes when exit
  window.addEventListener("beforeunload", (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  // button (save)
  form.addEventListener("submit", async (e) => {
    // stoping the browser from reloading
    e.preventDefault();

    const errEl = $(".form-error", form);
    const btn = $('button[type="submit"]', form);

    errEl.textContent = "";
    btn.disabled = true;

    try {
      // collecting the things from the form
      const data = Object.fromEntries(new FormData(form));

      await updateProfile(user.id, data);
      updateUser(user.id, { avatar: picker.getState() });

      dirty = false;
      toast("Profile saved");

      // short pause to see the toast then returning to the profile
      setTimeout(() => {
        location.href = "profile.html";
      }, 600);
    } catch (err) {
      errEl.textContent = err.message;
      btn.disabled = false;
    }
  });
}
