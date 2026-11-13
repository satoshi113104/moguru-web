'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { configured } from '@/lib/supabase';
import { fetchOpenSessions, watchSessions } from '@/lib/data';
import { distanceM, distText, getPosition, TOKYO } from '@/lib/geo';
import { GENRES, genre } from '@/lib/genres';
import { foodPin } from '@/lib/pins';
import NotConfigured from './NotConfigured';
import { useToast } from './Toast';

// デモ用のサンプル店舗（URLに ?demo を付けたときだけ表示。実在のお店ではない）
const SAMPLES = [
  { name: 'スパイスカレー ソラ', genre: 'curry' },
  { name: 'クレープ ミルル', genre: 'sweets' },
  { name: 'グリルバーガー HOP', genre: 'burger' },
  { name: '煮干しラーメン 一灯', genre: 'ramen' },
];
function makeSamples(base) {
  const pool = [...SAMPLES].sort(() => Math.random() - 0.5).slice(0, 3);
  return pool.map((t, i) => {
    const d = 120 + Math.random() * 300, a = Math.random() * 2 * Math.PI;
    const lat = base.lat + (d * Math.cos(a)) / 111320;
    const lng = base.lng + (d * Math.sin(a)) / (111320 * Math.cos((base.lat * Math.PI) / 180));
    return { id: `demo-${i}`, demo: true, lat, lng, stores: { name: `${t.name}（サンプル）`, genre: t.genre, slug: null, photo_url: null } };
  });
}

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className="map" /> });

export default function NearView() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [geo, setGeo] = useState('busy'); // busy | ok | ng
  const [sessions, setSessions] = useState(null);
  const [radius, setRadius] = useState(500);
  const [g, setG] = useState('all');
  const [mode, setMode] = useState('map');
  const [err, setErr] = useState('');
  const [demo, setDemo] = useState(false);
  const [toastNode, toast] = useToast();

  const load = useCallback(async () => {
    try { setSessions(await fetchOpenSessions()); setErr(''); }
    catch { setErr('通信がうまくいきませんでした。電波のよい場所で開き直してください。'); setSessions((s) => s || []); }
  }, []);

  useEffect(() => {
    if (!configured) return;
    load();
    const stop = watchSessions(load);
    getPosition().then((p) => { setMe(p); setGeo('ok'); }, () => setGeo('ng'));
    return stop;
  }, [load]);

  useEffect(() => { setDemo(new URLSearchParams(window.location.search).has('demo')); }, []);

  const base = me || TOKYO;
  const samples = useMemo(() => (demo && geo !== 'busy' ? makeSamples(base) : []), [demo, geo, base.lat, base.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = (s) => (s.demo ? toast('サンプル表示です。実在のお店ではありません') : router.push(`/s/${s.stores.slug}`));
  const list = useMemo(() => [...(sessions || []), ...samples]
    .map((s) => ({ ...s, d: distanceM(base, s) }))
    .filter((s) => s.d <= radius && (g === 'all' || s.stores.genre === g))
    .sort((a, b) => a.d - b.d), [sessions, samples, base, radius, g]);

  if (!configured) return <NotConfigured />;

  const markers = list.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, title: s.stores.name, onClick: () => open(s), ...foodPin(s.stores) }));
  const loading = sessions === null || geo === 'busy';

  return (
    <div className="screen">
      <div className="nhead">
        <div className="nrow">
          <Link className="brand" href="/" style={{ fontFamily: 'var(--f-display)', fontWeight: 900, color: 'var(--orange)', textDecoration: 'none' }}>Moguru</Link>
          <h1>近くのキッチンカー</h1>
          <span className="count num">{loading ? '…' : `${list.length}件出店中`}</span>
        </div>
        <div className="sub">
          {geo === 'ng' ? '現在地がわからないため、東京駅のまわりを表示しています。' : `現在地から半径${radius >= 1000 ? radius / 1000 + 'km' : radius + 'm'}・いま出店中のお店`}
          {demo && '（サンプル店舗を表示中）'}
        </div>
        <div className="chips" role="group" aria-label="ジャンルで絞り込む">
          <button className="chip" aria-pressed={g === 'all'} onClick={() => setG('all')}>すべて</button>
          {Object.entries(GENRES).map(([k, v]) => (
            <button key={k} className="chip" aria-pressed={g === k} onClick={() => setG(k)}><i style={{ background: v.color }} />{v.short}</button>
          ))}
        </div>
        <div className="toggle" role="group" aria-label="表示の切り替え">
          <button aria-pressed={mode === 'map'} onClick={() => setMode('map')}>地図</button>
          <button aria-pressed={mode === 'list'} onClick={() => setMode('list')}>一覧</button>
        </div>
      </div>

      {mode === 'map' && !loading && (
        <MapView center={base} zoom={16} markers={markers} me={me} radius={radius} fitKey={`${radius}-${me ? 'me' : 'x'}`} />
      )}
      {mode === 'map' && loading && <div className="map" />}

      {mode === 'list' && (
        <div className="list">
          {list.map((s) => (
            <Link className="li" key={s.id} href={s.demo ? '#' : `/s/${s.stores.slug}`} onClick={(e) => { if (s.demo) { e.preventDefault(); open(s); } }}>
              <i style={{ background: genre(s.stores.genre).color }} />
              <span className="n">{s.stores.name}<small>{genre(s.stores.genre).short}</small></span>
              <span className="d num">{distText(s.d)}</span>
            </Link>
          ))}
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="empty" style={mode === 'map' ? { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 600, maxWidth: 520, margin: '0 auto' } : undefined}>
          <p className="note" style={{ background: 'var(--paper)' }}>{g === 'all' ? 'いま近くで出店中のお店はありません。' : 'このジャンルのお店は、いま近くに出店していません。'}</p>
          {radius < 5000 && <button className="btn ghost" onClick={() => setRadius(radius < 2000 ? 2000 : 5000)}>範囲を{radius < 2000 ? '2km' : '5km'}に広げる</button>}
        </div>
      )}
      {err && <p className="err" style={{ margin: 16 }}>{err}</p>}
      {toastNode}
    </div>
  );
}
