export const API_BASE = 'api';

export async function apiRequest(endpoint, { method = 'GET', body = null } = {}) {
  const opts = { method, credentials: 'same-origin', headers: {} };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body !== null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}/${endpoint}`, opts);
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON response */ }
  if (!res.ok || !json || json.success === false) {
    const err = new Error(json?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return json.data;
}
