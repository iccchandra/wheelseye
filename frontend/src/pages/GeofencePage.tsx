import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gpsApi, vehicleApi, reportsApi } from '../services/api';

type View = 'list' | 'create' | 'events';

const ZONE_COLORS: Record<string, string> = {
  pickup: '#10b981', delivery: '#3b82f6', restricted: '#ef4444', checkpoint: '#f59e0b',
};

export const GeofencePage: React.FC = () => {
  const qc = useQueryClient();
  const [view, setView] = useState<View>('list');
  const [form, setForm] = useState({ name: '', type: 'circle' as 'circle' | 'polygon', zoneType: 'checkpoint', centerLat: '', centerLng: '', radiusMeters: '1000', polygonPoints: '' as string, vehicleIds: [] as string[] });
  const [error, setError] = useState('');
  const mapRef = useRef<L.Map | null>(null);
  const drawnRef = useRef<L.Layer | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  const { data: geoData, isLoading } = useQuery('geofences', gpsApi.getGeofences);
  const { data: vehiclesData } = useQuery('vehicles-all', () => vehicleApi.getAll());
  const { data: eventsData } = useQuery('geofence-events', () => reportsApi.getGeofenceEvents(50), { enabled: view === 'events' });

  const geofences = geoData?.data || [];
  const vehicles = vehiclesData?.data || [];
  const events = eventsData?.data || [];

  const createMut = useMutation((d: any) => gpsApi.createGeofence(d), {
    onSuccess: () => { qc.invalidateQueries('geofences'); setView('list'); resetForm(); },
  });
  const deleteMut = useMutation((id: string) => gpsApi.deleteGeofence(id), {
    onSuccess: () => qc.invalidateQueries('geofences'),
  });

  const resetForm = () => {
    setForm({ name: '', type: 'circle', zoneType: 'checkpoint', centerLat: '', centerLng: '', radiusMeters: '1000', polygonPoints: '', vehicleIds: [] });
    setError('');
    if (drawnRef.current) { drawnRef.current.remove(); drawnRef.current = null; }
  };

  // Map init for create view
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !mapRef.current) {
      mapRef.current = L.map(node, { zoomControl: true }).setView([20.59, 78.96], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(mapRef.current);
      setTimeout(() => mapRef.current?.invalidateSize(), 100);

      // Click to place circle center
      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        setForm(f => {
          if (f.type === 'circle') {
            if (drawnRef.current) drawnRef.current.remove();
            const radius = parseFloat(f.radiusMeters) || 1000;
            const circle = L.circle([e.latlng.lat, e.latlng.lng], {
              radius, color: ZONE_COLORS[f.zoneType] || '#f59e0b', fillOpacity: 0.15, weight: 2,
            }).addTo(mapRef.current!);
            drawnRef.current = circle;
            return { ...f, centerLat: e.latlng.lat.toFixed(6), centerLng: e.latlng.lng.toFixed(6) };
          }
          return f;
        });
      });
    } else if (!node && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      drawnRef.current = null;
    }
  }, []);

  // List view map
  const listMapRef = useRef<L.Map | null>(null);
  const listMapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !listMapRef.current) {
      listMapRef.current = L.map(node, { zoomControl: true }).setView([20.59, 78.96], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(listMapRef.current);
      setTimeout(() => listMapRef.current?.invalidateSize(), 100);
    } else if (!node && listMapRef.current) {
      listMapRef.current.remove();
      listMapRef.current = null;
    }
  }, []);

  // Render geofences on list map
  useEffect(() => {
    if (!listMapRef.current || view !== 'list') return;
    layersRef.current.forEach(l => l.remove());
    layersRef.current = [];
    geofences.forEach((g: any) => {
      const color = ZONE_COLORS[g.zoneType] || '#f59e0b';
      let layer: L.Layer;
      if (g.type === 'circle' && g.centerLat) {
        layer = L.circle([g.centerLat, g.centerLng], { radius: g.radiusMeters, color, fillOpacity: 0.12, weight: 2 })
          .bindTooltip(`<b>${g.name}</b><br/>${g.zoneType} · ${g.radiusMeters}m`, { direction: 'top' })
          .addTo(listMapRef.current!);
      } else if (g.type === 'polygon' && g.polygonPoints?.length) {
        layer = L.polygon(g.polygonPoints.map((p: number[]) => [p[0], p[1]] as [number, number]), { color, fillOpacity: 0.12, weight: 2 })
          .bindTooltip(`<b>${g.name}</b><br/>${g.zoneType}`, { direction: 'top' })
          .addTo(listMapRef.current!);
      } else return;
      layersRef.current.push(layer);
    });
  }, [geofences, view]);

  const handleSubmit = () => {
    if (!form.name) { setError('Name is required'); return; }
    if (form.type === 'circle' && (!form.centerLat || !form.centerLng)) { setError('Click on the map to place the geofence center'); return; }
    setError('');

    const payload: any = {
      name: form.name,
      type: form.type,
      zoneType: form.zoneType,
      active: true,
    };

    if (form.type === 'circle') {
      payload.centerLat = parseFloat(form.centerLat);
      payload.centerLng = parseFloat(form.centerLng);
      payload.radiusMeters = parseFloat(form.radiusMeters) || 1000;
    } else {
      try {
        payload.polygonPoints = JSON.parse(form.polygonPoints);
      } catch { setError('Invalid polygon points JSON'); return; }
    }

    createMut.mutate(payload);
  };

  const toggleVehicle = (vid: string) => {
    setForm(f => ({
      ...f,
      vehicleIds: f.vehicleIds.includes(vid) ? f.vehicleIds.filter(v => v !== vid) : [...f.vehicleIds, vid],
    }));
  };

  // ─── Create View ──────────────────────────────────────
  if (view === 'create') {
    return (
      <div style={{ padding: '20px 24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Create Geofence</div>
          <button onClick={() => { setView('list'); resetForm(); }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, flex: 1, minHeight: 0 }}>
          {/* Map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--accent-light)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
              {form.type === 'circle' ? 'Click on the map to place the geofence center' : 'Enter polygon coordinates as JSON below'}
            </div>
            <div ref={mapContainerRef} style={{ flex: 1, borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', minHeight: 400 }} />
          </div>

          {/* Form */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, overflowY: 'auto', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={lbl}>Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Delhi Warehouse" style={inp} />
              </div>
              <div>
                <label style={lbl}>Shape</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} style={inp}>
                  <option value="circle">Circle</option>
                  <option value="polygon">Polygon</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Zone Type</label>
                <select value={form.zoneType} onChange={e => setForm(f => ({ ...f, zoneType: e.target.value }))} style={inp}>
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                  <option value="restricted">Restricted</option>
                  <option value="checkpoint">Checkpoint</option>
                </select>
              </div>

              {form.type === 'circle' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div><label style={lbl}>Latitude</label><input value={form.centerLat} onChange={e => setForm(f => ({ ...f, centerLat: e.target.value }))} style={inp} readOnly /></div>
                    <div><label style={lbl}>Longitude</label><input value={form.centerLng} onChange={e => setForm(f => ({ ...f, centerLng: e.target.value }))} style={inp} readOnly /></div>
                  </div>
                  <div>
                    <label style={lbl}>Radius (meters)</label>
                    <input type="number" value={form.radiusMeters} onChange={e => {
                      setForm(f => ({ ...f, radiusMeters: e.target.value }));
                      if (drawnRef.current && (drawnRef.current as any).setRadius) {
                        (drawnRef.current as any).setRadius(parseFloat(e.target.value) || 1000);
                      }
                    }} min="100" step="100" style={inp} />
                  </div>
                </>
              ) : (
                <div>
                  <label style={lbl}>Polygon Points (JSON)</label>
                  <textarea value={form.polygonPoints} onChange={e => setForm(f => ({ ...f, polygonPoints: e.target.value }))}
                    placeholder='[[lat,lng],[lat,lng],...]' style={{ ...inp, minHeight: 100, fontFamily: 'monospace', fontSize: 11 }} />
                </div>
              )}

              <div>
                <label style={lbl}>Assign Vehicles</label>
                <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 6 }}>
                  {vehicles.map((v: any) => (
                    <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 4px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={form.vehicleIds.includes(v.id)} onChange={() => toggleVehicle(v.id)} />
                      {v.regNumber}
                    </label>
                  ))}
                </div>
              </div>

              {error && <div style={{ fontSize: 12, color: 'var(--red)', background: 'var(--red-light)', padding: '8px 10px', borderRadius: 8 }}>{error}</div>}

              <button onClick={handleSubmit} disabled={createMut.isLoading} style={{
                padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none',
                background: 'var(--accent-gradient)', color: '#fff', cursor: 'pointer',
                boxShadow: 'var(--shadow-colored)', opacity: createMut.isLoading ? 0.7 : 1,
              }}>
                {createMut.isLoading ? 'Creating...' : 'Create Geofence'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Events View ──────────────────────────────────────
  if (view === 'events') {
    return (
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Geofence Events</div>
          <button onClick={() => setView('list')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Back</button>
        </div>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Vehicle', 'Event', 'Message', 'Location', 'Time'].map(h => <th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {events.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No geofence events yet</td></tr>}
              {events.map((e: any) => (
                <tr key={e.id}>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{e.vehicleId?.slice(0, 8)}...</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: e.type === 'GEOFENCE_ENTRY' ? 'var(--green-light)' : 'var(--red-light)',
                      color: e.type === 'GEOFENCE_ENTRY' ? 'var(--green)' : 'var(--red)',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      {e.type === 'GEOFENCE_ENTRY' ? 'Entered' : 'Exited'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.message}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{e.lat?.toFixed(4)}, {e.lng?.toFixed(4)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.createdAt ? new Date(e.createdAt).toLocaleString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── List View ────────────────────────────────────────
  return (
    <div style={{ padding: '20px 24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Geofences</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView('events')} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Events</button>
          <button onClick={() => { resetForm(); setView('create'); }} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-colored)' }}>+ New Geofence</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Map */}
        <div ref={listMapContainerRef} style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', minHeight: 400 }} />

        {/* List */}
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, overflowY: 'auto', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
            {geofences.length} geofences
          </div>
          {isLoading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>}
          {!isLoading && geofences.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No geofences yet. Create one to get started.</div>}
          {geofences.map((g: any) => {
            const color = ZONE_COLORS[g.zoneType] || '#f59e0b';
            return (
              <div key={g.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: color + '18', color }}>{g.zoneType}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {g.type === 'circle' ? `Circle · ${g.radiusMeters}m` : `Polygon · ${g.polygonPoints?.length || 0} points`}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <button onClick={() => { if (confirm(`Delete "${g.name}"?`)) deleteMut.mutate(g.id); }}
                      style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, border: '1px solid var(--border)', background: 'var(--red-light)', color: 'var(--red)', cursor: 'pointer', fontWeight: 500 }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };
const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };
