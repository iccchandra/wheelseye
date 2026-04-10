import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { vehicleApi, vehicleGroupApi } from '../services/api';
import { FileUpload } from '../components/common/FileUpload';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  AVAILABLE:   { bg: '#EAF3DE', color: '#3B6D11' },
  ON_TRIP:     { bg: '#E6F1FB', color: '#185FA5' },
  MAINTENANCE: { bg: '#FAEEDA', color: '#854F0B' },
  INACTIVE:    { bg: '#F1EFE8', color: '#5F5E5A' },
};

const STATUSES = ['AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE'];
const TYPES = ['OPEN', 'CONTAINER', 'TRAILER', 'FLATBED', 'MINI', 'REFRIGERATED'];

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
function expiryColor(days: number | null) {
  if (days === null) return 'var(--text-tertiary)';
  if (days < 0) return '#A32D2D';
  if (days < 30) return '#BA7517';
  return 'var(--text-secondary)';
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

const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };
const labelStyle: React.CSSProperties = { fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };
const sectionStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 10, marginTop: 18, paddingBottom: 6, borderBottom: '0.5px solid var(--border)' };

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
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{editId ? 'Edit vehicle' : 'Add vehicle'}</div>
          <button onClick={resetForm} style={{ padding: '6px 14px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <div style={{ ...sectionStyle, marginTop: 0 }}>Basic Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={labelStyle}>Reg Number *</label><input value={form.regNumber} onChange={e => set('regNumber', e.target.value)} placeholder="e.g. MH 01 AB 1234" style={inputStyle} /></div>
            <div><label style={labelStyle}>Type</label><select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={labelStyle}>Status</label><select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label style={labelStyle}>Capacity (MT)</label><input type="number" value={form.capacityMT} onChange={e => set('capacityMT', e.target.value)} min="0" step="0.5" style={inputStyle} /></div>
            <div><label style={labelStyle}>Make</label><input value={form.make} onChange={e => set('make', e.target.value)} placeholder="e.g. TATA" style={inputStyle} /></div>
            <div><label style={labelStyle}>Model</label><input value={form.model} onChange={e => set('model', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Year</label><input type="number" value={form.year} onChange={e => set('year', e.target.value)} min="1990" max="2030" style={inputStyle} /></div>
            <div><label style={labelStyle}>Group</label><select value={form.groupId} onChange={e => set('groupId', e.target.value)} style={inputStyle}><option value="">No group</option>{groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          </div>

          <div style={sectionStyle}>Owner Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={labelStyle}>Owner Name</label><input value={form.ownerName} onChange={e => set('ownerName', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Owner Phone</label><input value={form.ownerPhone} onChange={e => set('ownerPhone', e.target.value)} style={inputStyle} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
              <input type="checkbox" checked={form.isOwned as boolean} onChange={e => set('isOwned', e.target.checked as any)} id="isOwned" />
              <label htmlFor="isOwned" style={{ fontSize: 13, cursor: 'pointer' }}>Company owned</label>
            </div>
          </div>

          <div style={sectionStyle}>Documents & Expiry</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={labelStyle}>RC Number</label><input value={form.rcNumber} onChange={e => set('rcNumber', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>RC Expiry</label><input type="date" value={form.rcExpiry} onChange={e => set('rcExpiry', e.target.value)} style={inputStyle} /></div>
            <FileUpload label="RC Document" value={form.rcDocUrl} category="vehicle-rc" accept="image/*,.pdf" onChange={v => set('rcDocUrl', v)} />
            <div><label style={labelStyle}>Insurance Expiry</label><input type="date" value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)} style={inputStyle} /></div>
            <FileUpload label="Insurance Document" value={form.insuranceDocUrl} category="vehicle-insurance" accept="image/*,.pdf" onChange={v => set('insuranceDocUrl', v)} />
            <div><label style={labelStyle}>Pollution Expiry</label><input type="date" value={form.pollutionExpiry} onChange={e => set('pollutionExpiry', e.target.value)} style={inputStyle} /></div>
            <FileUpload label="Pollution Certificate" value={form.pollutionDocUrl} category="vehicle-pollution" accept="image/*,.pdf" onChange={v => set('pollutionDocUrl', v)} />
            <div><label style={labelStyle}>Fitness Expiry</label><input type="date" value={form.fitnessExpiry} onChange={e => set('fitnessExpiry', e.target.value)} style={inputStyle} /></div>
            <FileUpload label="Fitness Certificate" value={form.fitnessDocUrl} category="vehicle-fitness" accept="image/*,.pdf" onChange={v => set('fitnessDocUrl', v)} />
            <div><label style={labelStyle}>Permit Expiry</label><input type="date" value={form.permitExpiry} onChange={e => set('permitExpiry', e.target.value)} style={inputStyle} /></div>
            <FileUpload label="Permit Document" value={form.permitDocUrl} category="vehicle-permit" accept="image/*,.pdf" onChange={v => set('permitDocUrl', v)} />
          </div>

          <div style={sectionStyle}>GPS & Tracking</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={labelStyle}>GPS Device ID</label><input value={form.gpsDeviceId} onChange={e => set('gpsDeviceId', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>FASTag ID</label><input value={form.fastTagId} onChange={e => set('fastTagId', e.target.value)} style={inputStyle} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
              <input type="checkbox" checked={form.gpsEnabled as boolean} onChange={e => set('gpsEnabled', e.target.checked as any)} id="gpsEnabled" />
              <label htmlFor="gpsEnabled" style={{ fontSize: 13, cursor: 'pointer' }}>GPS enabled</label>
            </div>
          </div>

          {error && <div style={{ marginTop: 14, fontSize: 13, color: '#A32D2D', padding: '8px 12px', background: '#FCEBEB', borderRadius: 7 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button onClick={handleSubmit} disabled={createMut.isLoading || updateMut.isLoading} style={{ padding: '8px 24px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: (createMut.isLoading || updateMut.isLoading) ? 0.7 : 1 }}>
              {createMut.isLoading || updateMut.isLoading ? 'Saving...' : editId ? 'Update vehicle' : 'Add vehicle'}
            </button>
            <button onClick={resetForm} style={{ padding: '8px 20px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // --- List view (card grid) ---
  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Fleet</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reg / owner..." style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', width: 220 }} />
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: '6px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>+ Add vehicle</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {isLoading && <div style={{ gridColumn: '1/-1', padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading fleet...</div>}
        {!isLoading && vehicles.length === 0 && <div style={{ gridColumn: '1/-1', padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No vehicles found</div>}
        {vehicles.map((v: any) => {
          const ss = STATUS_STYLE[v.status] || STATUS_STYLE.INACTIVE;
          const rcDays = daysUntil(v.rcExpiry);
          const insDays = daysUntil(v.insuranceExpiry);
          return (
            <div key={v.id} style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{v.regNumber}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 1 }}>{v.make} {v.model} · {v.type} · {v.capacityMT}MT</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 7px', borderRadius: 4, background: ss.bg, color: ss.color }}>{v.status.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 8 }}>
                {[
                  ['Owner', v.ownerName || '—'],
                  ['GPS', v.gpsEnabled ? 'Enabled' : 'Disabled'],
                  ['RC expiry', v.rcExpiry ? `${rcDays! >= 0 ? rcDays + 'd' : 'EXPIRED'}` : '—'],
                  ['Insurance', v.insuranceExpiry ? `${insDays! >= 0 ? insDays + 'd' : 'EXPIRED'}` : '—'],
                ].map(([l, val]) => (
                  <div key={l} style={{ fontSize: 11.5 }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{l}: </span>
                    <span style={{ color: l === 'RC expiry' ? expiryColor(rcDays) : l === 'Insurance' ? expiryColor(insDays) : 'var(--text-primary)', fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
              </div>
              {v.gpsEnabled && v.currentLat && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Last ping: {v.lastPingAt ? new Date(v.lastPingAt).toLocaleTimeString('en-IN') : '—'} · {v.lastSpeed ?? 0} km/h
                </div>
              )}
              <div style={{ marginTop: 10, borderTop: '0.5px solid var(--border)', paddingTop: 8 }}>
                <button onClick={() => openEdit(v)} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Edit</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
