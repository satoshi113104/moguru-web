'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

/**
 * Leaflet + OpenStreetMap の地図。
 * markers: [{ id, lat, lng, html, size:[w,h], anchor:[x,y], z, onClick }]
 * me: { lat, lng } 現在地（青い丸）
 * radius: 現在地まわりの円（メートル）
 * fitKey: この値が変わったときだけ表示範囲を合わせ直す
 */
export default function LeafletMap({ center, zoom = 16, markers = [], me, radius, fitKey, className = 'map' }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const L = useRef(null);
  const latest = useRef({ markers, me, radius });
  const lastFit = useRef(null);
  latest.current = { markers, me, radius };

  useEffect(() => {
    let cancelled = false;
    import('leaflet').then((mod) => {
      if (cancelled || map.current) return;
      const Lf = mod.default || mod;
      L.current = Lf;
      map.current = Lf.map(el.current, { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], zoom);
      Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map.current);
      layer.current = Lf.layerGroup().addTo(map.current);
      draw();
    });
    return () => {
      cancelled = true;
      if (map.current) { map.current.remove(); map.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sig = JSON.stringify([markers.map((m) => [m.id, m.lat, m.lng, m.html]), me && [me.lat, me.lng], radius, fitKey]);
  useEffect(() => { draw(); }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps

  function draw() {
    const Lf = L.current, lg = layer.current, m = map.current;
    if (!Lf || !lg || !m) return;
    const { markers: ms, me: pos, radius: r } = latest.current;
    lg.clearLayers();
    const pts = [];
    if (pos && r) {
      Lf.circle([pos.lat, pos.lng], { radius: r, color: '#2F7BE0', weight: 1.5, dashArray: '5 6', fillColor: '#2F7BE0', fillOpacity: 0.05 }).addTo(lg);
    }
    ms.forEach((mk) => {
      const icon = Lf.divIcon({ className: '', html: mk.html, iconSize: mk.size, iconAnchor: mk.anchor });
      const marker = Lf.marker([mk.lat, mk.lng], { icon, zIndexOffset: mk.z || 0, keyboard: Boolean(mk.onClick), title: mk.title || '' }).addTo(lg);
      if (mk.onClick) marker.on('click', () => mk.onClick());
      pts.push([mk.lat, mk.lng]);
    });
    if (pos) {
      const icon = Lf.divIcon({ className: '', html: '<div class="pin-me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
      Lf.marker([pos.lat, pos.lng], { icon, interactive: false, zIndexOffset: -100 })
        .bindTooltip('現在地', { permanent: true, direction: 'bottom', offset: [0, 10], className: 'me-label' })
        .addTo(lg);
      pts.push([pos.lat, pos.lng]);
    }
    if (fitKey !== undefined && lastFit.current !== fitKey) {
      lastFit.current = fitKey;
      if (pos && r) {
        m.fitBounds(Lf.latLng(pos.lat, pos.lng).toBounds(r * 2.2), { animate: false });
      } else if (pts.length > 1) {
        m.fitBounds(pts, { padding: [70, 70], maxZoom: 17, animate: false });
      } else if (pts.length === 1) {
        m.setView(pts[0], zoom, { animate: false });
      }
    }
  }

  return <div className={className}><div ref={el} style={{ position: 'absolute', inset: 0 }} /></div>;
}
