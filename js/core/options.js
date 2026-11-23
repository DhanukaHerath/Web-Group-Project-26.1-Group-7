/* options.js – dropdown lists shared by Register and event registration forms.
   EDIT THESE to match your university. */
export const FACULTIES = [
  'Faculty of Arts', 'Faculty of Fine Arts & Design', 'Faculty of Humanities & Social Sciences',
  'Faculty of Science', 'Faculty of Engineering', 'Faculty of Management & Commerce',
  'Faculty of Law', 'Faculty of Medicine', 'Faculty of IT / Computing', 'Other',
];
const THIS_YEAR = new Date().getFullYear();
export const BATCHES = Array.from({ length: 10 }, (_, i) => String(THIS_YEAR - i)); // 2026 … 2017

/** <option> markup with a disabled placeholder (optionally pre-selecting `selected`). */
export function optionsHTML(placeholder, items, selected = '') {
  return `<option value="" disabled ${selected ? '' : 'selected'}>${placeholder}</option>` +
    items.map(v => `<option${v === selected ? ' selected' : ''}>${v}</option>`).join('');
}
