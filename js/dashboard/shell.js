/* shell.js – dashboard frame: sidebar, top bar (title, search, bell, avatar), mobile drawer. */
import { logout, isAdmin } from '../core/auth.js';
import { notificationsFor, unreadCount, markAllRead } from '../core/notifications.js';
import { avatarHTML } from '../humation/avatar-view.js';
import { allEvents, isRegistered, canRegister } from '../core/events.js';
import { esc } from '../core/dom.js';

const ICONS = {
  home: '<svg viewBox="0 0 24 24"><path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3z"/></svg>',
  explore: '<svg viewBox="0 0 24 24"><path d="M3 4h18v4H3zM4 9h16v11H4zm5 3v2h6v-2z"/></svg>',
  events: '<svg viewBox="0 0 24 24"><path d="M3 3h8v10H3zm10 0h8v6h-8zM3 15h8v6H3zm10-4h8v10h-8z"/></svg>',
  create: '<svg viewBox="0 0 24 24"><path d="M11 3h2v8h8v2h-8v8h-2v-8H3v-2h8z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zm6-2 5 5"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M6 17V11a6 6 0 1 1 12 0v6l2 2H4zM10 21h4"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>',
};
export const NAV = [
  { id: 'home', label: 'Home', title: 'Content Overview' },
  { id: 'explore', label: 'Explore', title: 'Explore the Gallery' },
  { id: 'events', label: 'Events & Exhibitions', title: 'Events & Exhibitions' },
  { id: 'create', label: 'Create Post', title: 'Create Post' },
];

/* simple brand mark: navy tile with an orange stroke */
const LOGO = `<img src="images/logo.png" alt="Scriptorium logo" class="brand-mark" width="74" height="74">`;

export function renderShell(app, ctx, { onSearch }) {
  const { user } = ctx;
  app.innerHTML = `
  <aside class="sidebar" id="sidebar">
    <a href="index.html" class="brand">${LOGO}<span>Scriptorium</span></a>
    <nav class="side-nav">
      ${NAV.map(n => `<a href="#${n.id}" data-nav="${n.id}">${ICONS[n.id]}<span>${n.label}</span></a>`).join('')}
    </nav>
    <div class="side-bottom">
      <button type="button" class="side-btn logout" data-action="logout">Logout</button>
      <div class="user-card-wrap">
        <button type="button" class="side-btn user-card" data-action="user-menu" aria-haspopup="true">
          ${avatarHTML(user, { size: 30 })}
          <span class="uc-text"><b>${esc(user.fullName || user.username)}</b><small>${esc(user.email)}</small></span>
          <span class="dots" aria-hidden="true">⋮</span>
        </button>
        <div class="pop user-menu" id="userMenu" hidden>
          <a href="profile.html">My profile</a>
          <a href="profile-edit.html">Edit profile &amp; avatar</a>
          ${isAdmin(user) ? '<a href="admin.html">Admin dashboard</a>' : ''}
          <a href="index.html">Landing page</a>
        </div>
      </div>
    </div>
  </aside>
  <div class="scrim" data-action="close-drawer"></div>

  <div class="main">
    <header class="topbar">
      <button type="button" class="icon-btn burger" data-action="open-drawer" aria-label="Open menu">${ICONS.menu}</button>
      <h1 class="top-title" id="topTitle">Content Overview</h1>
      <label class="search">
        <input type="search" id="searchInput" placeholder="Search anything here..." aria-label="Search">${ICONS.search}
      </label>
      <div class="top-right">
        <div class="bell-wrap">
          <button type="button" class="icon-btn" data-action="bell" aria-label="Notifications">${ICONS.bell}<i class="dot" id="bellDot" hidden></i></button>
          <div class="pop bell-pop" id="bellPop" hidden></div>
        </div>
        <a href="profile.html" class="top-avatar" aria-label="My profile">${avatarHTML(user, { size: 34 })}</a>
      </div>
    </header>
    <main class="content" id="view" tabindex="-1"></main>
  </div>`;

  const $ = s => app.querySelector(s);
  const closePops = () => app.querySelectorAll('.pop').forEach(p => (p.hidden = true));

  /* bell: your notifications (approvals / disapprovals) + upcoming events; blue dot = unread */
  function refreshBell() {
    const now = Date.now();
    const notes = notificationsFor(user.id).slice(0, 6);
    const upcoming = allEvents().filter(e => e.date > now).slice(0, 4);
    const unread = unreadCount(user.id);
    $('#bellDot').hidden = !(unread || upcoming.some(e => canRegister(e) && !isRegistered(e.id, user.id)));
    $('#bellPop').innerHTML = `<h4>Notifications</h4>` + (notes.length ? notes.map(n =>
      `<a href="#create" class="note ${esc(n.type)}${n.read ? '' : ' unread'}"><b>${esc(n.title)}</b><small>${esc(n.message)}</small></a>`).join('') : '<p class="muted">No notifications yet.</p>') +
      `<h4>Upcoming</h4>` + (upcoming.length ? upcoming.map(e =>
      `<a href="#events"><b>${esc(e.title)}</b><small>${esc(e.kind)} · ${new Date(e.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</small></a>`).join('') : '<p class="muted">Nothing upcoming.</p>');
  }
  refreshBell();

  app.addEventListener('click', e => {
    const act = e.target.closest('[data-action]')?.dataset.action;
    if (act === 'logout') { logout(); location.href = 'index.html'; return; }
    if (act === 'open-drawer') { document.body.classList.add('drawer-open'); return; }
    if (act === 'close-drawer' || e.target.closest('.side-nav a')) document.body.classList.remove('drawer-open');
    if (act === 'user-menu') { const m = $('#userMenu'); const was = m.hidden; closePops(); m.hidden = !was; return; }
    if (act === 'bell') { refreshBell(); const m = $('#bellPop'); const was = m.hidden; closePops(); m.hidden = !was; if (was) { markAllRead(user.id); $('#bellDot').hidden = true; } return; }
    closePops();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePops(); });

  let t;
  $('#searchInput').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => onSearch(e.target.value.trim()), 200); });

  return {
    view: $('#view'),
    /** highlight the active nav item + set the heading */
    setActive(id) {
      app.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === id));
      $('#topTitle').textContent = NAV.find(n => n.id === id)?.title || 'Content Overview';
    },
    refreshBell,
  };
}
