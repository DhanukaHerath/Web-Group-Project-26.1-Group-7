

const $ = (s, r = document) => r.querySelector(s);
const params = new URLSearchParams(location.search);
const next = params.get('next');
const safeNext = next && /^[\w-]+\.html(\?[\w=&.%-]*)?$/.test(next) ? next : null; // same-folder pages only

const home = u => (isAdmin(u) ? 'admin.html' : 'dashboard.html');
const already = currentUser();
if (already) location.replace(isAdmin(already) ? 'admin.html' : (safeNext || 'dashboard.html'));