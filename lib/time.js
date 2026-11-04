const TZ = 'Asia/Tokyo';

// 'YYYY-MM-DD'（日本時間）
export function todayJst(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 864e5);
  return d.toLocaleDateString('sv-SE', { timeZone: TZ });
}

export function hm(t) {
  return t ? t.slice(0, 5) : '';
}

export function timeRange(s) {
  if (!s) return '';
  if (s.start_time && s.end_time) return `${hm(s.start_time)}〜${hm(s.end_time)}`;
  if (s.start_time) return `${hm(s.start_time)}〜`;
  return '';
}

const W = '日月火水木金土';
export function dayLabel(date) {
  const wd = new Date(date + 'T12:00:00+09:00').getUTCDay();
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}（${W[wd]}）`;
}

// 予定日の時刻（日本時間）を Date に
export function jstDate(date, time) {
  return new Date(`${date}T${(time || '00:00').slice(0, 5)}:00+09:00`);
}

export function clock(iso) {
  return new Date(iso).toLocaleTimeString('ja-JP', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}
