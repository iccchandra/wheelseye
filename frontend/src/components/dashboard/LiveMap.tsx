import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGpsStore } from '../../store/gpsStore';

interface Props {
  shipments: any[];
  vehicles?: any[];
  selectedId?: string;
  onSelectShipment: (s: any) => void;
  onSelectVehicle?: (v: any) => void;
  geofences?: any[];
  historyPath?: Array<{ lat: number; lng: number }>;
  tab: 'live' | 'history' | 'geo';
}

const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  IN_TRANSIT:  { color: '#10b981', bg: '#ecfdf5', label: 'In Transit' },
  DISPATCHED:  { color: '#f59e0b', bg: '#fffbeb', label: 'Dispatched' },
  DELAYED:     { color: '#ef4444', bg: '#fef2f2', label: 'Delayed' },
  DELIVERED:   { color: '#3b82f6', bg: '#eff6ff', label: 'Delivered' },
  ON_TRIP:     { color: '#3b82f6', bg: '#eff6ff', label: 'On Trip' },
  AVAILABLE:   { color: '#10b981', bg: '#ecfdf5', label: 'Available' },
  MAINTENANCE: { color: '#f59e0b', bg: '#fffbeb', label: 'Maintenance' },
  INACTIVE:    { color: '#94a3b8', bg: '#f1f5f9', label: 'Inactive' },
};

function truckIcon(color: string, regNo: string, selected: boolean, speed: number) {
  const moving = speed > 0;
  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.18))">
        <div style="
          background:${selected ? color : '#fff'};
          border:2.5px solid ${color};
          border-radius:10px;
          padding:3px 7px 3px 5px;
          font-size:10px;
          font-weight:700;
          color:${selected ? '#fff' : color};
          white-space:nowrap;
          display:flex;
          align-items:center;
          gap:4px;
          font-family:Inter,system-ui,sans-serif;
          ${selected ? `box-shadow:0 0 0 3px ${color}44;` : ''}
        ">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${selected ? '#fff' : color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.684-.949V8a1 1 0 0 0-1-1h-1"/>
            <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
          </svg>
          ${regNo}
          ${moving ? `<span style="width:5px;height:5px;border-radius:50%;background:#10b981;display:inline-block;animation:blink 1.5s infinite"></span>` : ''}
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color};margin-top:-1px"></div>
      </div>
    `,
    iconAnchor: [36, 42],
    popupAnchor: [0, -42],
  });
}

function vehiclePopup(v: any, sc: any) {
  const speedColor = v.lastSpeed > 60 ? '#ef4444' : v.lastSpeed > 0 ? '#10b981' : '#94a3b8';
  const ping = v.lastPingAt ? new Date(v.lastPingAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'No data';
  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:220px;padding:2px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:36px;height:36px;border-radius:10px;background:${sc.bg};display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${sc.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.684-.949V8a1 1 0 0 0-1-1h-1"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
          </svg>
        </div>
        <div style="flex:1">
          <div style="font-weight:800;font-size:14px;color:#0f172a">${v.regNumber}</div>
          <div style="font-size:10px;color:#64748b">${v.make || ''} ${v.model || ''} · ${v.type || ''}</div>
        </div>
        <div style="padding:3px 8px;border-radius:16px;font-size:9px;font-weight:700;background:${sc.bg};color:${sc.color}">${sc.label}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
        <div style="background:#f8fafc;border-radius:8px;padding:6px 8px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:${speedColor};font-family:monospace">${v.lastSpeed ?? 0}</div>
          <div style="font-size:8px;color:#94a3b8;font-weight:600;text-transform:uppercase">km/h</div>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:6px 8px;text-align:center">
          <div style="font-size:12px;font-weight:700;color:#0f172a">${v.capacityMT || 0} MT</div>
          <div style="font-size:8px;color:#94a3b8;font-weight:600;text-transform:uppercase">${v.type || 'N/A'}</div>
        </div>
      </div>
      <div style="border-top:1px solid #f1f5f9;padding-top:6px;font-size:10px;display:flex;flex-direction:column;gap:3px">
        <div style="display:flex;justify-content:space-between"><span style="color:#94a3b8">Owner</span><span style="font-weight:600;color:#334155">${v.ownerName || '—'}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:#94a3b8">Last Ping</span><span style="font-weight:600;color:#334155">${ping}</span></div>
      </div>
    </div>
  `;
}

export const LiveMap: React.FC<Props> = ({ shipments, vehicles = [], selectedId, onSelectShipment, onSelectVehicle, geofences = [], historyPath = [], tab }) => {
  const mapRef         = useRef<L.Map | null>(null);
  const markersRef     = useRef<Record<string, L.Marker>>({});
  const geofenceRef    = useRef<L.Layer[]>([]);
  const historyRef     = useRef<L.Layer[]>([]);
  const { positions }  = useGpsStore();

  useEffect(() => {
    if (mapRef.current) return;
    mapRef.current = L.map('live-map', { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapRef.current);
  }, []);

  // Vehicle/shipment markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const showMarkers = tab !== 'history';
    const allItems: Array<{ id: string; vehicleId: string; lat: number; lng: number; regNo: string; status: string; speed: number; data: any; isShipment: boolean }> = [];

    // From shipments
    shipments.forEach(s => {
      const pos = positions[s.vehicleId];
      const lat = pos?.lat ?? s.vehicle?.currentLat;
      const lng = pos?.lng ?? s.vehicle?.currentLng;
      if (!lat || !lng) return;
      allItems.push({
        id: s.vehicleId || s.id,
        vehicleId: s.vehicleId,
        lat, lng,
        regNo: s.vehicle?.regNumber?.split(' ').slice(-2).join(' ') || '??',
        status: s.status,
        speed: pos?.speed ?? s.vehicle?.lastSpeed ?? 0,
        data: { ...s.vehicle, regNumber: s.vehicle?.regNumber, make: s.vehicle?.make, model: s.vehicle?.model, type: s.vehicle?.type, ownerName: s.vehicle?.ownerName, lastSpeed: pos?.speed ?? s.vehicle?.lastSpeed, lastPingAt: pos?.timestamp ?? s.vehicle?.lastPingAt, capacityMT: s.vehicle?.capacityMT, status: s.status },
        isShipment: true,
      });
    });

    // From standalone vehicles (not already in shipments)
    vehicles.forEach(v => {
      if (!v.currentLat || !v.currentLng) return;
      if (allItems.find(i => i.vehicleId === v.id)) return; // skip if already from shipment
      allItems.push({
        id: v.id,
        vehicleId: v.id,
        lat: v.currentLat, lng: v.currentLng,
        regNo: v.regNumber?.split(' ').slice(-2).join(' ') || '??',
        status: v.status,
        speed: v.lastSpeed ?? 0,
        data: v,
        isShipment: false,
      });
    });

    allItems.forEach(item => {
      const sc = STATUS_COLORS[item.status] || STATUS_COLORS.INACTIVE;
      const selected = item.id === selectedId || item.vehicleId === selectedId;
      const icon = truckIcon(sc.color, item.regNo, selected, item.speed);

      if (markersRef.current[item.id]) {
        markersRef.current[item.id].setLatLng([item.lat, item.lng]).setIcon(icon);
        if (showMarkers) markersRef.current[item.id].addTo(map);
        else markersRef.current[item.id].remove();
      } else {
        const marker = L.marker([item.lat, item.lng], { icon })
          .on('click', () => {
            if (item.isShipment) {
              const s = shipments.find(sh => sh.vehicleId === item.vehicleId);
              if (s) onSelectShipment(s);
            } else if (onSelectVehicle) {
              onSelectVehicle(item.data);
            }
            marker.openPopup();
          })
          .bindPopup(vehiclePopup(item.data, sc), { maxWidth: 260, className: 'vehicle-popup' });
        if (showMarkers) marker.addTo(map);
        markersRef.current[item.id] = marker;
      }
    });

    // Remove stale
    const activeIds = new Set(allItems.map(i => i.id));
    Object.keys(markersRef.current).filter(id => !activeIds.has(id)).forEach(id => {
      markersRef.current[id].remove();
      delete markersRef.current[id];
    });
  }, [shipments, vehicles, positions, selectedId, tab]);

  // Geofence zones
  useEffect(() => {
    if (!mapRef.current) return;
    geofenceRef.current.forEach(l => l.remove());
    geofenceRef.current = [];
    if (tab !== 'geo') return;

    geofences.forEach(zone => {
      const color = zone.zoneType === 'restricted' ? '#ef4444' : zone.zoneType === 'pickup' ? '#10b981' : '#3b82f6';
      let layer: L.Layer;
      if (zone.type === 'circle' && zone.centerLat) {
        layer = L.circle([zone.centerLat, zone.centerLng], { radius: zone.radiusMeters, color, fillOpacity: 0.1, weight: 2, dashArray: '6 4' })
          .bindTooltip(zone.name).addTo(mapRef.current!);
      } else if (zone.type === 'polygon' && zone.polygonPoints?.length) {
        layer = L.polygon(zone.polygonPoints.map((p: number[]) => [p[0], p[1]] as [number, number]), { color, fillOpacity: 0.1, weight: 2, dashArray: '6 4' })
          .bindTooltip(zone.name).addTo(mapRef.current!);
      } else return;
      geofenceRef.current.push(layer);
    });
  }, [geofences, tab]);

  // History path
  useEffect(() => {
    if (!mapRef.current) return;
    historyRef.current.forEach(l => l.remove());
    historyRef.current = [];
    if (tab !== 'history' || !historyPath.length) return;

    const coords = historyPath.map(p => [p.lat, p.lng] as [number, number]);
    const line = L.polyline(coords, { color: '#10b981', weight: 3.5 }).addTo(mapRef.current);
    const start = L.circleMarker(coords[0], { radius: 8, color: '#10b981', fillColor: '#10b981', fillOpacity: 1, weight: 0 })
      .bindTooltip('Start').addTo(mapRef.current);
    const end = L.circleMarker(coords[coords.length - 1], { radius: 8, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 1, weight: 0 })
      .bindTooltip('End').addTo(mapRef.current);

    historyRef.current = [line, start, end];
    mapRef.current.fitBounds(L.polyline(coords).getBounds(), { padding: [40, 40] });
  }, [historyPath, tab]);

  return <div id="live-map" style={{ width: '100%', height: '100%' }} />;
};
