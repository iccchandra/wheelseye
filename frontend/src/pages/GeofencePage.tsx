import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gpsApi, vehicleApi, reportsApi } from '../services/api';
import { Plus, ArrowLeft, MapPin, Trash2, LogIn, LogOut, Globe } from 'lucide-react';

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
      <div className="page h-full flex flex-col gap-4">
        <div className="page-header">
          <h1 className="page-title">Create Geofence</h1>
          <button onClick={() => { setView('list'); resetForm(); }} className="btn-secondary btn-sm inline-flex items-center gap-1">
            <ArrowLeft size={14} />
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-4 flex-1 min-h-0">
          {/* Map */}
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-500 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
              <MapPin size={14} className="text-brand-500" />
              {form.type === 'circle' ? 'Click on the map to place the geofence center' : 'Enter polygon coordinates as JSON below'}
            </div>
            <div ref={mapContainerRef} className="flex-1 rounded-xl border border-slate-200 overflow-hidden min-h-[400px]" />
          </div>

          {/* Form */}
          <div className="card p-4 overflow-y-auto">
            <div className="flex flex-col gap-3">
              <div>
                <label className="form-label">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Delhi Warehouse" className="input" />
              </div>
              <div>
                <label className="form-label">Shape</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className="select">
                  <option value="circle">Circle</option>
                  <option value="polygon">Polygon</option>
                </select>
              </div>
              <div>
                <label className="form-label">Zone Type</label>
                <select value={form.zoneType} onChange={e => setForm(f => ({ ...f, zoneType: e.target.value }))} className="select">
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                  <option value="restricted">Restricted</option>
                  <option value="checkpoint">Checkpoint</option>
                </select>
              </div>

              {form.type === 'circle' ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="form-label">Latitude</label><input value={form.centerLat} onChange={e => setForm(f => ({ ...f, centerLat: e.target.value }))} className="input" readOnly /></div>
                    <div><label className="form-label">Longitude</label><input value={form.centerLng} onChange={e => setForm(f => ({ ...f, centerLng: e.target.value }))} className="input" readOnly /></div>
                  </div>
                  <div>
                    <label className="form-label">Radius (meters)</label>
                    <input type="number" value={form.radiusMeters} onChange={e => {
                      setForm(f => ({ ...f, radiusMeters: e.target.value }));
                      if (drawnRef.current && (drawnRef.current as any).setRadius) {
                        (drawnRef.current as any).setRadius(parseFloat(e.target.value) || 1000);
                      }
                    }} min="100" step="100" className="input" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="form-label">Polygon Points (JSON)</label>
                  <textarea value={form.polygonPoints} onChange={e => setForm(f => ({ ...f, polygonPoints: e.target.value }))}
                    placeholder='[[lat,lng],[lat,lng],...]' className="input min-h-[100px] font-mono text-[11px]" />
                </div>
              )}

              <div>
                <label className="form-label">Assign Vehicles</label>
                <div className="max-h-[120px] overflow-y-auto border border-slate-200 rounded-lg p-1.5">
                  {vehicles.map((v: any) => (
                    <label key={v.id} className="flex items-center gap-1.5 text-xs p-1 cursor-pointer text-slate-500">
                      <input type="checkbox" checked={form.vehicleIds.includes(v.id)} onChange={() => toggleVehicle(v.id)} />
                      {v.regNumber}
                    </label>
                  ))}
                </div>
              </div>

              {error && <div className="text-xs text-red-600 bg-red-50 px-2.5 py-2 rounded-lg">{error}</div>}

              <button onClick={handleSubmit} disabled={createMut.isLoading} className="btn-primary w-full">
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
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Geofence Events</h1>
          <button onClick={() => setView('list')} className="btn-secondary btn-sm inline-flex items-center gap-1">
            <ArrowLeft size={14} />
            Back
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead><tr>
              {['Vehicle', 'Event', 'Message', 'Location', 'Time'].map(h => <th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {events.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 text-sm py-8">No geofence events yet</td></tr>}
              {events.map((e: any) => (
                <tr key={e.id}>
                  <td className="font-medium">{e.vehicleId?.slice(0, 8)}...</td>
                  <td>
                    <span className={`badge ${e.type === 'GEOFENCE_ENTRY' ? 'badge-green' : 'badge-red'}`}>
                      {e.type === 'GEOFENCE_ENTRY' ? <LogIn size={10} /> : <LogOut size={10} />}
                      {e.type === 'GEOFENCE_ENTRY' ? 'Entered' : 'Exited'}
                    </span>
                  </td>
                  <td className="text-xs text-slate-500">{e.message}</td>
                  <td className="text-[11px] text-slate-400">{e.lat?.toFixed(4)}, {e.lng?.toFixed(4)}</td>
                  <td className="text-xs text-slate-500">{e.createdAt ? new Date(e.createdAt).toLocaleString('en-IN') : '—'}</td>
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
    <div className="page h-full flex flex-col gap-4">
      <div className="page-header">
        <h1 className="page-title">Geofences</h1>
        <div className="flex gap-2">
          <button onClick={() => setView('events')} className="btn-secondary btn-sm inline-flex items-center gap-1">
            <Globe size={14} />
            Events
          </button>
          <button onClick={() => { resetForm(); setView('create'); }} className="btn-primary btn-sm inline-flex items-center gap-1">
            <Plus size={14} />
            New Geofence
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4 flex-1 min-h-0">
        {/* Map */}
        <div ref={listMapContainerRef} className="rounded-xl border border-slate-200 overflow-hidden min-h-[400px]" />

        {/* List */}
        <div className="card overflow-y-auto">
          <div className="p-3.5 px-4 border-b border-slate-200 text-sm font-semibold text-slate-500 sticky top-0 bg-white z-[1]">
            {geofences.length} geofences
          </div>
          {isLoading && <div className="py-6 text-center text-slate-400">Loading...</div>}
          {!isLoading && geofences.length === 0 && <div className="py-8 text-center text-slate-400 text-sm">No geofences yet. Create one to get started.</div>}
          {geofences.map((g: any) => {
            const color = ZONE_COLORS[g.zoneType] || '#f59e0b';
            return (
              <div key={g.id} className="p-3 px-4 border-b border-slate-100 flex gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-800">{g.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: color + '18', color }}>{g.zoneType}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {g.type === 'circle' ? `Circle · ${g.radiusMeters}m` : `Polygon · ${g.polygonPoints?.length || 0} points`}
                  </div>
                  <div className="mt-1.5">
                    <button onClick={() => { if (confirm(`Delete "${g.name}"?`)) deleteMut.mutate(g.id); }} className="btn-danger btn-sm inline-flex items-center gap-1 text-[11px]">
                      <Trash2 size={11} />
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
