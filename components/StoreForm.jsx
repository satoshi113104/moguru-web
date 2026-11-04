'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GENRES } from '@/lib/genres';

const COLORS = ['#F76B15', '#7C4B1E', '#D9534A', '#E0508F', '#12907A', '#2F7BE0', '#7D4CC2', '#24180F'];

// 画像を長辺800pxのJPEGに縮めてからアップロードする
async function shrink(file) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
}

async function upload(uid, kind, file) {
  const blob = await shrink(file);
  const path = `${uid}/${kind}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('store-images').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return supabase.storage.from('store-images').getPublicUrl(path).data.publicUrl;
}

export default function StoreForm({ uid, store, onSaved, toast }) {
  const isNew = !store;
  const [name, setName] = useState(store?.name || '');
  const [slug, setSlug] = useState(store?.slug || '');
  const [g, setG] = useState(store?.genre || 'tako');
  const [color, setColor] = useState(store?.brand_color || '#F76B15');
  const [tags, setTags] = useState((store?.allergy_tags || []).join('、'));
  const [ig, setIg] = useState(store?.instagram || '');
  const [logo, setLogo] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const logoPrev = logo ? URL.createObjectURL(logo) : store?.logo_url;
  const photoPrev = photo ? URL.createObjectURL(photo) : store?.photo_url;

  async function save(e) {
    e.preventDefault();
    setErr('');
    const s = slug.trim().toLowerCase();
    if (!name.trim()) return setErr('店名を入れてください。');
    if (!/^[a-z0-9-]{3,20}$/.test(s)) return setErr('URLの部分は、半角の英小文字・数字・ハイフンで3〜20文字にしてください。');
    setBusy(true);
    try {
      const row = {
        name: name.trim(), slug: s, genre: g, brand_color: color,
        allergy_tags: tags.split(/[、,，\n]/).map((t) => t.trim()).filter(Boolean).slice(0, 6),
        instagram: ig.trim().replace(/^@/, '') || null,
      };
      if (logo) row.logo_url = await upload(uid, 'logo', logo);
      if (photo) row.photo_url = await upload(uid, 'photo', photo);
      const q = isNew
        ? supabase.from('stores').insert({ ...row, owner_id: uid }).select().single()
        : supabase.from('stores').update(row).eq('id', store.id).select().single();
      const { data, error } = await q;
      if (error) {
        if (error.code === '23505') throw new Error('このURLはすでに使われています。別の文字にしてください。');
        throw error;
      }
      toast(isNew ? 'お店を登録しました' : '保存しました');
      onSaved(data);
    } catch (e2) {
      setErr(e2.message || '保存できませんでした。もう一度お試しください。');
    } finally { setBusy(false); }
  }

  return (
    <form className="card" onSubmit={save} noValidate>
      {isNew && <div className="big">お店の情報を登録</div>}
      <div className="field"><label htmlFor="sf-name">店名</label><input id="sf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="例：SHINTAKO" maxLength={40} /></div>
      <div className="field">
        <label htmlFor="sf-slug">お店の専用URL</label>
        <div className="prefix"><span>moguru…/s/</span><input id="sf-slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="shintako" autoCapitalize="none" autoCorrect="off" inputMode="url" /></div>
        <span className="hint">半角の英小文字・数字・ハイフンで3〜20文字。Instagramのプロフィールに貼るURLになります。</span>
      </div>
      <div className="field"><label htmlFor="sf-genre">ジャンル</label>
        <select id="sf-genre" value={g} onChange={(e) => setG(e.target.value)}>
          {Object.entries(GENRES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
        </select>
      </div>
      <div className="field"><span className="label">ピンの色</span>
        <div className="swatches" role="group" aria-label="ピンの色">
          {COLORS.map((c) => <button type="button" key={c} style={{ background: c }} aria-pressed={color === c} aria-label={c} onClick={() => setColor(c)} />)}
        </div>
      </div>
      <div className="field"><label htmlFor="sf-tags">アレルギー・食事の表示（任意）</label><input id="sf-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="例：小麦・卵・乳製品不使用" /><span className="hint">複数あるときは「、」で区切ってください。</span></div>
      <div className="field"><label htmlFor="sf-ig">Instagramのアカウント名（任意）</label><input id="sf-ig" value={ig} onChange={(e) => setIg(e.target.value)} placeholder="例：shintako2026" autoCapitalize="none" /></div>
      <div className="field"><span className="label">ロゴ（任意）</span>
        <div className="imgpick">{logoPrev ? <img className="prev round" src={logoPrev} alt="" /> : <span className="prev round" />}<label className="pick">画像を選ぶ<input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} /></label></div>
      </div>
      <div className="field"><span className="label">看板メニューの写真（任意）</span>
        <div className="imgpick">{photoPrev ? <img className="prev" src={photoPrev} alt="" /> : <span className="prev" />}<label className="pick">写真を選ぶ<input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} /></label></div>
        <span className="hint">周辺一覧の地図で、ピンの上に表示されます。</span>
      </div>
      {err && <p className="err">{err}</p>}
      <button className="btn primary" disabled={busy}>{busy ? '保存しています…' : isNew ? 'この内容で登録する' : '保存する'}</button>
    </form>
  );
}
