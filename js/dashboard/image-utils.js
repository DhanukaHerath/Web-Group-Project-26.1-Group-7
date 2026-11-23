/* image-utils.js – validate + shrink uploaded images so they fit in localStorage. */
export const ACCEPT = 'image/png,image/jpeg,image/webp';
const ALLOWED = ACCEPT.split(',');
const MAX_BYTES = 8 * 1024 * 1024; // refuse huge originals
const MAX_SIDE = 1200;

/** Reads an image File and returns a downscaled data URL. Throws Error(message) if invalid. */
export async function fileToDataUrl(file) {
  if (!ALLOWED.includes(file.type)) throw new Error('Please choose a PNG (or JPG / WebP) image.');
  if (file.size > MAX_BYTES) throw new Error('That image is over 8 MB. Please choose a smaller one.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not read that image.')); i.src = url; });
    const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const out = c.toDataURL('image/webp', 0.85);
    return out.startsWith('data:image/webp') ? out : c.toDataURL('image/jpeg', 0.85);
  } finally { URL.revokeObjectURL(url); }
}
