import { supabase } from './supabase';
import { todayJst } from './time';

export const STORE_COLS = 'id,slug,name,genre,brand_color,logo_url,photo_url,allergy_tags,instagram';

export async function fetchStoreBySlug(slug) {
  const { data, error } = await supabase.from('stores').select(STORE_COLS).eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}

// いま出店中のお店（終了していない・自動終了時刻前）
export async function fetchOpenSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select(`id,store_id,lat,lng,accuracy,area,end_label,started_at,updated_at,auto_close_at,stores(${STORE_COLS})`)
    .is('ended_at', null)
    .gt('auto_close_at', new Date().toISOString())
    .order('started_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  const seen = new Set();
  return (data || []).filter((s) => s.stores && !seen.has(s.store_id) && seen.add(s.store_id));
}

export async function fetchUpcoming(storeId, limit = 3) {
  const { data, error } = await supabase
    .from('schedules')
    .select('id,date,start_time,end_time,area,memo')
    .eq('store_id', storeId)
    .gte('date', todayJst())
    .order('date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function endedToday(storeId) {
  const since = new Date(`${todayJst()}T00:00:00+09:00`).toISOString();
  const { data } = await supabase.from('sessions').select('id').eq('store_id', storeId).gte('started_at', since).limit(1);
  return Boolean(data && data.length);
}

export function bump(slug, kind) {
  supabase.rpc('bump_view', { p_slug: slug, p_kind: kind }).then(() => {}, () => {});
}

// 出店の変化を購読（失敗しても30秒ごとの再読み込みで追いつく）
export function watchSessions(onChange) {
  const ch = supabase
    .channel('sessions-' + Math.random().toString(36).slice(2))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => onChange())
    .subscribe();
  const iv = setInterval(onChange, 30000);
  return () => { clearInterval(iv); supabase.removeChannel(ch); };
}
