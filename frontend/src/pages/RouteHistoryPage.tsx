import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gpsApi, shipmentApi } from '../services/api';

export const RouteHistoryPage: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polyRef = useRef<L.Polyline | null>(null);
  const progressPolyRef = useRef<L.Polyline | null>(null);

  const [shipment, setShipment] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [playing, setPlaying] = useState(false);
  const [tick, setTick] = useState(0);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!shipmentId) return;
    Promise.all([
      shipmentApi.getOne(shipmentId),
      gpsApi.getRouteHistory(shipmentId),
    ]).then(([s, h]) => {
      setShipment(s.data);
      setHistory(h.data);
    });
  }, [shipmentId]);

  useEffect(() => {
    if (mapRef.current || !history.length) return;
    const first = history[0];
    mapRef.current = L.map('history-map').setView([first.lat, first.lng], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

    const coords: [number, number][] = history.map(h => [h.lat, h.lng]);
    polyRef.current = L.polyline(coords, { color: '#D3D1C7', weight: 3, dashArray: '6 4' }).addTo(mapRef.current);

    L.circleMarker([first.lat, first.lng], { radius: 8, color: '#3B6D11', fillColor: '#3B6D11', fillOpacity: 1 })
      .addTo(mapRef.current).bindTooltip('Origin');

    const last = history[history.length - 1];
    L.circleMarker([last.lat, last.lng], { radius: 8, color: '#185FA5', fillColor: '#185FA5', fillOpacity: 1 })
      .addTo(mapRef.current).bindTooltip('Destination');

    markerRef.current = L.marker([first.lat, first.lng], {
      icon: L.divIcon({ html: '<div style="background:#185FA5;color:#fff;border-radius:6px;padding:2px 5px;font-size:10px;font-weight:600">🚛</div>', iconAnchor: [16, 12] }),
    }).addTo(mapRef.current);
  }, [history]);

  useEffect(() => {
    if (!history.length || !markerRef.current || !mapRef.current) return;
    const point = history[Math.min(tick, history.length - 1)];
    markerRef.current.setLatLng([point.lat, point.lng]);
    const doneLine = history.slice(0, tick + 1).map(h => [h.lat, h.lng] as [number, number]);

    if (progressPolyRef.current) {
      progressPolyRef.current.setLatLngs(doneLine);
    } else {
      progressPolyRef.current = L.polyline(doneLine, { color: '#3B6D11', weight: 3 }).addTo(mapRef.current);
    }
  }, [tick, history]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setTick(t => {
          if (t >= history.length - 1) { setPlaying(false); return t; }
          return t + speed;
        });
      }, 200);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, speed, history.length]);

  const current = history[Math.min(tick, history.length - 1)];
  const progress = history.length ? Math.round((tick / (history.length - 1)) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ background: 'var(--bg-primary)', borderBottom: '0.5px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
          Route history — {shipment?.trackingNumber || '...'}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {shipment?.origin} → {shipment?.destination}
        </span>
      </div>

      <div id="history-map" style={{ flex: 1 }} />

      <div style={{ background: 'var(--bg-primary)', borderTop: '0.5px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="range" min={0} max={Math.max(0, history.length - 1)} value={tick} step={1}
          onChange={e => { setPlaying(false); setTick(+e.target.value); }}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
          <button
            onClick={() => setPlaying(p => !p)}
            style={{ width: 32, height: 32, borderRadius: 6, border: '0.5px solid var(--border)', background: playing ? '#185FA5' : 'var(--bg-secondary)', color: playing ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: 14 }}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500, minWidth: 120 }}>
            {current ? new Date(current.recordedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '—'}
          </span>
          <select value={speed} onChange={e => setSpeed(+e.target.value)} style={{ fontSize: 12, padding: '3px 6px', border: '0.5px solid var(--border)', borderRadius: 5, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
            <option value={1}>1x</option>
            <option value={3}>3x</option>
            <option value={10}>10x</option>
          </select>
          {current && <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }}>{current.speed?.toFixed(0) || 0} km/h · {progress}% complete</span>}
        </div>
      </div>
    </div>
  );
};
