'use client';

import { useEffect, useRef } from 'react';

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'DEMO_MAP_ID';

let loading = null;

// Googleマップの読み込み（1ページで1回だけ）。失敗・キー不正・8秒無応答なら reject
function loadGoogle() {
  if (typeof window === 'undefined') return Promise.reject(new Error('ssr'));
  if (window.google?.maps?.marker) return Promise.resolve(window.google.maps);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), 8000);
    window.__moguruGmapsReady = () => { clearTimeout(timer); resolve(window.google.maps); };
    window.gm_authFailure = () => {
      clearTimeout(timer);
      window.dispatchEvent(new Event('moguru-gmaps-failed'));
      reject(new Error('auth'));
    };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&v=weekly&libraries=marker&language=ja&region=JP&loading=async&callback=__moguruGmapsReady`;
    s.async = true;
    s.onerror = () => { clearTimeout(timer); reject(new Error('script')); };
    document.head.appendChild(s);
  });
  loading.catch(() => { loading = null; });
  return loading;
}

export const googleEnabled = Boolean(KEY);

/** LeafletMap と同じ使い方。読み込めなかったら onFail() を呼ぶ */
export default function GoogleMap({ center, zoom = 16, markers = [], me, radius, fitKey, className = 'map', onFail }) {
  const el = useRef(null);
  const map = useRef(null);
  const objs = useRef([]);
  const latest = useRef({ markers, me, radius });
  const lastFit = useRef(null);
  latest.current = { markers, me, radius };

  useEffect(() => {
    let cancelled = false;
    const fail = () => { if (!cancelled) onFail?.(); };
    window.addEventListener('moguru-gmaps-failed', fail);
    loadGoogle().then((gm) => {
      if (cancelled || map.current) return;
      map.current = new gm.Map(el.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom,
        mapId: MAP_ID,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: 'greedy',
      });
      draw();
    }, fail);
    return () => {
      cancelled = true;
      window.removeEventListener('moguru-gmaps-failed', fail);
      objs.current.forEach((o) => (o.setMap ? o.setMap(null) : (o.map = null)));
      objs.current = [];
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sig = JSON.stringify([markers.map((m) => [m.id, m.lat, m.lng, m.html]), me && [me.lat, me.lng], radius, fitKey]);
  useEffect(() => { draw(); }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps

  function draw() {
    const gm = window.google?.maps, m = map.current;
    if (!gm || !m) return;
    const { markers: ms, me: pos, radius: r } = latest.current;
    objs.current.forEach((o) => (o.setMap ? o.setMap(null) : (o.map = null)));
    objs.current = [];
    const bounds = new gm.LatLngBounds();
    let n = 0;
    let circle = null;

    if (pos && r) {
      circle = new gm.Circle({ map: m, center: pos, radius: r, strokeColor: '#2F7BE0', strokeWeight: 1.5, strokeOpacity: 0.7, fillColor: '#2F7BE0', fillOpacity: 0.05, clickable: false });
      objs.current.push(circle);
    }
    ms.forEach((mk) => {
      const div = document.createElement('div');
      div.innerHTML = mk.html;
      // LeafletのiconAnchor（下端からのずれ）をそろえる
      const [w, h] = mk.size || [0, 0];
      const [, ay] = mk.anchor || [w / 2, h];
      if (h && ay !== h) div.style.transform = `translateY(${h - ay}px)`;
      if (mk.onClick) { div.style.cursor = 'pointer'; div.addEventListener('click', () => mk.onClick()); }
      const marker = new gm.marker.AdvancedMarkerElement({ map: m, position: { lat: mk.lat, lng: mk.lng }, content: div, zIndex: mk.z || 0, title: mk.title || '' });
      objs.current.push(marker);
      bounds.extend({ lat: mk.lat, lng: mk.lng }); n++;
    });
    if (pos) {
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;flex-direction:column;align-items:center;transform:translateY(calc(50% - 9px))';
      div.innerHTML = '<div class="pin-me"></div><span style="margin-top:6px;background:#2F7BE0;color:#fff;font-size:11px;font-weight:700;padding:1px 7px;border-radius:6px">現在地</span>';
      objs.current.push(new gm.marker.AdvancedMarkerElement({ map: m, position: pos, content: div, zIndex: -100 }));
      bounds.extend(pos); n++;
    }
    if (fitKey !== undefined && lastFit.current !== fitKey) {
      lastFit.current = fitKey;
      if (circle) m.fitBounds(circle.getBounds(), 8);
      else if (n > 1) { m.fitBounds(bounds, 70); gm.event.addListenerOnce(m, 'idle', () => { if (m.getZoom() > 17) m.setZoom(17); }); }
      else if (n === 1) { m.setCenter(bounds.getCenter()); m.setZoom(zoom); }
    }
  }

  return <div className={className}><div ref={el} style={{ position: 'absolute', inset: 0 }} /></div>;
}
