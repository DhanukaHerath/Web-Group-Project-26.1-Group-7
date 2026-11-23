/* create view – submit an artwork / artcraft / photograph (image + text) or a written piece.
   Submissions go to the admin approval queue; the status of the member's own posts is listed below the form. */
import { getCategories, addPost, postsByUser } from '../../core/posts.js';
import { logActivity } from '../../core/activity.js';
import { ACCEPT, fileToDataUrl } from '../image-utils.js';
import { toast, esc, fmtDate } from '../../core/dom.js';

export function render(container, ctx) {
  const el = document.createElement('div'); container.replaceChildren(el);
  const cats = getCategories();
  let category = cats[0]?.id, image = '', imageFile = null;
  const typeOf = id => cats.find(c => c.id === id)?.type;

  el.innerHTML = `
  <form id="postForm" class="create" novalidate>
    <h2>What are you sharing?</h2>
    <div class="cat-pick" role="radiogroup">
      ${cats.map(c => `<label class="cat-opt"><input type="radio" name="category" value="${esc(c.id)}" ${c.id === category ? 'checked' : ''}><span>${esc(c.label)}</span></label>`).join('')}
    </div>

    <label>Title<input type="text" name="title" maxlength="80" placeholder="Give it a title" required></label>

    <div data-for="image">
      <label>Upload image <small>(PNG recommended · JPG / WebP also work)</small></label>
      <label class="drop" id="drop"><input type="file" name="file" accept="${ACCEPT}" hidden>
        <span class="drop-hint">Click to choose an image</span><img class="drop-preview" alt="" hidden></label>
      <label>Description<textarea name="description" rows="4" maxlength="500" placeholder="Tell us about this piece – medium, story, inspiration…"></textarea></label>
    </div>

    <div data-for="text" hidden>
      <label>Your writing<textarea name="text" rows="10" maxlength="5000" placeholder="Write your poem or story here…"></textarea></label>
    </div>

    <p class="hint-note">Posts are reviewed by an admin before they appear in the gallery.</p>
    <p class="form-error" role="alert"></p>
    <button type="submit" class="btn-solid post-btn">Submit for approval</button>
  </form>
  <section class="my-subs"><h2>Your submissions</h2><div id="subs"></div></section>`;

  const form = el.querySelector('#postForm'), err = form.querySelector('.form-error');
  const drop = form.querySelector('#drop'), preview = form.querySelector('.drop-preview'), hint = form.querySelector('.drop-hint');

  function renderSubs() {
    const mine = postsByUser(ctx.user.id);
    el.querySelector('#subs').innerHTML = mine.length ? mine.map(p => `
      <div class="sub-row"><div><strong>${esc(p.title)}</strong><small>${esc(cats.find(c => c.id === p.category)?.label || p.category)} · ${fmtDate(p.createdAt)}</small>
        ${p.status === 'disapproved' && p.reviewNote ? `<p class="sub-note"><b>Admin note:</b> ${esc(p.reviewNote)}</p>` : ''}</div>
        <span class="status-pill ${p.status}">${p.status === 'pending' ? 'Pending review' : p.status === 'approved' ? 'Approved' : 'Disapproved'}</span></div>`).join('')
      : '<p class="muted">You have not submitted anything yet.</p>';
  }
  renderSubs();

  function syncCategory() {
    const isText = typeOf(category) === 'text';
    form.querySelector('[data-for="image"]').hidden = isText;
    form.querySelector('[data-for="text"]').hidden = !isText;
  }
  syncCategory();

  form.addEventListener('change', async e => {
    if (e.target.name === 'category') { category = e.target.value; err.textContent = ''; syncCategory(); }
    if (e.target.name === 'file') {
      const file = e.target.files[0]; if (!file) return;
      err.textContent = '';
      try { image = await fileToDataUrl(file); imageFile = file; preview.src = image; preview.hidden = false; hint.hidden = true; drop.classList.add('has'); }
      catch (x) { image = ''; imageFile = null; e.target.value = ''; preview.hidden = true; hint.hidden = false; drop.classList.remove('has'); err.textContent = x.message; }
    }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form)), isText = typeOf(category) === 'text';
    err.textContent = '';
    if (!d.title.trim()) return void (err.textContent = 'Please add a title.');
    if (isText) { if (d.text.trim().length < 10) return void (err.textContent = 'Please write something (at least a few words).'); }
    else { if (!image) return void (err.textContent = 'Please upload an image.'); if (!d.description.trim()) return void (err.textContent = 'Please add a description.'); }
    try {
      await addPost(ctx.user, { category, title: d.title, description: d.description, text: d.text, image: isText ? '' : image, file: isText ? null : imageFile });
      logActivity('post');
      toast('Submitted! An admin will review it soon.');
      render(container, ctx);                      // fresh form + updated submissions list
    } catch (x) { err.textContent = x.message; }
  });
}
