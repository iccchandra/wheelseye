import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { vehicleApi, vehicleGroupApi } from '../services/api';
import { FileUpload } from '../components/common/FileUpload';
import { Plus, Search, Edit, X } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE:   'badge-green',
  ON_TRIP:     'badge-blue',
  MAINTENANCE: 'badge-orange',
  INACTIVE:    'badge-gray',
};

const STATUSES = ['AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE'];
const TYPES = ['OPEN', 'CONTAINER', 'TRAILER', 'FLATBED', 'MINI', 'REFRIGERATED'];

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
function expiryClass(days: number | null) {
  if (days === null) return 'text-slate-400';
  if (days < 0) return 'text-red-600';
  if (days < 30) return 'text-amber-600';
  return 'text-slate-700';
}

const emptyForm = {
  regNumber: '', type: 'OPEN', status: 'AVAILABLE', capacityMT: '', make: '', model: '', year: '',
  ownerName: '', ownerPhone: '', isOwned: false, groupId: '',
  rcNumber: '', rcExpiry: '', rcDocUrl: '',
  insuranceExpiry: '', insuranceDocUrl: '',
  pollutionExpiry: '', pollutionDocUrl: '',
  fitnessExpiry: '', fitnessDocUrl: '',
  permitExpiry: '', permitDocUrl: '',
  fastTagId: '', gpsDeviceId: '', gpsEnabled: false,
};

