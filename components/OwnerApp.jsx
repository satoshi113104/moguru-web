'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase, configured, siteUrl } from '@/lib/supabase';
import { getPosition } from '@/lib/geo';
import { todayJst, timeRange, dayLabel, jstDate, clock, hm } from '@/lib/time';
import { livePost, previewPost } from '@/lib/post';
import { copyText, shareText } from '@/lib/clip';
import { ownerPin } from '@/lib/pins';
import { useToast } from './Toast';
import StoreForm from './StoreForm';
import NotConfigured from './NotConfigured';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className="map-mini" style={{ background: '#EEF0E6' }} /> });

const Icon = {
  home: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></svg>,
  start: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  add: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M12 14v5M9.5 16.5h5" /></svg>,
  set: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>,
  check: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>,
};

/* ---------- ログイン ---------- */
function Auth({ toast }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!email || pw.length < 8) return setErr('メールアドレスと、8文字以上のパスワードを入れてください。');
    setBusy(true);
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/owner` } });
      if (error) setErr(error.message.includes('registered') ? 'このメールアドレスはすでに登録されています。ログインしてください。' : '登録できませんでした。入力を確かめてください。');
      else if (!data.session) setMsg('確認メールを送りました。メールのリンクを開いてから、ここでログインしてください。');
      else toast('登録しました');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) setErr('メールアドレスかパスワードが違います。');
    }
    setBusy(false);
  }

  return (
    <form className="auth" onSubmit={submit} noValidate>
      <img src="/icon-192.png" alt="" width="64" height="64" style={{ borderRadius: 16 }} />
      <h1>{mode === 'login' ? 'オーナーログイン' : 'オーナー登録'}</h1>
      <p>キッチンカーのオーナー向けの画面です。お客さんは登録しなくても、お店のURLから場所を見られます。</p>
      <div className="field"><label htmlFor="a-email">メールアドレス</label><input id="a-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="field"><label htmlFor="a-pw">パスワード（8文字以上）</label><input id="a-pw" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      {err && <p className="err">{err}</p>}
      {msg && <p className="note">{msg}</p>}
      <button className="btn primary" disabled={busy}>{busy ? '送信しています…' : mode === 'login' ? 'ログイン' : '登録する'}</button>
      <button type="button" className="linkbtn" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); setMsg(''); }}>
        {mode === 'login' ? 'はじめての方はこちら（オーナー登録）' : 'すでに登録済みの方はこちら（ログイン）'}
      </button>
    </form>
  );
}

/* ---------- 専用URL ---------- */
function UrlCard({ url, toast }) {
  return (
    <div className="card">
      <span className="lbl">あなたの専用URL</span>
      <div className="urlcard">
        <code>{url.replace(/^https?:\/\//, '')}</code>
        <button className="cbtn" onClick={async () => toast((await copyText(url)) ? 'URLをコピーしました' : 'コピーできませんでした。URLを長押しして選んでください')}>{Icon.copy}コピー</button>
      </div>
      <span className="hint">Instagramのプロフィールや、自分で投稿するときの本文に貼ってください。開いた人には、いつでも今日の場所が表示されます。</span>
    </div>
  );
}

/* ---------- ホーム ---------- */
function Home({ store, session, schedules, views, go, reload, toast, url }) {
  const today = todayJst(), tomorrow = todayJst(1);
  const todaySch = schedules.find((s) => s.date === today);
  const tomorrowSch = schedules.find((s) => s.date === tomorrow);
  const [delId, setDelId] = useState(null);

  async function del(id) {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) toast('削除できませんでした'); else { toast('予定を削除しました'); reload(); }
    setDelId(null);
  }

  return (
    <>
      <div className="card">
        {session ? (
          <>
            <span className="live"><i />LIVE 出店中</span>
            <div className="big">{session.area || '出店中'}</div>
            <div className="hint num">{clock(session.started_at)}から公開中{session.end_label ? `・〜${session.end_label}` : ''}</div>
            <div className="stats">
              <div className="stat"><b className="num">{views?.views ?? 0}</b><span>今日のページ閲覧</span></div>
              <div className="stat"><b className="num">{views?.route_taps ?? 0}</b><span>ルート案内のタップ</span></div>
            </div>
            <button className="btn ghost" onClick={() => go('start')}>出店中の画面へ</button>
          </>
        ) : (
          <>
            <span className="lbl">今日の予定</span>
            {todaySch ? <><div className="big">{todaySch.area}</div><div className="hint num">{timeRange(todaySch) || '時間未定'}</div></>
              : <div className="hint">今日の予定はありません。予定がなくても出店を始められます。</div>}
            <button className="btn primary" onClick={() => go('start')}>出店の準備をする</button>
          </>
        )}
      </div>

      <span className="lbl">これからの出店予定</span>
      {schedules.length === 0 && <p className="hint">まだ予定がありません。「予定登録」から追加できます。</p>}
      {schedules.map((s) => (
        <div className="sch" key={s.id}>
          <div className="dd num">{dayLabel(s.date)}</div>
          <div className="x">{s.area}<small className="num">{timeRange(s) || '時間未定'}</small></div>
          {s.date === today && <span className={`pill ${session ? 'live2' : 'today'}`}>{session ? '出店中' : '今日'}</span>}
          {delId === s.id
            ? <button className="del" style={{ color: 'var(--red)', fontWeight: 700 }} onClick={() => del(s.id)}>削除する</button>
            : <button className="del" onClick={() => setDelId(s.id)} aria-label={`${dayLabel(s.date)}の予定を削除`}>削除</button>}
        </div>
      ))}
      <button className="btn ghost" onClick={() => go('add')}>＋ 出店予定を追加</button>

      {tomorrowSch && (
        <div className="card">
          <span className="lbl">明日の予告投稿</span>
          <p className="hint">前日の夜に投稿すると、フォロワーが予定を立てやすくなります。</p>
          <div className="row2">
            <button className="btn ghost" onClick={async () => toast((await copyText(previewPost(store, tomorrowSch, url))) ? '予告文をコピーしました' : 'コピーできませんでした')}>予告文をコピー</button>
            <button className="btn ghost" onClick={async () => { const r = await shareText(previewPost(store, tomorrowSch, url)); if (r === 'copied') toast('予告文をコピーしました'); }}>SNSアプリで共有</button>
          </div>
        </div>
      )}

      <UrlCard url={url} toast={toast} />
    </>
  );
}

/* ---------- 出店 ---------- */
function Start({ store, session, schedules, reload, toast, url }) {
  const today = todayJst();
  const todaySch = schedules.find((s) => s.date === today);
  const [pos, setPos] = useState(null);
  const [gps, setGps] = useState('idle'); // idle | busy | ok | ng
  const [area, setArea] = useState(todaySch?.area || '');
  const [end, setEnd] = useState(todaySch?.end_time ? hm(todaySch.end_time) : '');
  const [busy, setBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [post, setPost] = useState('');

  const acquire = useCallback(async () => {
    setGps('busy');
    try { const p = await getPosition({ timeout: 15000 }); setPos(p); setGps('ok'); return p; }
    catch { setGps('ng'); return null; }
  }, []);

  useEffect(() => { if (!session) acquire(); }, [session, acquire]);
  useEffect(() => { if (session) setPost(livePost(store, { area: session.area, endLabel: session.end_label, url })); }, [session, store, url]);

  async function start() {
    const p = pos || (await acquire());
    if (!p) return;
    setBusy(true);
    let close = new Date(Date.now() + 8 * 3600e3);
    if (end) {
      const planned = new Date(jstDate(today, end).getTime() + 2 * 3600e3);
      if (planned > new Date()) close = planned;
    }
    const { error } = await supabase.from('sessions').insert({
      store_id: store.id, schedule_id: todaySch?.id || null,
      lat: p.lat, lng: p.lng, accuracy: p.accuracy,
      area: area.trim() || null, end_label: end || null,
      auto_close_at: close.toISOString(),
    });
    setBusy(false);
    if (error) return toast('出店を開始できませんでした。電波のよい場所でもう一度押してください。');
    toast('出店を開始しました。地図に公開されています');
    reload();
  }

  async function relocate() {
    const p = await acquire();
    if (!p) return toast('位置を取得できませんでした');
    const { error } = await supabase.from('sessions').update({ lat: p.lat, lng: p.lng, accuracy: p.accuracy, updated_at: new Date().toISOString() }).eq('id', session.id);
    if (error) toast('更新できませんでした。もう一度お試しください。'); else { toast('位置を更新しました。地図にも反映されています'); reload(); }
  }

  async function finish() {
    const { error } = await supabase.from('sessions').update({ ended_at: new Date().toISOString() }).eq('id', session.id);
    setConfirmEnd(false);
    if (error) toast('終了できませんでした。もう一度お試しください。'); else { toast('出店を終了しました。おつかれさまでした'); reload(); }
  }

  const mapPos = session ? { lat: session.lat, lng: session.lng } : pos;

  return session ? (
    <>
      <div className="card">
        <span className="live"><i />LIVE 出店中</span>
        <div className="ok">{Icon.check}地図に公開しました（{clock(session.updated_at)}更新）</div>
        <MapView className="map-mini" center={mapPos} zoom={17} markers={[{ id: 'me', ...mapPos, ...ownerPin() }]} fitKey={`${mapPos.lat},${mapPos.lng}`} />
        {gps === 'busy' && <div className="gps busy"><span className="spin" />現在地を取得しています…</div>}
        <div className="row2">
          <button className="btn ghost" onClick={relocate} disabled={gps === 'busy'}>位置を再取得</button>
          <button className="btn danger" onClick={() => setConfirmEnd(true)}>出店を終了</button>
        </div>
        {confirmEnd && (
          <div className="confirm">出店を終了すると、地図からお店のピンが消えます。
            <div className="row2"><button className="btn ghost" onClick={() => setConfirmEnd(false)}>続ける</button><button className="btn primary" onClick={finish}>終了する</button></div>
          </div>
        )}
        <Link className="btn ghost" href={`/s/${store.slug}`} target="_blank">お客さんの画面で確かめる</Link>
      </div>
      <UrlCard url={url} toast={toast} />
      <div className="card">
        <span className="lbl">投稿用の文章</span>
        <div className="field"><label htmlFor="post" className="hint">自由に直してからコピーできます</label><textarea id="post" value={post} onChange={(e) => setPost(e.target.value)} /></div>
        <div className="row2">
          <button className="btn ghost" onClick={async () => toast((await copyText(post)) ? '文章をコピーしました' : 'コピーできませんでした')}>文章をコピー</button>
          <button className="btn ghost" onClick={async () => { const r = await shareText(post); if (r === 'copied') toast('文章をコピーしました。SNSアプリに貼り付けてください'); }}>SNSアプリで共有</button>
        </div>
        <span className="hint">β版では、InstagramやXへの自動投稿はまだありません。この文章を使って投稿してください。</span>
      </div>
    </>
  ) : (
    <>
      <div className="card">
        <span className="lbl">現在地（GPS）</span>
        {pos ? <MapView className="map-mini" center={pos} zoom={17} markers={[{ id: 'me', ...pos, ...ownerPin() }]} fitKey={`${pos.lat},${pos.lng}`} /> : <div className="map-mini" style={{ background: '#EEF0E6' }} />}
        {gps === 'busy' && <div className="gps busy"><span className="spin" />現在地を取得しています…</div>}
        {gps === 'ok' && pos && <div className="gps ok">{Icon.check}取得できました（精度 ±{pos.accuracy}m）</div>}
        {gps === 'ng' && <div className="gps ng">現在地を取得できませんでした。スマホの位置情報をオンにし、ブラウザに位置情報の利用を許可してから「位置を再取得」を押してください。</div>}
        <button className="btn ghost" onClick={acquire} disabled={gps === 'busy'}>位置を再取得</button>
      </div>
      <div className="card">
        <div className="field"><label htmlFor="st-area">エリア名（任意）</label><input id="st-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="例：代々木公園" maxLength={60} /></div>
        <div className="field"><label htmlFor="st-end">終了予定（任意）</label><input id="st-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} /><span className="hint">終了を押し忘れても、この時刻の2時間後に地図から自動で外れます（未入力なら8時間後）。</span></div>
      </div>
      <button className="btn primary" onClick={start} disabled={busy || gps === 'busy' || !pos}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4l14 8-14 8z" /></svg>
        {busy ? '公開しています…' : '出店を開始する'}
      </button>
      <p className="hint" style={{ textAlign: 'center', margin: 0 }}>押すと、この場所がお客さんの地図に公開されます</p>
    </>
  );
}

/* ---------- 予定登録 ---------- */
function AddSchedule({ store, reload, go, toast }) {
  const [date, setDate] = useState(todayJst(1));
  const [s, setS] = useState('11:00');
  const [e, setE] = useState('15:00');
  const [area, setArea] = useState('');
  const [memo, setMemo] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(ev) {
    ev.preventDefault();
    if (!date || !area.trim()) return setErr('出店日とエリア名を入れてください。');
    setBusy(true);
    const { error } = await supabase.from('schedules').insert({ store_id: store.id, date, start_time: s || null, end_time: e || null, area: area.trim(), memo: memo.trim() || null });
    setBusy(false);
    if (error) return setErr('登録できませんでした。もう一度お試しください。');
    toast('予定を登録しました'); reload(); go('home');
  }

  return (
    <form className="card" onSubmit={save} noValidate>
      <div className="field"><label htmlFor="sc-date">出店日</label><input id="sc-date" type="date" value={date} min={todayJst()} onChange={(ev) => setDate(ev.target.value)} /></div>
      <div className="field"><label htmlFor="sc-s">営業時間</label><div className="two"><input id="sc-s" type="time" value={s} onChange={(ev) => setS(ev.target.value)} /><span>〜</span><input aria-label="終了時刻" type="time" value={e} onChange={(ev) => setE(ev.target.value)} /></div></div>
      <div className="field"><label htmlFor="sc-area">エリア名</label><input id="sc-area" value={area} onChange={(ev) => setArea(ev.target.value)} placeholder="例：代々木公園" maxLength={60} /><span className="hint">住所はいりません。正確な場所は、当日「出店開始」を押したときにGPSで取得します。</span></div>
      <div className="field"><label htmlFor="sc-memo">メモ（任意・自分用）</label><input id="sc-memo" value={memo} onChange={(ev) => setMemo(ev.target.value)} placeholder="例：噴水の近く" /></div>
      {err && <p className="err">{err}</p>}
      <button className="btn primary" disabled={busy}>{busy ? '登録しています…' : 'この内容で登録する'}</button>
    </form>
  );
}

/* ---------- 全体 ---------- */
export default function OwnerApp() {
  const [toastNode, toast] = useToast();
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(undefined);
  const [session, setSession] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [views, setViews] = useState(null);
  const [tab, setTab] = useState('home');

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user || null); setAuthReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const reload = useCallback(async () => {
    if (!user) return;
    const { data: st } = await supabase.from('stores').select('*').eq('owner_id', user.id).maybeSingle();
    setStore(st || null);
    if (!st) return;
    const [ses, sch, pv] = await Promise.all([
      supabase.from('sessions').select('*').eq('store_id', st.id).is('ended_at', null).gt('auto_close_at', new Date().toISOString()).order('started_at', { ascending: false }).limit(1),
      supabase.from('schedules').select('*').eq('store_id', st.id).gte('date', todayJst()).order('date').order('start_time').limit(20),
      supabase.from('page_views').select('views,route_taps').eq('store_id', st.id).eq('day', todayJst()).maybeSingle(),
    ]);
    setSession(ses.data?.[0] || null);
    setSchedules(sch.data || []);
    setViews(pv.data || null);
  }, [user]);

  useEffect(() => { if (user) reload(); else setStore(undefined); }, [user, reload]);
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(reload, 60000);
    return () => clearInterval(iv);
  }, [user, reload]);

  if (!configured) return <NotConfigured />;
  if (!authReady) return <div className="screen" />;
  if (!user) return <div className="screen">{toastNode}<Auth toast={toast} /></div>;
  if (store === undefined) return <div className="screen"><div className="ohead"><span className="ph" /><div><h1>読み込み中…</h1></div></div></div>;

  const url = store ? `${siteUrl()}/s/${store.slug}` : '';
  const go = (t) => { setTab(t); };

  if (store === null) {
    return (
      <div className="screen">
        <div className="ohead"><span className="ph" /><div><h1>ようこそ</h1><p>Moguru オーナー</p></div></div>
        <div className="obody">
          <StoreForm uid={user.id} store={null} toast={toast} onSaved={(s) => { setStore(s); reload(); }} />
        </div>
        {toastNode}
      </div>
    );
  }

  const TABS = [['home', 'ホーム', Icon.home], ['start', '出店', Icon.start], ['add', '予定登録', Icon.add], ['settings', '設定', Icon.set]];

  return (
    <div className="screen">
      <div className="ohead">
        {store.logo_url ? <img src={store.logo_url} alt="" /> : <span className="ph" />}
        <div><h1>{store.name}</h1><p>Moguru オーナー{session ? '・出店中' : ''}</p></div>
      </div>
      <div className="obody">
        {tab === 'home' && <Home store={store} session={session} schedules={schedules} views={views} go={go} reload={reload} toast={toast} url={url} />}
        {tab === 'start' && <Start store={store} session={session} schedules={schedules} reload={reload} toast={toast} url={url} />}
        {tab === 'add' && <AddSchedule store={store} reload={reload} go={go} toast={toast} />}
        {tab === 'settings' && (
          <>
            <StoreForm uid={user.id} store={store} toast={toast} onSaved={(s) => setStore(s)} />
            <Link className="btn ghost" href={`/s/${store.slug}`} target="_blank">お客さんの画面を見る</Link>
            <button className="btn ghost" onClick={() => supabase.auth.signOut()}>ログアウト</button>
            <p className="hint">ホーム画面に追加すると、アプリのようにアイコンから開けます（Chromeのメニュー →「ホーム画面に追加」）。</p>
          </>
        )}
      </div>
      <nav className="tabbar" aria-label="オーナーメニュー">
        {TABS.map(([k, label, ic]) => (
          <button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}>{ic}{label}</button>
        ))}
      </nav>
      {toastNode}
    </div>
  );
}
