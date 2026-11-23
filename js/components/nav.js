/* nav.js – shared header: builds the navbar for every page and switches
   between guest buttons and the logged-in avatar menu based on the session. */
import { currentUser, logout } from '../core/auth.js';
import { avatarHTML } from '../humation/avatar-view.js';
import { esc } from '../core/dom.js';

export function initNav() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const page = location.pathname.split('/').pop() || 'index.html';
  const user = currentUser();

  const actions = user
    ? `<a href="dashboard.html" class="btn-solid">Dashboard</a>
       <a href="profile.html" class="nav-user" title="View profile">${avatarHTML(user, { size: 34 })}<span>${esc(user.username)}</span></a>
       <button type="button" class="btn-outline" data-action="logout">Log out</button>`
    : `<a href="login.html?tab=register" class="btn-outline">Register</a>
       <a href="login.html" class="btn-solid">Login</a>`;

  header.className = 'navbar';
  header.innerHTML = `
    <a href="index.html" class="logo"><img src="images/logo.png" alt="" class="logo-img" width="32" height="32"><span>Scriptorium</span></a>
    <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="navMenu"><span></span><span></span><span></span></button>
    <nav class="nav-menu" id="navMenu">
      <ul class="nav-links">
        <li><a href="index.html" data-page="home">Home</a></li>
        <li><a href="gallery.html" data-page="gallery">Gallery</a></li>
        <li><a href="gallery.html#explore" data-page="explore">Explore</a></li>
        <li><a href="index.html#about" data-page="about">About Us</a></li>
      </ul>
      <div class="nav-actions">${actions}</div>
    </nav>`;

  const menu = header.querySelector('#navMenu');
  const toggle = header.querySelector('#navToggle');
  const setOpen = open => { menu.classList.toggle('open', open); toggle.classList.toggle('open', open); toggle.setAttribute('aria-expanded', open); };

  // one delegated listener for the whole header
  header.addEventListener('click', e => {
    if (e.target.closest('#navToggle')) return setOpen(!menu.classList.contains('open'));
    if (e.target.closest('[data-action="logout"]')) { logout(); location.href = 'index.html'; return; }
    if (e.target.closest('.nav-links a')) setOpen(false);
  });
  // highlight the current page (Gallery vs Explore tab share gallery.html)
  const mark = () => {
    const key = page === 'gallery.html' ? (location.hash === '#explore' ? 'explore' : 'gallery') : page === 'index.html' || page === '' ? (location.hash === '#about' ? 'about' : 'home') : null;
    header.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.page === key));
  };
  mark(); window.addEventListener('hashchange', mark);
}
