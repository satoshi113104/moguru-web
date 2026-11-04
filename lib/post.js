import { genre } from './genres';

const tag = (s) => (s || '').replace(/[\s・、,.\-()（）「」]/g, '');

// 出店中の投稿文
export function livePost(store, { area, endLabel, url }) {
  const lines = ['【ただいま出店中】', store.name];
  if (area) lines.push(`場所：${area}`);
  if (endLabel) lines.push(`時間：〜${endLabel}`);
  if (store.allergy_tags?.length) lines.push(`${store.allergy_tags.join('・')}`);
  lines.push(`今いる場所はこちら → ${url}`);
  const tags = ['キッチンカー', tag(genre(store.genre).short), tag(area)].filter(Boolean);
  lines.push(tags.map((t) => '#' + t).join(' '));
  return lines.join('\n');
}

// 前日の予告投稿文
export function previewPost(store, s, url, dayLabel) {
  const lines = ['【明日の出店】', store.name, `場所：${s.area}`];
  if (s.start_time) lines.push(`時間：${s.start_time.slice(0, 5)}〜${s.end_time ? s.end_time.slice(0, 5) : ''}`);
  if (store.allergy_tags?.length) lines.push(store.allergy_tags.join('・'));
  lines.push(`当日の場所はこちら → ${url}`);
  return lines.join('\n');
}
