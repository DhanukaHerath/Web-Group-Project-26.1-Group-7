const I = {
  home: '<svg viewBox="0 0 24 24"><path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3z"/></svg>',
  queue: '<svg viewBox="0 0 24 24"><path d="M3 4h18v4H3zM4 9h16v11H4zm5 3v2h6v-2z"/></svg>',
  cats: '<svg viewBox="0 0 24 24"><path d="M3 3h8v10H3zm10 0h8v6h-8zM3 15h8v6H3zm10-4h8v10h-8z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/></svg>',
  users: '<svg viewBox="0 0 24 24"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 13c-3.3 0-7 1.6-7 4.5V20h14v-2.5C16 14.6 12.3 13 9 13zm8 .5c-.6 0-1.200.1-1.800.2 1.500 1 2.800 2.400 2.800 3.800V20h4v-2c0-2.200-2.700-4.500-5-4.500z"/></svg>',
  events: '<svg viewBox="0 0 24 24"><path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zM5 9h14v11H5z"/></svg>',
  report: '<svg viewBox="0 0 24 24"><path d="M5 3h10l4 4v14H5zm9 1.500V8h3.500zM8 12h8v1.500H8zm0 3.500h8V17H8z"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  search: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" d="M10.500 18a7.500 7.500 0 1 1 0-15 7.500 7.500 0 0 1 0 15zm6-2 5 5"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M6 17V11a6 6 0 1 1 12 0v6l2 2H4zM10 21h4"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>',
};
const LOGO = `<svg viewBox="0 0 72 72" class="brand-mark" aria-hidden="true"><rect width="72" height="72" rx="20" fill="#25356b"/><path d="M38 14c14 4 10 14 0 18 8 2 6 12-4 26" fill="none" stroke="#e8a13a" stroke-width="4" stroke-linecap="round"/><circle cx="40" cy="14" r="3" fill="#fff"/></svg>`;

export const TITLES = {
  home: ['Content Overview', true], 'queue/pending': ['Approval Queue', true], 'queue/approved': ['Approved Posts', true], 'queue/disapproved': ['Disapproved Posts', true],
  categories: ['Storehouse', true], featured: ['Featured Artworks', true], users: ['User Management', false], events: ['Events & Exhibitions', true], reports: ['Reports', false],
};