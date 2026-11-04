'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { configured } from '@/lib/supabase';
import { fetchStoreBySlug, fetchOpenSessions, fetchUpcoming, endedToday, bump, watchSessions } from '@/lib/data';
import { distanceM, walkText, distText, routeUrl, getPosition, TOKYO } from '@/lib/geo';
import { todayJst, timeRange, dayLabel, clock } from '@/lib/time';
import { genre, esc } from '@/lib/genres';
import { bigPin, greyPin } from '@/lib/pins';
import NotConfigured from './NotConfigured';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className="map" /> });

function Logo({ store }) {
  if (store.logo_url) return <img className="logo" src={store.logo_url} alt={`${store.name}のロゴ`} />;
  return <span className="logo" style={{ background: store.brand_color }} aria-hidden="true">{store.name.slice(0, 1)}</span>;
}

export default function StoreView({ slug }) {
  const [store, setStore] = useState(undefined);
  const [sessions, setSessions] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [ended, setEnded] = useState(false);
  const [me, setMe] = useState(null);
  const [err, setErr] = useState('');

  const loadSessions = useCallback(async (st) => {
    try {
      const list = await fetchOpenSessions();
      setSessions(list);
      if (st && !list.some((s) => s.store_id === st.id)) setEnded(await endedToday(st.id));
    } catch { setErr('通信がうまくいきませんでした。電波のよい場所で開き直してください。'); }
  }, []);

  useEffect(() => {
    if (!configured) return;
    let stop = () => {};
    (async () => {
      try {
        const st = await fetchStoreBySlug(slug);
        setStore(st);
        if (!st) return;
        bump(slug, 'view');
        await loadSessions(st);
        setUpcoming(await fetchUpcoming(st.id));
        stop = watchSessions(() => loadSessions(st));
      } catch { setErr('通信がうまくいきませんでした。電波のよい場所で開き直してください。'); setStore(null); }
    })();
    getPosition().then(setMe, () => {});
    return () => stop();
  }, [slug, loadSessions]);

  const mine = useMemo(() => store && sessions.find((s) => s.store_id === store.id), [store, sessions]);
  const others = useMemo(() => {
    if (!store) return [];
    const base = mine || me;
    return sessions
      .filter((s) => s.store_id !== store.id)
      .map((s) => ({ ...s, d: base ? distanceM(base, s) : null }))
      .sort((a, b) => (a.d ?? 0) - (b.d ?? 0));
  }, [sessions, store, mine, me]);

  if (!configured) return <NotConfigured />;
  if (store === undefined) return <div className="screen"><div className="bar"><Link className="brand" href="/">Moguru</Link></div><div className="map" /></div>;
  if (store === null) {
    return (
      <div className="screen">
        <div className="bar"><Link className="brand" href="/">Moguru</Link></div>
        <div className="empty">
          <p className="note">{err || 'このページは見つかりませんでした。URLが正しいか、お店のプロフィールのリンクを確かめてください。'}</p>
          <Link className="btn ghost" href="/near">近くのキッチンカーを探す</Link>
        </div>
      </div>
    );
  }

  const g = genre(store.genre);
  const dist = mine && me ? distanceM(me, mine) : null;
  const showMe = me && (!mine || distanceM(me, mine) < 3000) ? me : null;
  const center = mine || me || TOKYO;
  const markers = [];
  if (mine) markers.push({ id: 'mine', lat: mine.lat, lng: mine.lng, title: store.name, ...bigPin(store) });
  others.slice(0, 30).forEach((s) => markers.push({ id: s.id, lat: s.lat, lng: s.lng, ...greyPin() }));

  const today = todayJst();
  const todaySch = upcoming.find((s) => s.date === today);
  const nextSch = upcoming.find((s) => s.date !== today) || null;

  return (
    <div className="screen">
      <div className="bar">
        <Link className="brand" href="/">Moguru</Link>
        <span className="noapp">アプリ不要・無料で見られます</span>
      </div>
      <MapView center={center} zoom={mine ? 16 : 14} markers={markers} me={showMe} fitKey={`${mine ? mine.id + mine.lat + mine.lng : 'none'}-${showMe ? 'me' : ''}`} />
      <div className="sheet">
        <div className="grab" />
        <div className="store">
          <Logo store={store} />
          <div className="t">
            <h1>{store.name}</h1>
            <div className="meta">
              <span>{g.name}</span>
              {mine && dist != null && <span><b className="num">{walkText(dist)}</b></span>}
              {mine && mine.end_label && <span className="num">〜{mine.end_label}</span>}
            </div>
          </div>
          <span className={`state ${mine ? 'open' : 'wait'}`}>{mine ? '営業中' : ended && !todaySch ? '本日終了' : '出店前'}</span>
        </div>
        {store.allergy_tags?.length > 0 && (
          <div className="tags">{store.allergy_tags.map((t) => <span className="tag-al" key={t}>{t}</span>)}</div>
        )}
        {mine ? (
          <>
            <a className="btn dark" style={{ background: store.brand_color }} href={routeUrl(mine.lat, mine.lng)} target="_blank" rel="noopener" onClick={() => bump(slug, 'route')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8z" /></svg>
              ルート案内
            </a>
            <p className="hint">{mine.area ? `${mine.area}・` : ''}{clock(mine.updated_at)}に位置を更新</p>
          </>
        ) : (
          <div className="note">
            {todaySch && !ended ? <>本日 <b className="num">{timeRange(todaySch)}</b> ・{todaySch.area}で出店予定です。<br /></>
              : ended ? <>本日の営業は終了しました。<br /></> : null}
            {(!todaySch || ended) && nextSch && <>次回：<b className="num">{dayLabel(nextSch.date)} {timeRange(nextSch)}</b> ・{nextSch.area}<br /></>}
            {!todaySch && !nextSch && <>出店予定はまだ登録されていません。<br /></>}
            出店が始まると、この地図にお店の今いる場所が表示されます。
          </div>
        )}
        {store.instagram && (
          <a className="hint" href={`https://www.instagram.com/${encodeURIComponent(store.instagram.replace(/^@/, ''))}/`} target="_blank" rel="noopener">Instagram：@{store.instagram.replace(/^@/, '')}</a>
        )}
        <div className="others">
          <div className="h"><span>近くの他のキッチンカー</span><Link href="/near">周辺をすべて見る</Link></div>
          {others.length === 0 && <span className="hint">いま近くで出店中のお店はありません</span>}
          {others.slice(0, 3).map((s) => (
            <div className="orow" key={s.id}><i /><span>{s.stores.name}</span><em>{genre(s.stores.genre).short}</em>{s.d != null && <span className="num">{distText(s.d)}</span>}</div>
          ))}
        </div>
        {err && <p className="err">{err}</p>}
      </div>
    </div>
  );
}
