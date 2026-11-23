import "./setup.js";
import { esc } from "../core/dom.js";
import { resolveAvatar } from "./avatar-state.js";

export function avatarFromState(state, { size = 96, title = "" } = {}) {
  const s = state.selections;
  const vars = Object.entries(state.colors)
    .map(([k, v]) => `--hm-${k}:#${v}`)
    .join(";");

  return `<humation-avatar head="${esc(s.head)}" body="${esc(s.body)}" bottom="${esc(s.bottom)}" item="${esc(s.item)}" glasses="${esc(s.glasses)}" background="${esc(state.background)}" size="${size}" style="${esc(vars)}"${title ? ` title="${esc(title)}"` : ""}></humation-avatar>`;
}

export function avatarHTML(user, { size = 96, fallbackSeed } = {}) {
  const state = resolveAvatar(user, fallbackSeed);
  const name = user?.username ? `${user.username}'s avatar` : "Avatar";

  // makes it circle by avatar warpper
  return `<span class="avatar" style="--avatar-size:${size}px">${avatarFromState(state, { size, title: name })}</span>`;
}
