/* avatar-view.js – builds <humation-avatar> markup from a user / state.
   Uses only documented attributes: head, body, bottom, item, glasses,
   background, size, title, and --hm-* CSS custom properties for colours. */
import './setup.js';
import { esc } from '../core/dom.js';
import { resolveAvatar } from './avatar-state.js';

/** <humation-avatar> markup for an explicit avatar state. */
export function avatarFromState(state, { size = 96, title = '' } = {}) {
  const s = state.selections;
  const vars = Object.entries(state.colors).map(([k, v]) => `--hm-${k}:#${v}`).join(';');
  return `<humation-avatar head="${esc(s.head)}" body="${esc(s.body)}" bottom="${esc(s.bottom)}" item="${esc(s.item)}" glasses="${esc(s.glasses)}" background="${esc(state.background)}" size="${size}" style="${esc(vars)}"${title ? ` title="${esc(title)}"` : ''}></humation-avatar>`;
}

/** Round avatar for a user (saved avatar, or one generated from their ID). */
export function avatarHTML(user, { size = 96, fallbackSeed } = {}) {
  const state = resolveAvatar(user, fallbackSeed);
  const name = user?.username ? `${user.username}'s avatar` : 'Avatar';
  return `<span class="avatar" style="--avatar-size:${size}px">${avatarFromState(state, { size, title: name })}</span>`;
}
