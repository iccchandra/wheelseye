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

  if (loading) return <div className="flex items-center justify-center h-screen text-sm text-slate-400">Loading shipment...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-sm text-slate-400">{error}</div>;
  if (!shipment) return null;

  const statusColor = shipment.status === 'DELIVERED' ? 'text-brand-700 bg-brand-50' : shipment.status === 'DELAYED' ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50';
  const statusDot = shipment.status === 'DELIVERED' ? 'bg-brand-700' : shipment.status === 'DELAYED' ? 'bg-red-600' : 'bg-emerald-600';
  const statusLabelMap: Record<string, string> = { IN_TRANSIT: 'In transit', DELIVERED: 'Delivered', DELAYED: 'Delayed', DISPATCHED: 'Dispatched' };
  const statusLabel = statusLabelMap[shipment.status] || shipment.status;

  const progressColor = shipment.status === 'DELIVERED' ? 'bg-brand-700' : shipment.status === 'DELAYED' ? 'bg-red-600' : 'bg-emerald-600';
  const progressFaded = shipment.status === 'DELIVERED' ? 'bg-brand-200' : shipment.status === 'DELAYED' ? 'bg-red-200' : 'bg-emerald-200';

  const milestones = [
    { label: `${shipment.origin} (Origin)`, sub: `Picked up · ${shipment.vehicle?.regNumber}`, time: shipment.actualPickup, done: true },
    ...(shipment.waypoints || []).map((w: any) => ({ label: w.label, sub: 'Checkpoint', time: null, done: false })),
    { label: `${shipment.destination} (Destination)`, sub: `Expected ${formatDateTime(shipment.estimatedDelivery)}`, time: shipment.actualDelivery, done: shipment.status === 'DELIVERED' },
  ];

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-brand-700 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white/25 flex items-center justify-center text-[10px] text-white font-medium">FT</div>
          <span className="text-white text-sm font-medium">FreightTrack</span>
        </div>
        <span className="text-white/75 text-[11px]">Secure tracking</span>
      </div>

      {/* Map */}
      <div id="pub-map" className="h-[200px] bg-slate-200" />

      {/* Status */}
      <div className="bg-white px-3.5 py-2.5 flex justify-between items-center border-b border-slate-100">
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${statusColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${statusDot} ${shipment.status !== 'DELIVERED' ? 'animate-pulse-dot' : ''}`} />
          <span className="text-xs font-medium">{statusLabel}</span>
        </div>
        <span className="text-[11px] text-slate-400">
          ETA {shipment.estimatedDelivery ? formatDateTime(shipment.estimatedDelivery) : '\u2014'}
        </span>
      </div>

      {/* Timeline */}
      <div className="bg-white p-3.5 mt-2">
        <div className="section-label mb-2.5">Shipment journey</div>
        {milestones.map((m, i) => (
          <div key={i} className={`flex gap-3 ${i < milestones.length - 1 ? 'pb-4' : ''}`}>
            <div className="flex flex-col items-center w-3.5">
              <div className={`w-3 h-3 rounded-full border-2 border-white shrink-0 ${m.done ? progressColor : 'bg-slate-300'}`} />
              {i < milestones.length - 1 && <div className={`w-[1.5px] flex-1 mt-0.5 ${m.done ? progressFaded : 'bg-slate-300'}`} />}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${m.done ? 'text-slate-800' : 'text-slate-400'}`}>{m.label}</div>
              <div className="text-[11px] text-slate-400 mt-px">{m.sub}</div>
              {m.time && <div className="text-[10px] text-slate-300 mt-0.5">{formatDateTime(m.time)}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Cargo info */}
      <div className="bg-white p-3.5 mt-2">
        <div className="section-label mb-2">Cargo details</div>
        {[
          ['Consignment', shipment.trackingNumber],
          ['Cargo', `${shipment.cargoDescription} · ${shipment.weightMT} MT`],
          ['Vehicle', shipment.vehicle?.regNumber || '\u2014'],
          ['Driver contact', shipment.driver?.phone || '\u2014'],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between text-[12.5px] mb-1.5">
            <span className="text-slate-400">{l}</span>
            <span className="font-medium text-slate-800">{v}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {shipment.podImageUrl && (
        <div className="p-3.5 bg-white mt-2">
          <a href={shipment.podImageUrl} target="_blank" rel="noreferrer"
            className="btn-primary w-full text-center block">
            View Proof of Delivery
          </a>
        </div>
      )}
    </div>
  );
};

function formatDateTime(d: string) {
  if (!d) return '\u2014';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
