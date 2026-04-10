import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gpsApi, vehicleApi } from '../services/api';
import { Octagon, TrendingUp, Route, Gauge, BarChart3, Clock } from 'lucide-react';

export const StopsPage: React.FC = () => {
  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  const { data: vehiclesData } = useQuery('vehicles-all', () => vehicleApi.getAll());
  const vehicles = vehiclesData?.data || [];

  const { data: stopsData, isLoading } = useQuery(
    ['stops', vehicleId, date],
    () => gpsApi.getStops(vehicleId, date),
    { enabled: !!vehicleId },
  );

  const result = stopsData?.data;
  const segments = result?.segments || [];
  const summary = result?.summary || {};

  // Init map when container appears, destroy when it disappears
  const mapContainerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node && !mapRef.current) {
      mapRef.current = L.map(node, { zoomControl: true }).setView([20.59, 78.96], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(mapRef.current);
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    } else if (!node && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      layersRef.current = [];
    }
  }, []);

  // Render markers
  useEffect(() => {
    if (!mapRef.current) return;
    layersRef.current.forEach(l => l.remove());
    layersRef.current = [];
    if (!segments.length) return;

    const bounds: [number, number][] = [];
    let stopIdx = 0;

    segments.forEach((seg: any) => {
      bounds.push([seg.lat, seg.lng]);
      if (seg.type === 'STOPPED') {
        stopIdx++;
        const marker = L.circleMarker([seg.lat, seg.lng], {
          radius: Math.min(6 + seg.durationMinutes / 10, 18),
          color: '#c93c37', fillColor: '#c93c37', fillOpacity: 0.7, weight: 2,
        }).addTo(mapRef.current!);
        marker.bindTooltip(
          `<div style="font-size:12px"><b>Stop #${stopIdx}</b><br/>${seg.durationFormatted}<br/>${seg.address || `${seg.lat.toFixed(4)}, ${seg.lng.toFixed(4)}`}<br/><span style="color:#999">${new Date(seg.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} — ${new Date(seg.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>`,
          { direction: 'top', className: '' },
        );
        layersRef.current.push(marker);
      } else {
        // Running segment — draw line
        const coords: [number, number][] = [[seg.lat, seg.lng], [seg.endLat, seg.endLng]];
        const line = L.polyline(coords, { color: '#2d8a4e', weight: 3, opacity: 0.6 }).addTo(mapRef.current!);
        layersRef.current.push(line);
      }
    });

    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds as any, { padding: [40, 40] });
    }
  }, [segments]);

  const totalMin = (summary.totalStopped || 0) + (summary.totalRunning || 0);

  const STAT_ICONS = [Octagon, Clock, TrendingUp, Route, Gauge, BarChart3];

  return (
    <div className="page h-full flex flex-col gap-4">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Stops &amp; Activity</h1>
        <div className="flex gap-2">
          <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="select w-auto">
            <option value="">Select vehicle</option>
            {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input w-auto" />
        </div>
      </div>

      {!vehicleId && <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Select a vehicle to view stop analysis</div>}

      {vehicleId && isLoading && <div className="text-center py-10 text-slate-400">Loading...</div>}

      {vehicleId && !isLoading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-6 gap-2.5">
            {[
              { label: 'Stops', value: summary.stopCount || 0, color: 'text-red-500', bar: 'bg-red-500' },
              { label: 'Stopped', value: summary.totalStoppedFormatted || '0m', color: 'text-red-500', bar: 'bg-red-500' },
              { label: 'Running', value: summary.totalRunningFormatted || '0m', color: 'text-emerald-500', bar: 'bg-emerald-500' },
              { label: 'Distance', value: `${summary.totalDistanceKm || 0} km`, color: 'text-brand-600', bar: 'bg-brand-600' },
              { label: 'Max speed', value: `${summary.maxSpeed || 0} km/h`, color: 'text-amber-500', bar: 'bg-amber-500' },
              { label: 'Utilisation', value: `${summary.runningPercent || 0}%`, color: 'text-emerald-500', bar: 'bg-emerald-500' },
            ].map((c, idx) => {
              const Icon = STAT_ICONS[idx];
              return (
                <div key={c.label} className="stat-card">
                  <div className={`stat-card-bar ${c.bar}`} />
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className="text-slate-400" />
                    <span className="section-label !mb-0">{c.label}</span>
                  </div>
                  <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
                </div>
              );
            })}
          </div>

          {/* Timeline bar */}
          {totalMin > 0 && (
            <div className="card p-3.5 px-4">
              <div className="section-label mb-2">Timeline</div>
              <div className="flex h-7 rounded-md overflow-hidden bg-slate-100">
                {segments.map((seg: any, i: number) => {
                  const pct = (seg.durationMinutes / totalMin) * 100;
                  if (pct < 0.5) return null;
                  return (
                    <div key={i} title={`${seg.type === 'STOPPED' ? 'Stopped' : 'Running'} — ${seg.durationFormatted}\n${new Date(seg.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – ${new Date(seg.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                      style={{
                        width: `${pct}%`, minWidth: 2,
                        borderRight: i < segments.length - 1 ? '1px solid white' : 'none',
                      }}
                      className={`cursor-pointer transition-opacity flex items-center justify-center ${
                        seg.type === 'STOPPED' ? 'bg-red-500 opacity-80 hover:opacity-100' : 'bg-emerald-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {pct > 6 && <span className="text-[9px] text-white font-semibold">{seg.durationFormatted}</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                <span>{summary.firstActivity ? new Date(summary.firstActivity).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Stopped</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Running</span>
                </div>
                <span>{summary.lastActivity ? new Date(summary.lastActivity).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
            </div>
          )}

          {/* Map + segment list side by side */}
          <div className="grid grid-cols-[1fr_320px] gap-3 flex-1 min-h-0">

            {/* Map */}
            <div ref={mapContainerRef} className="rounded-xl border border-slate-200 overflow-hidden min-h-[300px]" />

            {/* Segment list */}
            <div className="card overflow-y-auto">
              <div className="p-3 px-3.5 border-b border-slate-200 text-xs font-semibold text-slate-500 sticky top-0 bg-white z-[1]">
                {segments.length} segments
              </div>
              {segments.length === 0 && <div className="py-6 text-center text-slate-400 text-sm">No GPS data for this date</div>}
              {segments.map((seg: any, i: number) => (
                <div key={i} className="p-2.5 px-3.5 border-b border-slate-100 flex gap-2.5">
                  <div className="flex flex-col items-center w-4 shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shrink-0 ${seg.type === 'STOPPED' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    {i < segments.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-0.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-semibold ${seg.type === 'STOPPED' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {seg.type === 'STOPPED' ? 'Stopped' : 'Running'}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{seg.durationFormatted}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(seg.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} — {new Date(seg.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {seg.type === 'STOPPED' && seg.address && (
                      <div className="text-[11px] text-slate-400 mt-0.5">{seg.address}</div>
                    )}
                    {seg.type === 'RUNNING' && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {seg.distanceKm} km · avg {seg.avgSpeed} km/h · max {seg.maxSpeed} km/h
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
