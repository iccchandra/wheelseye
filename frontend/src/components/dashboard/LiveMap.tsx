import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGpsStore } from '../../store/gpsStore';

interface Props {
  shipments: any[];
  selectedId?: string;
  onSelectShipment: (s: any) => void;
  geofences?: any[];
  historyPath?: Array<{ lat: number; lng: number }>;
  tab: 'live' | 'history' | 'geo';
}

const STATUS_COLORS: Record<string, string> = {
  IN_TRANSIT: '#3B6D11', DISPATCHED: '#BA7517',
  DELAYED: '#A32D2D',    DELIVERED: '#185FA5',
};

function truckIcon(color: string, regNo: string, selected: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${selected ? color : '#fff'};border:2px solid ${color};border-radius:6px;padding:2px 5px;font-size:10px;font-weight:600;color:${selected ? '#fff' : color};white-space:nowrap;position:relative">
      ${regNo}
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color};position:absolute;bottom:-6px;left:50%;transform:translateX(-50%)"></div>
    </div>`,
    iconAnchor: [24, 32],
  });
}

export const LiveMap: React.FC<Props> = ({ shipments, selectedId, onSelectShipment, geofences = [], historyPath = [], tab }) => {
  const mapRef         = useRef<L.Map | null>(null);
  const markersRef     = useRef<Record<string, L.Marker>>({});
  const geofenceRef    = useRef<L.Layer[]>([]);
  const historyRef     = useRef<L.Layer[]>([]);
  const { positions }  = useGpsStore();

  useEffect(() => {
    if (mapRef.current) return;
    mapRef.current = L.map('live-map', { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current);
  }, []);

  // Truck markers (live tab)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const showMarkers = tab !== 'history';

    shipments.forEach((s) => {
      const pos   = positions[s.vehicleId];
      const lat   = pos?.lat ?? s.vehicle?.currentLat;
      const lng   = pos?.lng ?? s.vehicle?.currentLng;
      const regNo = s.vehicle?.regNumber?.split(' ').slice(-1)[0] || '??';
      if (!lat || !lng) return;

      const color    = STATUS_COLORS[s.status] || '#888';
      const selected = s.id === selectedId;
      const icon     = truckIcon(color, regNo, selected);

      if (markersRef.current[s.vehicleId]) {
        markersRef.current[s.vehicleId].setLatLng([lat, lng]).setIcon(icon);
        if (showMarkers) markersRef.current[s.vehicleId].addTo(map);
        else markersRef.current[s.vehicleId].remove();
      } else {
        const marker = L.marker([lat, lng], { icon })
          .on('click', () => onSelectShipment(s));
        marker.bindTooltip(`<b>${s.vehicle?.regNumber}</b><br>${s.origin} → ${s.destination}<br>${pos?.speed ?? 0} km/h`, { direction: 'top' });
        if (showMarkers) marker.addTo(map);
        markersRef.current[s.vehicleId] = marker;
      }
    });

    // Remove stale markers
    Object.keys(markersRef.current)
      .filter(vid => !shipments.find(s => s.vehicleId === vid))
      .forEach(vid => { markersRef.current[vid].remove(); delete markersRef.current[vid]; });

  }, [shipments, positions, selectedId, tab]);

  // Geofence zones
  useEffect(() => {
    if (!mapRef.current) return;
    geofenceRef.current.forEach(l => l.remove());
    geofenceRef.current = [];
    if (tab !== 'geo') return;

    geofences.forEach(zone => {
      const color = zone.zoneType === 'restricted' ? '#A32D2D' : zone.zoneType === 'pickup' ? '#3B6D11' : '#185FA5';
      let layer: L.Layer;
      if (zone.type === 'circle' && zone.centerLat) {
        layer = L.circle([zone.centerLat, zone.centerLng], { radius: zone.radiusMeters, color, fillOpacity: 0.1, dashArray: '6 3' })
          .bindTooltip(zone.name).addTo(mapRef.current!);
      } else if (zone.type === 'polygon' && zone.polygonPoints?.length) {
        layer = L.polygon(zone.polygonPoints.map((p: number[]) => [p[0], p[1]] as [number, number]), { color, fillOpacity: 0.1, dashArray: '6 3' })
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
    const line = L.polyline(coords, { color: '#3B6D11', weight: 3 }).addTo(mapRef.current);
    const start = L.circleMarker(coords[0], { radius: 7, color: '#3B6D11', fillColor: '#3B6D11', fillOpacity: 1 })
      .bindTooltip('Start').addTo(mapRef.current);
    const end = L.circleMarker(coords[coords.length - 1], { radius: 7, color: '#185FA5', fillColor: '#185FA5', fillOpacity: 1 })
      .bindTooltip('End').addTo(mapRef.current);

    historyRef.current = [line, start, end];
    mapRef.current.fitBounds(L.polyline(coords).getBounds(), { padding: [40, 40] });
  }, [historyPath, tab]);

  return <div id="live-map" style={{ width: '100%', height: '100%' }} />;
};
