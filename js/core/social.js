/* social.js – likes, comments and follows (localStorage). */
import { read, write, persistent } from './storage.js';
import { addNotification } from './notifications.js';
import { getPost } from './posts.js';
import { getUserById } from './auth.js';
import { apiRequest } from './api.js';

const LIKES = 'scriptorium.likes', COMMENTS = 'scriptorium.comments', FOLLOWS = 'scriptorium.follows';
let cache = null;
let usingApi = false;
const get = k => (cache ? [...cache[k]] : read(persistent, k, []));
const put = (k, list) => { if (cache) cache[k] = list; write(persistent, k, list); };
const id = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const nameOf = u => u.fullName || u.username;

/** Fetch likes, comments, and follows from MySQL (/api/social.php?action=all). */
export async function syncSocial() {
  try {
    const data = await apiRequest('social.php?action=all');
    if (data && Array.isArray(data.likes)) {
      usingApi = true;
      cache = { [LIKES]: data.likes, [COMMENTS]: data.comments || [], [FOLLOWS]: data.follows || [] };
      write(persistent, LIKES, cache[LIKES]);
      write(persistent, COMMENTS, cache[COMMENTS]);
      write(persistent, FOLLOWS, cache[FOLLOWS]);
      return cache;
    }
  } catch { /* fallback to local cache if offline / no PHP server */ }
  return null;
}

/* ---------- likes ---------- */
export const likeCount = postId => get(LIKES).filter(l => l.postId === postId).length;
export const hasLiked = (postId, userId) => get(LIKES).some(l => l.postId === postId && l.userId === userId);
export const allLikes = () => get(LIKES);
/** Toggles a like; returns true when the post is now liked. */
export async function toggleLike(postId, userId) {
  try {
    const res = await apiRequest('social.php?action=like', { method: 'POST', body: { post_id: postId } });
    const list = get(LIKES).filter(l => !(l.postId === postId && l.userId === userId));
    if (res.liked) list.push({ postId, userId, createdAt: Date.now() });
    put(LIKES, list);
    return res.liked;
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  const list = get(LIKES), i = list.findIndex(l => l.postId === postId && l.userId === userId);
  if (i >= 0) list.splice(i, 1); else list.push({ postId, userId, createdAt: Date.now() });
  put(LIKES, list);
  return i < 0;
}

/* ---------- comments ---------- */
export const commentsFor = postId => get(COMMENTS).filter(c => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt);
export const commentCount = postId => get(COMMENTS).filter(c => c.postId === postId).length;
export const allComments = () => get(COMMENTS);
export async function addComment(postId, user, text) {
  text = (text || '').trim();
  if (!text) throw new Error('Please write a comment first.');
  if (text.length > 300) throw new Error('Comments can be up to 300 characters.');
  try {
    const res = await apiRequest('social.php?action=comment', { method: 'POST', body: { post_id: postId, text } });
    const c = {
      id: res.comment.id, postId, userId: user.id, text, createdAt: res.comment.created_at,
      fullName: user.fullName || user.username, username: user.username, user_avatar: user.avatar || null,
    };
    const list = get(COMMENTS); list.push(c); put(COMMENTS, list);
    return c;
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  const list = get(COMMENTS), c = { id: id('c_'), postId, userId: user.id, text, createdAt: Date.now() };
  list.push(c); put(COMMENTS, list);
  const post = getPost(postId);
  if (post && post.authorId !== user.id) addNotification({ userId: post.authorId, type: 'info', postId, title: 'New comment', message: `${nameOf(user)} commented on “${post.title}”: ${text.slice(0, 80)}` });
  return c;
}
export async function deleteComment(cid) {
  try {
    await apiRequest(`social.php?action=delete_comment&id=${encodeURIComponent(cid)}`, { method: 'POST', body: { id: cid } });
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  put(COMMENTS, get(COMMENTS).filter(c => c.id !== cid));
}

/* ---------- follows ---------- */
export const allFollows = () => get(FOLLOWS);
export const isFollowing = (followerId, followeeId) => get(FOLLOWS).some(f => f.followerId === followerId && f.followeeId === followeeId);
export const followerCount = userId => get(FOLLOWS).filter(f => f.followeeId === userId).length;
export const followingCount = userId => get(FOLLOWS).filter(f => f.followerId === userId).length;
/** Toggles following; returns true when now following. Users can't follow themselves. */
export async function toggleFollow(followerId, followeeId) {
  if (followerId === followeeId) throw new Error("You can't follow yourself.");
  try {
    const res = await apiRequest('social.php?action=follow', { method: 'POST', body: { user_id: followeeId } });
    const list = get(FOLLOWS).filter(f => !(f.followerId === followerId && f.followeeId === followeeId));
    if (res.following) list.push({ followerId, followeeId, createdAt: Date.now() });
    put(FOLLOWS, list);
    return res.following;
  } catch (err) {
    if (usingApi || (err.status && err.status !== 404)) throw err;
  }
  const list = get(FOLLOWS), i = list.findIndex(f => f.followerId === followerId && f.followeeId === followeeId);
  if (i >= 0) list.splice(i, 1);
  else {
    list.push({ followerId, followeeId, createdAt: Date.now() });
    const me = getUserById(followerId);
    if (me) addNotification({ userId: followeeId, type: 'info', title: 'New follower', message: `${nameOf(me)} started following you.` });
  }
  put(FOLLOWS, list);
  return i < 0;
}
