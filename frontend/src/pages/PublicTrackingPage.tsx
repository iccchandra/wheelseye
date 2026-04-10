import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { shipmentApi } from '../services/api';
import { useGpsSocket } from '../hooks/useGpsSocket';
import { useGpsStore } from '../store/gpsStore';

export const PublicTrackingPage: React.FC = () => {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { positions } = useGpsStore();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useGpsSocket(shipment?.id);

  useEffect(() => {
    if (!trackingNumber) return;
    shipmentApi.getByTracking(trackingNumber)
      .then(r => setShipment(r.data))
      .catch(() => setError('Shipment not found'))
      .finally(() => setLoading(false));
  }, [trackingNumber]);

  // Create map once when shipment loads
  useEffect(() => {
    if (!shipment || mapRef.current) return;
    mapRef.current = L.map('pub-map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

    if (shipment.originLat && shipment.destinationLat) {
      L.polyline([
        [shipment.originLat, shipment.originLng],
        [shipment.destinationLat, shipment.destinationLng],
      ], { color: '#185FA5', dashArray: '6 4', weight: 2 }).addTo(mapRef.current);
    }

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [shipment]);

  // Update marker when position changes
  useEffect(() => {
    if (!shipment || !mapRef.current) return;
    const pos = positions[shipment.vehicleId];
    if (!pos) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([pos.lat, pos.lng]);
      markerRef.current.setPopupContent(`${shipment.vehicle?.regNumber} · ${pos.speed} km/h`);
    } else {
      markerRef.current = L.marker([pos.lat, pos.lng], {
        icon: L.divIcon({
          html: `<div style="background:#185FA5;color:#fff;border-radius:6px;padding:3px 6px;font-size:10px;font-weight:600;">🚛</div>`,
          iconAnchor: [16, 12],
        }),
      }).addTo(mapRef.current).bindPopup(`${shipment.vehicle?.regNumber} · ${pos.speed} km/h`);
      mapRef.current.setView([pos.lat, pos.lng], 7);
    }
  }, [shipment, positions]);

  if (loading) return <div style={styles.center}>Loading shipment...</div>;
  if (error) return <div style={styles.center}>{error}</div>;
  if (!shipment) return null;

  const statusColor = shipment.status === 'DELIVERED' ? '#185FA5' : shipment.status === 'DELAYED' ? '#A32D2D' : '#3B6D11';
  const statusLabel = { IN_TRANSIT: 'In transit', DELIVERED: 'Delivered', DELAYED: 'Delayed', DISPATCHED: 'Dispatched' }[shipment.status] || shipment.status;

  const milestones = [
    { label: `${shipment.origin} (Origin)`, sub: `Picked up · ${shipment.vehicle?.regNumber}`, time: shipment.actualPickup, done: true },
    ...(shipment.waypoints || []).map((w: any) => ({ label: w.label, sub: 'Checkpoint', time: null, done: false })),
    { label: `${shipment.destination} (Destination)`, sub: `Expected ${formatDateTime(shipment.estimatedDelivery)}`, time: shipment.actualDelivery, done: shipment.status === 'DELIVERED' },
  ];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ background: '#185FA5', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 4, background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 500 }}>FT</div>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>FreightTrack</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,.75)', fontSize: 11 }}>🔒 Secure tracking</span>
      </div>

      {/* Map */}
      <div id="pub-map" style={{ height: 200, background: '#DDE3EC' }} />

      {/* Status */}
      <div style={{ background: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: statusColor + '18', borderRadius: 99, padding: '4px 10px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block', animation: shipment.status !== 'DELIVERED' ? 'blink 1.2s infinite' : 'none' }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: statusColor }}>{statusLabel}</span>
        </div>
        <span style={{ fontSize: 11, color: '#888' }}>
          ETA {shipment.estimatedDelivery ? formatDateTime(shipment.estimatedDelivery) : '—'}
        </span>
      </div>

      {/* Timeline */}
      <div style={{ background: '#fff', padding: '14px', marginTop: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Shipment journey</div>
        {milestones.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < milestones.length - 1 ? 16 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: m.done ? statusColor : '#D3D1C7', border: '2px solid #fff', flexShrink: 0 }} />
              {i < milestones.length - 1 && <div style={{ width: 1.5, flex: 1, background: m.done ? statusColor + '44' : '#D3D1C7', marginTop: 2 }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: m.done ? '#2C2C2A' : '#B4B2A9' }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{m.sub}</div>
              {m.time && <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{formatDateTime(m.time)}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Cargo info */}
      <div style={{ background: '#fff', padding: 14, marginTop: 8, borderRadius: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Cargo details</div>
        {[
          ['Consignment', shipment.trackingNumber],
          ['Cargo', `${shipment.cargoDescription} · ${shipment.weightMT} MT`],
          ['Vehicle', shipment.vehicle?.regNumber || '—'],
          ['Driver contact', shipment.driver?.phone || '—'],
        ].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
            <span style={{ color: '#888' }}>{l}</span>
            <span style={{ fontWeight: 500, color: '#2C2C2A' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {shipment.podImageUrl && (
        <div style={{ padding: 14, background: '#fff', marginTop: 8 }}>
          <a href={shipment.podImageUrl} target="_blank" rel="noreferrer"
            style={{ display: 'block', textAlign: 'center', padding: 9, background: '#185FA5', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            View Proof of Delivery
          </a>
        </div>
      )}

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
};

const styles = {
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 14, color: '#888' } as React.CSSProperties,
};

function formatDateTime(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