export const VehiclesPage: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery(
    ['vehicles', search, status],
    () => vehicleApi.getAll({ search: search || undefined, status: status || undefined }),
    { keepPreviousData: true },
  );
  const { data: groupsData } = useQuery('vehicle-groups', vehicleGroupApi.getAll);

  const vehicles = data?.data || [];
  const groups = groupsData?.data || [];

  const createMut = useMutation((d: any) => vehicleApi.create(d), { onSuccess: () => { qc.invalidateQueries('vehicles'); resetForm(); } });
  const updateMut = useMutation(({ id, d }: { id: string; d: any }) => vehicleApi.update(id, d), { onSuccess: () => { qc.invalidateQueries('vehicles'); resetForm(); } });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const resetForm = () => { setShowForm(false); setEditId(null); setError(''); setForm(emptyForm); };

  const openEdit = (v: any) => {
    setEditId(v.id);
    const f = { ...emptyForm };
    for (const k of Object.keys(f)) {
      const val = v[k];
      if (val === true || val === false) (f as any)[k] = val;
      else if (val != null) (f as any)[k] = typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/) ? val.slice(0, 10) : String(val);
    }
    setForm(f);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.regNumber) { setError('Registration number is required'); return; }
    setError('');
    const payload: any = {};
    for (const [k, v] of Object.entries(form)) {
      if (v === '' || v === null) continue;
      if (k === 'capacityMT' || k === 'year') payload[k] = Number(v);
      else payload[k] = v;
    }
    if (editId) updateMut.mutate({ id: editId, d: payload });
    else createMut.mutate(payload);
  };

  // --- Form view ---
  if (showForm) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">{editId ? 'Edit vehicle' : 'Add vehicle'}</h1>
          <button onClick={resetForm} className="btn-secondary btn-sm">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>

        <div className="form-section">
          <div className="form-section-title">Basic Information</div>
          <div className="form-grid">
            <div><label className="form-label">Reg Number *</label><input value={form.regNumber} onChange={e => set('regNumber', e.target.value)} placeholder="e.g. MH 01 AB 1234" className="input" /></div>
            <div><label className="form-label">Type</label><select value={form.type} onChange={e => set('type', e.target.value)} className="select">{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="form-label">Status</label><select value={form.status} onChange={e => set('status', e.target.value)} className="select">{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="form-label">Capacity (MT)</label><input type="number" value={form.capacityMT} onChange={e => set('capacityMT', e.target.value)} min="0" step="0.5" className="input" /></div>
            <div><label className="form-label">Make</label><input value={form.make} onChange={e => set('make', e.target.value)} placeholder="e.g. TATA" className="input" /></div>
            <div><label className="form-label">Model</label><input value={form.model} onChange={e => set('model', e.target.value)} className="input" /></div>
            <div><label className="form-label">Year</label><input type="number" value={form.year} onChange={e => set('year', e.target.value)} min="1990" max="2030" className="input" /></div>
            <div><label className="form-label">Group</label><select value={form.groupId} onChange={e => set('groupId', e.target.value)} className="select"><option value="">No group</option>{groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Owner Details</div>
          <div className="form-grid">
            <div><label className="form-label">Owner Name</label><input value={form.ownerName} onChange={e => set('ownerName', e.target.value)} className="input" /></div>
            <div><label className="form-label">Owner Phone</label><input value={form.ownerPhone} onChange={e => set('ownerPhone', e.target.value)} className="input" /></div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" checked={form.isOwned as boolean} onChange={e => set('isOwned', e.target.checked as any)} id="isOwned" className="rounded border-slate-300" />
              <label htmlFor="isOwned" className="text-sm cursor-pointer text-slate-700">Company owned</label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Documents & Expiry</div>
          <div className="form-grid">
            <div><label className="form-label">RC Number</label><input value={form.rcNumber} onChange={e => set('rcNumber', e.target.value)} className="input" /></div>
            <div><label className="form-label">RC Expiry</label><input type="date" value={form.rcExpiry} onChange={e => set('rcExpiry', e.target.value)} className="input" /></div>
            <FileUpload label="RC Document" value={form.rcDocUrl} category="vehicle-rc" accept="image/*,.pdf" onChange={v => set('rcDocUrl', v)} />
            <div><label className="form-label">Insurance Expiry</label><input type="date" value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)} className="input" /></div>
            <FileUpload label="Insurance Document" value={form.insuranceDocUrl} category="vehicle-insurance" accept="image/*,.pdf" onChange={v => set('insuranceDocUrl', v)} />
            <div><label className="form-label">Pollution Expiry</label><input type="date" value={form.pollutionExpiry} onChange={e => set('pollutionExpiry', e.target.value)} className="input" /></div>
            <FileUpload label="Pollution Certificate" value={form.pollutionDocUrl} category="vehicle-pollution" accept="image/*,.pdf" onChange={v => set('pollutionDocUrl', v)} />
            <div><label className="form-label">Fitness Expiry</label><input type="date" value={form.fitnessExpiry} onChange={e => set('fitnessExpiry', e.target.value)} className="input" /></div>
            <FileUpload label="Fitness Certificate" value={form.fitnessDocUrl} category="vehicle-fitness" accept="image/*,.pdf" onChange={v => set('fitnessDocUrl', v)} />
            <div><label className="form-label">Permit Expiry</label><input type="date" value={form.permitExpiry} onChange={e => set('permitExpiry', e.target.value)} className="input" /></div>
            <FileUpload label="Permit Document" value={form.permitDocUrl} category="vehicle-permit" accept="image/*,.pdf" onChange={v => set('permitDocUrl', v)} />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">GPS & Tracking</div>
          <div className="form-grid">
            <div><label className="form-label">GPS Device ID</label><input value={form.gpsDeviceId} onChange={e => set('gpsDeviceId', e.target.value)} className="input" /></div>
            <div><label className="form-label">FASTag ID</label><input value={form.fastTagId} onChange={e => set('fastTagId', e.target.value)} className="input" /></div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" checked={form.gpsEnabled as boolean} onChange={e => set('gpsEnabled', e.target.checked as any)} id="gpsEnabled" className="rounded border-slate-300" />
              <label htmlFor="gpsEnabled" className="text-sm cursor-pointer text-slate-700">GPS enabled</label>
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="flex gap-2">
          <button onClick={handleSubmit} disabled={createMut.isLoading || updateMut.isLoading} className="btn-primary">
            {createMut.isLoading || updateMut.isLoading ? 'Saving...' : editId ? 'Update vehicle' : 'Add vehicle'}
          </button>
          <button onClick={resetForm} className="btn-secondary">Cancel</button>
        </div>
      </div>
    );
  }

  // --- List view (card grid) ---
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Fleet</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reg / owner..." className="input pl-9 w-56" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="select w-40">
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Add vehicle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
        {isLoading && <div className="col-span-full text-center text-slate-400 text-sm py-8">Loading fleet...</div>}
        {!isLoading && vehicles.length === 0 && <div className="col-span-full text-center text-slate-400 text-sm py-8">No vehicles found</div>}
        {vehicles.map((v: any) => {
          const badgeCls = STATUS_BADGE[v.status] || STATUS_BADGE.INACTIVE;
          const rcDays = daysUntil(v.rcExpiry);
          const insDays = daysUntil(v.insuranceExpiry);
          return (
            <div key={v.id} className="card p-3.5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm font-medium text-slate-800">{v.regNumber}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{v.make} {v.model} · {v.type} · {v.capacityMT}MT</div>
                </div>
                <span className={badgeCls}>{v.status.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {[
                  ['Owner', v.ownerName || '—', 'text-slate-700'],
                  ['GPS', v.gpsEnabled ? 'Enabled' : 'Disabled', 'text-slate-700'],
                  ['RC expiry', v.rcExpiry ? `${rcDays! >= 0 ? rcDays + 'd' : 'EXPIRED'}` : '—', expiryClass(rcDays)],
                  ['Insurance', v.insuranceExpiry ? `${insDays! >= 0 ? insDays + 'd' : 'EXPIRED'}` : '—', expiryClass(insDays)],
                ].map(([l, val, cls]) => (
                  <div key={l} className="text-xs">
                    <span className="text-slate-400">{l}: </span>
                    <span className={`font-medium ${cls}`}>{val}</span>
                  </div>
                ))}
              </div>
              {v.gpsEnabled && v.currentLat && (
                <div className="mt-2 text-[11px] text-slate-400">
                  Last ping: {v.lastPingAt ? new Date(v.lastPingAt).toLocaleTimeString('en-IN') : '—'} · {v.lastSpeed ?? 0} km/h
                </div>
              )}
              <div className="mt-3 pt-2 border-t border-slate-100">
                <button onClick={() => openEdit(v)} className="btn-secondary btn-sm">
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
