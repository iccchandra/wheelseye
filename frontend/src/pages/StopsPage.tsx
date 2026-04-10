import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gpsApi, vehicleApi } from '../services/api';
import { Truck, Octagon, TrendingUp, Route as RouteIcon, Gauge, BarChart3, Clock, X, ChevronRight, MapPin } from 'lucide-react';

const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  AVAILABLE:   { color: '#10b981', bg: '#ecfdf5', label: 'Available' },
  ON_TRIP:     { color: '#3b82f6', bg: '#eff6ff', label: 'On Trip' },
  MAINTENANCE: { color: '#f59e0b', bg: '#fffbeb', label: 'Maintenance' },
  INACTIVE:    { color: '#94a3b8', bg: '#f1f5f9', label: 'Inactive' },
};

function truckMapIcon(regNo: string, status: string, selected: boolean) {
  const sc = STATUS_COLORS[status] || STATUS_COLORS.INACTIVE;
  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.15))">
        <div style="
          background:${selected ? sc.color : '#ffffff'};
          border:2.5px solid ${sc.color};
          border-radius:10px;
          padding:4px 8px 4px 6px;
          font-size:11px;
          font-weight:700;
          color:${selected ? '#fff' : sc.color};
          white-space:nowrap;
          display:flex;
          align-items:center;
          gap:4px;
          font-family:Inter,system-ui,sans-serif;
          ${selected ? 'box-shadow:0 0 0 3px ' + sc.color + '40;' : ''}
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${selected ? '#fff' : sc.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.684-.949V8a1 1 0 0 0-1-1h-1"/>
            <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
          </svg>
          ${regNo}
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${sc.color};margin-top:-1px"></div>
      </div>
    `,
    iconAnchor: [40, 48],
    popupAnchor: [0, -48],
  });
}

export const StopsPage: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchText, setSearchText] = useState('');
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const stopsLayersRef = useRef<L.Layer[]>([]);

  const { data: vehiclesData } = useQuery('vehicles-all', () => vehicleApi.getAll(), { refetchInterval: 60000 });
  const vehicles: any[] = vehiclesData?.data || [];

  const { data: stopsData, isLoading: stopsLoading } = useQuery(
    ['stops', selectedVehicle?.id, date],
    () => gpsApi.getStops(selectedVehicle.id, date),
    { enabled: !!selectedVehicle?.id },
  );

  const result = stopsData?.data;
  const segments = result?.segments || [];
  const summary = result?.summary || {};

  const filteredVehicles = vehicles.filter((v: any) =>
    !searchText || v.regNumber?.toLowerCase().includes(searchText.toLowerCase()) || v.ownerName?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Init map
  const mapContainerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node && !mapRef.current) {
      mapRef.current = L.map(node, { zoomControl: true, attributionControl: false }).setView([20.59, 78.96], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OSM',
      }).addTo(mapRef.current);
      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(mapRef.current);
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    } else if (!node && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markersRef.current = {};
      stopsLayersRef.current = [];
    }
  }, []);

  // Listen for popup button clicks
  useEffect(() => {
    const handler = (e: any) => {
      const vid = e.detail;
      const v = vehicles.find((veh: any) => veh.id === vid);
      if (v) { setSelectedVehicle(v); mapRef.current?.closePopup(); }
    };
    document.addEventListener('select-vehicle', handler);
    return () => document.removeEventListener('select-vehicle', handler);
  }, [vehicles]);

  // Place all vehicle markers on map
  useEffect(() => {
    if (!mapRef.current || !vehicles.length) return;
    const map = mapRef.current;
    const bounds: [number, number][] = [];

    vehicles.forEach((v: any) => {
      if (!v.currentLat || !v.currentLng) return;
      const regShort = v.regNumber?.split(' ').slice(-2).join(' ') || '??';
      const isSelected = selectedVehicle?.id === v.id;
      const icon = truckMapIcon(regShort, v.status, isSelected);

      if (markersRef.current[v.id]) {
        markersRef.current[v.id].setLatLng([v.currentLat, v.currentLng]).setIcon(icon);
      } else {
        const sc = STATUS_COLORS[v.status] || STATUS_COLORS.INACTIVE;
        const pingTime = v.lastPingAt ? new Date(v.lastPingAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'No data';
        const speedColor = v.lastSpeed > 60 ? '#ef4444' : v.lastSpeed > 0 ? '#10b981' : '#94a3b8';

        const popupHtml = `
          <div style="font-family:Inter,system-ui,sans-serif;min-width:240px;padding:4px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <div style="width:40px;height:40px;border-radius:10px;background:${sc.bg};display:flex;align-items:center;justify-content:center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${sc.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.684-.949V8a1 1 0 0 0-1-1h-1"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
                </svg>
              </div>
              <div style="flex:1">
                <div style="font-weight:800;font-size:15px;color:#0f172a;letter-spacing:-0.3px">${v.regNumber}</div>
                <div style="font-size:11px;color:#64748b;margin-top:1px">${v.make || ''} ${v.model || ''}</div>
              </div>
              <div style="padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;background:${sc.bg};color:${sc.color}">${sc.label}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
              <div style="background:#f8fafc;border-radius:8px;padding:8px 10px;text-align:center">
                <div style="font-size:20px;font-weight:800;color:${speedColor};font-family:'DM Mono',monospace;letter-spacing:-1px">${v.lastSpeed ?? 0}</div>
                <div style="font-size:9px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">km/h</div>
              </div>
              <div style="background:#f8fafc;border-radius:8px;padding:8px 10px;text-align:center">
                <div style="font-size:13px;font-weight:700;color:#0f172a">${v.type || '—'}</div>
                <div style="font-size:9px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${v.capacityMT || 0} MT</div>
              </div>
            </div>
            <div style="border-top:1px solid #f1f5f9;padding-top:8px;display:flex;flex-direction:column;gap:5px">
              <div style="display:flex;justify-content:space-between;font-size:11px">
                <span style="color:#94a3b8">Owner</span>
                <span style="font-weight:600;color:#334155">${v.ownerName || '—'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:11px">
                <span style="color:#94a3b8">Last Ping</span>
                <span style="font-weight:600;color:#334155">${pingTime}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:11px">
                <span style="color:#94a3b8">Coordinates</span>
                <span style="font-weight:500;color:#64748b;font-size:10px">${v.currentLat.toFixed(4)}, ${v.currentLng.toFixed(4)}</span>
              </div>
            </div>
            <button onclick="document.dispatchEvent(new CustomEvent('select-vehicle',{detail:'${v.id}'}))"
              style="width:100%;margin-top:10px;padding:8px;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.2px;box-shadow:0 2px 8px rgba(37,99,235,0.25)">
              View Stops & Track →
            </button>
          </div>
        `;

        const marker = L.marker([v.currentLat, v.currentLng], { icon })
          .on('click', () => {
            marker.openPopup();
          })
          .bindPopup(popupHtml, { maxWidth: 280, className: 'vehicle-popup' });
        marker.addTo(map);
        markersRef.current[v.id] = marker;
      }
      bounds.push([v.currentLat, v.currentLng]);
    });

    // Remove stale
    Object.keys(markersRef.current).filter(id => !vehicles.find((v: any) => v.id === id)).forEach(id => {
      markersRef.current[id].remove();
      delete markersRef.current[id];
    });

    if (bounds.length && !selectedVehicle) {
      map.fitBounds(bounds as any, { padding: [50, 50], maxZoom: 12 });
    }
  }, [vehicles, selectedVehicle]);

  // When a vehicle is selected, fly to it and show stops
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous stops layers
    stopsLayersRef.current.forEach(l => l.remove());
    stopsLayersRef.current = [];

    if (selectedVehicle?.currentLat) {
      mapRef.current.flyTo([selectedVehicle.currentLat, selectedVehicle.currentLng], 10, { duration: 0.8 });
    }
  }, [selectedVehicle?.id]);

  // Render stop markers and route on map
  useEffect(() => {
    if (!mapRef.current) return;
    stopsLayersRef.current.forEach(l => l.remove());
    stopsLayersRef.current = [];
    if (!segments.length) return;

    const bounds: [number, number][] = [];
    let stopIdx = 0;

    segments.forEach((seg: any) => {
      bounds.push([seg.lat, seg.lng]);
      if (seg.type === 'STOPPED') {
        stopIdx++;
        const marker = L.circleMarker([seg.lat, seg.lng], {
          radius: Math.min(7 + seg.durationMinutes / 8, 20),
          color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.65, weight: 2.5,
        }).addTo(mapRef.current!);
        marker.bindTooltip(`
          <div style="font-family:Inter,system-ui,sans-serif">
            <div style="font-weight:700;font-size:12px;color:#ef4444">Stop #${stopIdx} · ${seg.durationFormatted}</div>
            <div style="font-size:11px;color:#475569;margin-top:3px">${seg.address || `${seg.lat.toFixed(4)}, ${seg.lng.toFixed(4)}`}</div>
            <div style="font-size:10px;color:#94a3b8;margin-top:2px">${new Date(seg.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} — ${new Date(seg.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        `, { direction: 'top' });
        stopsLayersRef.current.push(marker);
      } else if (seg.endLat) {
        const line = L.polyline([[seg.lat, seg.lng], [seg.endLat, seg.endLng]], {
          color: '#10b981', weight: 3.5, opacity: 0.7, dashArray: '8 4',
        }).addTo(mapRef.current!);
        stopsLayersRef.current.push(line);
      }
    });

    if (bounds.length > 1) {
      mapRef.current.fitBounds(bounds as any, { padding: [60, 60] });
    }
  }, [segments]);

  const totalMin = (summary.totalStopped || 0) + (summary.totalRunning || 0);

  return (
    <div className="flex h-full">
      {/* Left sidebar — vehicle list */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-3 border-b border-slate-200">
          <h1 className="text-sm font-bold text-slate-800 mb-2">Fleet Tracking</h1>
          <div className="relative">
            <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search vehicle..."
              className="input !py-2 !pl-8 !text-xs" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredVehicles.map((v: any) => {
            const sc = STATUS_COLORS[v.status] || STATUS_COLORS.INACTIVE;
            const isActive = selectedVehicle?.id === v.id;
            return (
              <div key={v.id} onClick={() => setSelectedVehicle(isActive ? null : v)}
                className={`px-3 py-2.5 border-b border-slate-100 cursor-pointer transition-all duration-150 ${
                  isActive ? 'bg-blue-50 border-l-[3px] border-l-brand-500' : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: sc.bg }}>
                      <Truck size={14} style={{ color: sc.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{v.regNumber}</div>
                      <div className="text-[10px] text-slate-400">{v.make} {v.model}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold" style={{ color: sc.color }}>{sc.label}</div>
                    <div className="text-[10px] text-slate-400">{v.lastSpeed ?? 0} km/h</div>
                  </div>
                </div>
                {v.currentLat && (
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${v.lastSpeed > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    {v.lastPingAt ? new Date(v.lastPingAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'No GPS'}
                  </div>
                )}
              </div>
            );
          })}
          {filteredVehicles.length === 0 && <div className="p-6 text-center text-slate-400 text-xs">No vehicles found</div>}
        </div>

        <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-400 text-center">
          {vehicles.length} vehicles · {vehicles.filter((v: any) => v.currentLat).length} with GPS
        </div>
      </div>

      {/* Center — map */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Date picker overlay */}
        <div className="absolute top-3 left-3 z-[500]">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="input !py-1.5 !px-3 !text-xs !w-auto shadow-md !border-slate-300 !bg-white/95 backdrop-blur-sm" />
        </div>

        {/* Vehicle count badge */}
        <div className="absolute top-3 right-3 z-[500] bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <Truck size={13} className="text-brand-500" />
          {vehicles.filter((v: any) => v.currentLat).length} live
        </div>
      </div>

      {/* Right panel — stops detail (shows when vehicle selected) */}
      {selectedVehicle && (
        <div className="w-80 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col animate-slide-in overflow-hidden">
          {/* Vehicle header */}
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: STATUS_COLORS[selectedVehicle.status]?.bg }}>
                <Truck size={18} style={{ color: STATUS_COLORS[selectedVehicle.status]?.color }} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">{selectedVehicle.regNumber}</div>
                <div className="text-[11px] text-slate-400">{selectedVehicle.make} {selectedVehicle.model} · {selectedVehicle.type}</div>
              </div>
            </div>
            <button onClick={() => setSelectedVehicle(null)} className="btn-ghost !p-1.5 rounded-md">
              <X size={16} />
            </button>
          </div>

          {stopsLoading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Loading stops...</div>
          ) : segments.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center px-6">
              No GPS activity for this vehicle on {date}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-px bg-slate-200">
                {[
                  { label: 'Stops', value: summary.stopCount || 0, color: 'text-red-500' },
                  { label: 'Running', value: summary.totalRunningFormatted || '0m', color: 'text-emerald-500' },
                  { label: 'Distance', value: `${summary.totalDistanceKm || 0}km`, color: 'text-brand-600' },
                ].map(c => (
                  <div key={c.label} className="bg-white p-2.5 text-center">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">{c.label}</div>
                    <div className={`text-sm font-extrabold ${c.color}`}>{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Timeline bar */}
              {totalMin > 0 && (
                <div className="px-3 py-2.5 border-b border-slate-200">
                  <div className="flex h-3 rounded overflow-hidden bg-slate-100">
                    {segments.map((seg: any, i: number) => {
                      const pct = (seg.durationMinutes / totalMin) * 100;
                      if (pct < 0.5) return null;
                      return (
                        <div key={i} style={{ width: `${pct}%`, minWidth: 2, borderRight: i < segments.length - 1 ? '1px solid white' : 'none' }}
                          className={`${seg.type === 'STOPPED' ? 'bg-red-500' : 'bg-emerald-500'} transition-opacity hover:opacity-100 ${seg.type === 'STOPPED' ? 'opacity-80' : 'opacity-50'}`}
                          title={`${seg.type === 'STOPPED' ? 'Stopped' : 'Running'} ${seg.durationFormatted}`} />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] text-slate-400">
                    <span>{summary.firstActivity ? new Date(summary.firstActivity).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-sm bg-red-500" /> Stop</span>
                      <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-sm bg-emerald-500" /> Run</span>
                    </div>
                    <span>{summary.lastActivity ? new Date(summary.lastActivity).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                </div>
              )}

              {/* Segment list */}
              {segments.map((seg: any, i: number) => (
                <div key={i} className="px-3 py-2 border-b border-slate-100 flex gap-2.5">
                  <div className="flex flex-col items-center w-4 shrink-0 pt-0.5">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white ${seg.type === 'STOPPED' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    {i < segments.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className={`text-[11px] font-bold ${seg.type === 'STOPPED' ? 'text-red-500' : 'text-emerald-600'}`}>
                        {seg.type === 'STOPPED' ? 'Stopped' : 'Running'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">{seg.durationFormatted}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(seg.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} — {new Date(seg.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {seg.type === 'STOPPED' && seg.address && (
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-start gap-1">
                        <MapPin size={10} className="shrink-0 mt-0.5" />{seg.address}
                      </div>
                    )}
                    {seg.type === 'RUNNING' && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {seg.distanceKm}km · avg {seg.avgSpeed} · max {seg.maxSpeed} km/h
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Bottom summary */}
              <div className="p-3 bg-slate-50 text-center">
                <div className="text-[10px] text-slate-400">
                  {summary.stopCount} stops · {summary.totalStoppedFormatted} idle · {summary.totalDistanceKm}km · {summary.runningPercent}% utilised
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
