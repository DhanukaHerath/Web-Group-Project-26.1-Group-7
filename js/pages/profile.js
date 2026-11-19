// Imports
import { initNav } from "../components/nav.js";
import { currentUser, getUserById, logout } from "../core/auth.js";
import { avatarHTML } from "../humation/avatar-view.js";
import { esc, $ } from "../core/dom.js";

// Set up the nav bar
initNav();

// checking who is logged right now
const me = currentUser();

const id = new URLSearchParams(location.search).get("u");
const user = id ? getUserById(id) : me;

const root = $("#profileRoot");

if (!user) {
  // No user found.
  // if user is not found returning the error.
  if (!id) location.replace("login.html?next=profile.html");
  root.innerHTML = '<p class="empty">This member could not be found.</p>';
} else {
  const own = me && me.id === user.id;

  // Account creted date
  const joined = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  // Build the profile card.
  root.innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">${avatarHTML(user, { size: 180 })}</div>
      <div class="profile-info">
        <h1>${esc(user.username)}</h1>
        ${own ? `<p class="profile-email">${esc(user.email)}</p>` : ""}
        <p class="profile-bio">${user.bio ? esc(user.bio) : '<span class="muted">No bio yet.</span>'}</p>
        <p class="profile-meta">Member since ${esc(joined)}</p>
        ${
          own
            ? `<div class="profile-actions">
          <a href="profile-edit.html" class="btn-solid">Edit profile &amp; avatar</a>
          <button type="button" class="btn-outline" data-action="logout">Log out</button></div>`
            : ""
        }
      </div>
    </div>`;

  // logout mechanism
  // loging out and returning to home
  root.addEventListener("click", (e) => {
    if (e.target.closest('[data-action="logout"]')) {
      logout();
      location.href = "index.html";
    }
  });
}
