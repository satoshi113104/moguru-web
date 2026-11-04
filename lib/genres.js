export const GENRES = {
  tako: { name: 'たこ焼き・粉もの', short: 'たこ焼き', color: '#7C4B1E' },
  curry: { name: 'カレー', short: 'カレー', color: '#D98A06' },
  sweets: { name: 'スイーツ', short: 'スイーツ', color: '#E0508F' },
  burger: { name: 'バーガー', short: 'バーガー', color: '#12907A' },
  ramen: { name: 'ラーメン', short: 'ラーメン', color: '#7D4CC2' },
  other: { name: 'その他', short: 'その他', color: '#F76B15' },
};

export const genre = (k) => GENRES[k] || GENRES.other;

// 写真がないお店のピンに出すイラスト
export const ICON = {
  tako: '<svg viewBox="0 0 32 32"><path d="M4 18c0 5 5 8 12 8s12-3 12-8z" fill="#E9C27A"/><circle cx="10" cy="15" r="5" fill="#B5743A"/><circle cx="22" cy="15" r="5" fill="#B5743A"/><circle cx="16" cy="12" r="5" fill="#9A5E2B"/><path d="M8 13c2-1 3 1 5 0M20 13c2-1 3 1 5 0M14 10c2-1 3 1 4 0" stroke="#FFF4D6" stroke-width="1.2" fill="none"/><path d="M24 3l-4 9" stroke="#C9A36B" stroke-width="1.4"/></svg>',
  curry: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="20" rx="13" ry="7" fill="#F3E9D2"/><path d="M5 18c2-6 20-6 22 0-3 5-19 5-22 0z" fill="#D98A06"/><path d="M14 13c2-3 8-3 10 1-3 2-7 2-10-1z" fill="#FFFDF5"/><circle cx="11" cy="17" r="1.6" fill="#8A4B12"/><circle cx="20" cy="18" r="1.4" fill="#C2410C"/></svg>',
  sweets: '<svg viewBox="0 0 32 32"><path d="M9 9l14 0-7 20z" fill="#E9C27A"/><path d="M8 9c0-5 16-5 16 0z" fill="#FFF3F7"/><circle cx="12" cy="7" r="2.6" fill="#E0508F"/><circle cx="18" cy="6.5" r="2.2" fill="#F48FB1"/><path d="M11 13l10 0M12 17l8 0" stroke="#D4A55A" stroke-width="1.2"/></svg>',
  burger: '<svg viewBox="0 0 32 32"><path d="M5 14c0-7 22-7 22 0z" fill="#E8A440"/><rect x="4" y="15" width="24" height="3" rx="1.5" fill="#6FB34A"/><rect x="5" y="18" width="22" height="4" rx="2" fill="#7A4A2A"/><path d="M5 23h22c0 3-2 4-4 4H9c-2 0-4-1-4-4z" fill="#E8A440"/></svg>',
  ramen: '<svg viewBox="0 0 32 32"><path d="M4 15h24c0 7-5 12-12 12S4 22 4 15z" fill="#7D4CC2"/><path d="M5 15c2-3 20-3 22 0z" fill="#F2D49A"/><path d="M9 14c2-2 4 1 6-1s4 1 6-1" stroke="#E0B45E" stroke-width="1.4" fill="none"/><circle cx="20" cy="13" r="2.4" fill="#FFF"/><circle cx="20" cy="13" r="1.1" fill="#F2B233"/><path d="M22 3l-6 11M26 4l-8 10" stroke="#8A6A4A" stroke-width="1.3"/></svg>',
  other: '<svg viewBox="0 0 32 32"><rect x="3" y="11" width="22" height="12" rx="2" fill="#F76B15"/><rect x="25" y="14" width="5" height="9" rx="1" fill="#F76B15"/><rect x="6" y="13" width="10" height="5" rx="1" fill="#FFF1E7"/><circle cx="9" cy="24" r="3" fill="#24180F"/><circle cx="24" cy="24" r="3" fill="#24180F"/><path d="M5 11l3-5h12l3 5" fill="#FFB27A"/></svg>',
};

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
