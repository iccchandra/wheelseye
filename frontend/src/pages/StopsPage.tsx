import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gpsApi, vehicleApi } from '../services/api';

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

  return (
    <div style={{ padding: '20px 24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Stops & Activity</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
            <option value="">Select vehicle</option>
            {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }} />
        </div>
      </div>

      {!vehicleId && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>Select a vehicle to view stop analysis</div>}

      {vehicleId && isLoading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Loading...</div>}

      {vehicleId && !isLoading && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {[
              { label: 'Stops', value: summary.stopCount || 0, color: 'var(--red)' },
              { label: 'Stopped', value: summary.totalStoppedFormatted || '0m', color: 'var(--red)' },
              { label: 'Running', value: summary.totalRunningFormatted || '0m', color: 'var(--green)' },
              { label: 'Distance', value: `${summary.totalDistanceKm || 0} km`, color: 'var(--accent)' },
              { label: 'Max speed', value: `${summary.maxSpeed || 0} km/h`, color: 'var(--orange)' },
              { label: 'Utilisation', value: `${summary.runningPercent || 0}%`, color: 'var(--green)' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Timeline bar */}
          {totalMin > 0 && (
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Timeline</div>
              <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                {segments.map((seg: any, i: number) => {
                  const pct = (seg.durationMinutes / totalMin) * 100;
                  if (pct < 0.5) return null;
                  return (
                    <div key={i} title={`${seg.type === 'STOPPED' ? 'Stopped' : 'Running'} — ${seg.durationFormatted}\n${new Date(seg.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – ${new Date(seg.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                      style={{
                        width: `${pct}%`, minWidth: 2,
                        background: seg.type === 'STOPPED' ? 'var(--red)' : 'var(--green)',
                        opacity: seg.type === 'STOPPED' ? 0.8 : 0.6,
                        borderRight: i < segments.length - 1 ? '1px solid var(--bg-primary)' : 'none',
                        cursor: 'pointer', transition: 'opacity 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = seg.type === 'STOPPED' ? '0.8' : '0.6')}
                    >
                      {pct > 6 && <span style={{ fontSize: 9, color: '#fff', fontWeight: 600 }}>{seg.durationFormatted}</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-tertiary)' }}>
                <span>{summary.firstActivity ? new Date(summary.firstActivity).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red)', display: 'inline-block' }} /> Stopped</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} /> Running</span>
                </div>
                <span>{summary.lastActivity ? new Date(summary.lastActivity).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
            </div>
          )}

          {/* Map + segment list side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12, flex: 1, minHeight: 0 }}>

            {/* Map */}
            <div ref={mapContainerRef} style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', minHeight: 300 }} />

            {/* Segment list */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, overflowY: 'auto', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                {segments.length} segments
              </div>
              {segments.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No GPS data for this date</div>}
              {segments.map((seg: any, i: number) => (
                <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.type === 'STOPPED' ? 'var(--red)' : 'var(--green)', border: '2px solid var(--bg-primary)', flexShrink: 0 }} />
                    {i < segments.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 2 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: seg.type === 'STOPPED' ? 'var(--red)' : 'var(--green)' }}>
                        {seg.type === 'STOPPED' ? 'Stopped' : 'Running'}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{seg.durationFormatted}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {new Date(seg.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} — {new Date(seg.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {seg.type === 'STOPPED' && seg.address && (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{seg.address}</div>
                    )}
                    {seg.type === 'RUNNING' && (
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
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
