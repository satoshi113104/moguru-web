import { esc, genre, ICON } from './genres';

const initial = (name) => esc((name || '?').trim().slice(0, 1));

// SNS経由で開いたお店：大きいピン＋光輪＋「★ここ」
export function bigPin(store) {
  const c = esc(store.brand_color || '#F76B15');
  const inner = store.logo_url ? `<img src="${esc(store.logo_url)}" alt="">` : `<b>${initial(store.name)}</b>`;
  return {
    html: `<div class="pin-lg"><span class="koko">★ここ</span><div style="position:relative"><span class="halo" style="background:${c}33"></span><div class="dot" style="background:${c}">${inner}</div></div></div>`,
    size: [100, 100], anchor: [50, 100], z: 1000,
  };
}

// SNS経由のときの他店：小さいグレー
export function greyPin() {
  return { html: '<div class="pin-sm"></div>', size: [18, 18], anchor: [9, 20], z: 0 };
}

// 周辺一覧：料理写真（なければジャンルのイラスト）＋店名
export function foodPin(store) {
  const g = genre(store.genre);
  const inner = store.photo_url ? `<img src="${esc(store.photo_url)}" alt="">` : ICON[store.genre] || ICON.other;
  return {
    html: `<div class="pin-food">${store.sample ? '<span style="font-size:9.5px;font-weight:700;color:#6E6259;background:#fff;border:1px dashed #A39890;padding:0 6px;border-radius:6px;margin-bottom:2px">サンプル</span>' : ''}<span class="nm" style="background:${g.color}">${esc(store.name)}</span><span class="ph" style="border-color:${g.color}">${inner}</span><span class="tail" style="border-top-color:${g.color}"></span></div>`,
    size: [130, store.sample ? 98 : 80], anchor: [65, store.sample ? 98 : 80], z: 10,
  };
}

export function ownerPin() {
  return { html: '<div class="pin-owner"></div>', size: [26, 26], anchor: [13, 30], z: 10 };
}
