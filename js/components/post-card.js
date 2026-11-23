/* post-card.js – gallery card + detail modal (description, artist, like, comment, follow). */
import { authorOf, categoryOf, isTextCategory, isRealMember, displayName } from '../core/posts.js';
import { currentUser, isAdmin, getUserById } from '../core/auth.js';
import { likeCount, hasLiked, toggleLike, commentsFor, addComment, deleteComment, isFollowing, followerCount, toggleFollow } from '../core/social.js';
import { logActivity } from '../core/activity.js';
import { avatarHTML } from '../humation/avatar-view.js';
import { openModal } from './modal.js';
import { esc, toast, timeAgo } from '../core/dom.js';

const byline = (a, size = 24) => `<span class="p-by">${avatarHTML(a, { size })}<span>${esc(displayName(a))}</span></span>`;
const changed = () => window.dispatchEvent(new CustomEvent('social-change'));

export function postCard(post) {
  const a = authorOf(post);
  if (isTextCategory(post.category)) {
    return `<article class="p-card poem" data-post="${esc(post.id)}" tabindex="0" role="button" aria-label="Open ${esc(post.title)}">
      <h4>${esc(post.title)}</h4><p>${esc(post.text)}</p>${byline(a)}</article>`;
  }
  return `<article class="p-card" data-post="${esc(post.id)}" tabindex="0" role="button" aria-label="Open ${esc(post.title)}">
    <img src="${esc(post.image)}" alt="${esc(post.title)}" loading="lazy" draggable="false">
    <div class="p-cap"><strong>${esc(post.title)}</strong>${byline(a)}</div></article>`;
}

export function openPostDetail(post) {
  const m = openModal('<div class="detail"></div>', { wide: true });
  const box = m.querySelector('.detail');
  let draft = '', error = '';
  const social = post.status === 'approved';     // pending / disapproved posts (admin preview) have no social features

  function paint() {
    const me = currentUser();
    const a = authorOf(post), cat = categoryOf(post.category);
    const date = new Date(post.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    const canFollow = social && me && me.id !== a.id;
    const liked = me && hasLiked(post.id, me.id), following = me && isFollowing(me.id, a.id);
    const comments = social ? commentsFor(post.id) : [];
    const login = `<a href="login.html?next=${encodeURIComponent(location.pathname.split('/').pop() + location.search)}">Log in</a>`;
    const scroll = m.scrollTop;

    box.innerHTML = `
      ${isTextCategory(post.category) ? '' : `<img class="detail-img" src="${esc(post.image)}" alt="${esc(post.title)}">`}
      <span class="badge">${esc(cat?.label || post.category)}</span>
      <h1>${esc(post.title)}</h1>
      ${isTextCategory(post.category) ? `<p class="detail-text">${esc(post.text)}</p>` : (post.description ? `<p class="detail-desc">${esc(post.description)}</p>` : '')}
      <div class="detail-by">${avatarHTML(a, { size: 44 })}
        <div><strong>${esc(displayName(a))}</strong><small>${esc(date)}${social ? ` · ${followerCount(a.id)} follower${followerCount(a.id) === 1 ? '' : 's'}` : ''}</small></div>
        ${isRealMember(a) ? `<a class="btn-outline" href="profile.html?u=${encodeURIComponent(a.id)}">Profile</a>` : ''}
        ${canFollow ? `<button type="button" class="follow-btn${following ? ' on' : ''}" data-follow>${following ? '✓ Following' : '+ Follow'}</button>` : ''}
      </div>
      ${social ? `
      <div class="detail-actions">
        <button type="button" class="like-btn${liked ? ' on' : ''}" data-like aria-pressed="${!!liked}"><span>${liked ? '♥' : '♡'}</span> ${likeCount(post.id)}</button>
        <span class="muted">${comments.length} comment${comments.length === 1 ? '' : 's'}</span>
      </div>
      ${me ? '' : `<p class="login-hint">${login} or <a href="login.html?tab=register">register</a> to like, comment and follow artists.</p>`}
      <section class="comments">
        <h3>Comments</h3>
        ${comments.length ? comments.map(c => { const u = getUserById(c.userId) || { id: c.userId, username: c.username || 'user', fullName: c.fullName || c.full_name || c.username || 'user', avatar: c.user_avatar || null };
          return `<div class="comment">${avatarHTML(u, { size: 30 })}<div><b>${esc(displayName(u))}</b> <small>${timeAgo(c.createdAt)}</small>
            <p>${esc(c.text)}</p></div>${me && (me.id === c.userId || isAdmin(me)) ? `<button type="button" class="c-del" data-delcomment="${esc(c.id)}" aria-label="Delete comment">✕</button>` : ''}</div>`; }).join('') : '<p class="muted">No comments yet.</p>'}
        ${me ? `<form class="comment-form" data-cform><textarea rows="2" maxlength="300" placeholder="Write a comment…">${esc(draft)}</textarea>
          <p class="form-error" role="alert">${esc(error)}</p><button type="submit" class="btn-solid">Post comment</button></form>` : ''}
      </section>` : ''}`;
    m.scrollTop = scroll;
  }
  paint();

  box.addEventListener('click', async e => {
    const me = currentUser();
    if (e.target.closest('[data-like]')) { if (!me) return toast('Please log in to like', 'error'); try { if (await toggleLike(post.id, me.id)) logActivity('like'); changed(); paint(); } catch (x) { toast(x.message, 'error'); } }
    else if (e.target.closest('[data-follow]')) { try { await toggleFollow(me.id, post.authorId); changed(); paint(); } catch (x) { toast(x.message, 'error'); } }
    else if (e.target.closest('[data-delcomment]')) { try { await deleteComment(e.target.closest('[data-delcomment]').dataset.delcomment); changed(); paint(); } catch (x) { toast(x.message, 'error'); } }
  });
  box.addEventListener('input', e => { if (e.target.matches('.comment-form textarea')) draft = e.target.value; });
  box.addEventListener('submit', async e => {
    if (!e.target.matches('[data-cform]')) return;
    e.preventDefault();
    try { await addComment(post.id, currentUser(), draft); draft = ''; error = ''; changed(); paint(); }
    catch (x) { error = x.message; paint(); }
  });
}
