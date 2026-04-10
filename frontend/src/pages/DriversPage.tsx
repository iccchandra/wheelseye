import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { driverApi } from '../services/api';
import { FileUpload } from '../components/common/FileUpload';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE:      { bg: '#EAF3DE', color: '#3B6D11' },
  ON_TRIP:     { bg: '#E6F1FB', color: '#185FA5' },
  INACTIVE:    { bg: '#F1EFE8', color: '#5F5E5A' },
  BLACKLISTED: { bg: '#FCEBEB', color: '#A32D2D' },
};

const STATUSES = ['ACTIVE', 'ON_TRIP', 'INACTIVE', 'BLACKLISTED'];
const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const NATIONALITIES = ['India', 'Australia', 'USA', 'UK', 'Japan', 'Germany', 'France', 'Srilanka', 'Russia'];
const EDUCATION = ['SSC', 'INTER', 'Bachelor Degree', 'Other'];
const DRIVER_TYPES = ['Company', 'Business Associate'];

function scoreColor(score: number) {
  if (score >= 4.5) return '#3B6D11';
  if (score >= 3.5) return '#BA7517';
  return '#A32D2D';
}

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

const emptyForm = {
  name: '', phone: '', status: 'ACTIVE',
  licenceNumber: '', licenceExpiry: '', licenceType: '',
  aadhaarNumber: '', photoUrl: '', licenceImageUrl: '', aadhaarImageUrl: '',
  dateOfBirth: '', gender: '', bloodGroup: '', email: '', nationality: 'India', education: '',
  address: '', addressAsPerLicence: '', addressAsPerAadhaar: '',
  emergencyContact: '', emergencyContactName: '', emergencyContactRelation: '',
  badgeNumber: '', licenceRefNumber: '', licenceFirstIssueDate: '', licencingAuthority: '',
  transportLicenceType: '', transportLicenceExpiry: '', nonTransportLicenceType: '', nonTransportLicenceExpiry: '',
  dateOfJoining: '', totalExperience: '', driverType: 'Company',
};

const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };
const labelStyle: React.CSSProperties = { fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };
const sectionStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 10, marginTop: 18, paddingBottom: 6, borderBottom: '0.5px solid var(--border)' };

export const DriversPage: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery(
    ['drivers', search, status],
    () => driverApi.getAll({ search: search || undefined, status: status || undefined }),
    { keepPreviousData: true },
  );

  const drivers = data?.data || [];

  const createMut = useMutation(
    (d: any) => driverApi.create(d),
    { onSuccess: () => { qc.invalidateQueries('drivers'); resetForm(); } },
  );
  const updateMut = useMutation(
    ({ id, d }: { id: string; d: any }) => driverApi.update(id, d),
    { onSuccess: () => { qc.invalidateQueries('drivers'); resetForm(); } },
  );

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const resetForm = () => { setShowForm(false); setEditId(null); setError(''); setForm(emptyForm); };

  const openEdit = (d: any) => {
    setEditId(d.id);
    const f = { ...emptyForm };
    for (const k of Object.keys(f)) {
      const val = d[k];
      if (val != null) (f as any)[k] = typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/) ? val.slice(0, 10) : String(val);
    }
    setForm(f);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.phone) { setError('Name and phone are required'); return; }
    setError('');
    const payload: any = {};
    for (const [k, v] of Object.entries(form)) {
      if (v !== '' && v !== null) payload[k] = k === 'totalExperience' ? parseFloat(v) : v;
    }
    if (editId) updateMut.mutate({ id: editId, d: payload });
    else createMut.mutate(payload);
  };

  // --- Form view ---
  if (showForm) {
    return (
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{editId ? 'Edit driver' : 'Add driver'}</div>
          <button onClick={resetForm} style={{ padding: '6px 14px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 20 }}>
          {/* Basic info */}
          <div style={{ ...sectionStyle, marginTop: 0 }}>Basic Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={labelStyle}>Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Phone *</label><input value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Date of Birth</label><input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Gender</label><select value={form.gender} onChange={e => set('gender', e.target.value)} style={inputStyle}><option value="">Select...</option>{GENDERS.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            <div><label style={labelStyle}>Blood Group</label><select value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)} style={inputStyle}><option value="">Select...</option>{BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
            <div><label style={labelStyle}>Nationality</label><select value={form.nationality} onChange={e => set('nationality', e.target.value)} style={inputStyle}>{NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            <div><label style={labelStyle}>Education</label><select value={form.education} onChange={e => set('education', e.target.value)} style={inputStyle}><option value="">Select...</option>{EDUCATION.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Employment */}
          <div style={sectionStyle}>Employment Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={labelStyle}>Driver Type</label><select value={form.driverType} onChange={e => set('driverType', e.target.value)} style={inputStyle}>{DRIVER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={labelStyle}>Date of Joining</label><input type="date" value={form.dateOfJoining} onChange={e => set('dateOfJoining', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Total Experience (years)</label><input type="number" value={form.totalExperience} onChange={e => set('totalExperience', e.target.value)} min="0" step="0.5" style={inputStyle} /></div>
            <div><label style={labelStyle}>Badge Number</label><input value={form.badgeNumber} onChange={e => set('badgeNumber', e.target.value)} style={inputStyle} /></div>
          </div>

          {/* Licence */}
          <div style={sectionStyle}>Licence Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={labelStyle}>Licence Number</label><input value={form.licenceNumber} onChange={e => set('licenceNumber', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Licence Ref Number</label><input value={form.licenceRefNumber} onChange={e => set('licenceRefNumber', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>First Issue Date</label><input type="date" value={form.licenceFirstIssueDate} onChange={e => set('licenceFirstIssueDate', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Licencing Authority</label><input value={form.licencingAuthority} onChange={e => set('licencingAuthority', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Transport Licence Type</label><input value={form.transportLicenceType} onChange={e => set('transportLicenceType', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Transport Licence Expiry</label><input type="date" value={form.transportLicenceExpiry} onChange={e => set('transportLicenceExpiry', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Non-Transport Licence Type</label><input value={form.nonTransportLicenceType} onChange={e => set('nonTransportLicenceType', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Non-Transport Licence Expiry</label><input type="date" value={form.nonTransportLicenceExpiry} onChange={e => set('nonTransportLicenceExpiry', e.target.value)} style={inputStyle} /></div>
          </div>

          {/* ID & Documents */}
          <div style={sectionStyle}>ID & Documents</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={labelStyle}>Aadhaar Number</label><input value={form.aadhaarNumber} onChange={e => set('aadhaarNumber', e.target.value)} style={inputStyle} /></div>
            <FileUpload label="Driver Photo" value={form.photoUrl} category="driver-photo" accept="image/*" onChange={v => set('photoUrl', v)} />
            <FileUpload label="Licence Image" value={form.licenceImageUrl} category="driver-licence" accept="image/*,.pdf" onChange={v => set('licenceImageUrl', v)} />
            <FileUpload label="Aadhaar Image" value={form.aadhaarImageUrl} category="driver-aadhaar" accept="image/*,.pdf" onChange={v => set('aadhaarImageUrl', v)} />
          </div>

          {/* Address */}
          <div style={sectionStyle}>Address</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={labelStyle}>Current Address</label><input value={form.address} onChange={e => set('address', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Address as per Licence</label><input value={form.addressAsPerLicence} onChange={e => set('addressAsPerLicence', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Address as per Aadhaar</label><input value={form.addressAsPerAadhaar} onChange={e => set('addressAsPerAadhaar', e.target.value)} style={inputStyle} /></div>
          </div>

          {/* Emergency Contact */}
          <div style={sectionStyle}>Emergency Contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={labelStyle}>Contact Name</label><input value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Contact Number</label><input value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Relation</label><input value={form.emergencyContactRelation} onChange={e => set('emergencyContactRelation', e.target.value)} style={inputStyle} /></div>
          </div>

          {error && <div style={{ marginTop: 14, fontSize: 13, color: '#A32D2D', padding: '8px 12px', background: '#FCEBEB', borderRadius: 7 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button onClick={handleSubmit} disabled={createMut.isLoading || updateMut.isLoading} style={{ padding: '8px 24px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: (createMut.isLoading || updateMut.isLoading) ? 0.7 : 1 }}>
              {createMut.isLoading || updateMut.isLoading ? 'Saving...' : editId ? 'Update driver' : 'Add driver'}
            </button>
            <button onClick={resetForm} style={{ padding: '8px 20px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // --- List view ---
  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Drivers</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / phone / DL..." style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', width: 240 }} />
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: '6px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>+ Add driver</button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Driver', 'Phone', 'Licence', 'Trips', 'Safety score', 'DL expiry', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading...</td></tr>}
            {!isLoading && drivers.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No drivers found</td></tr>}
            {drivers.map((d: any) => {
              const ss = STATUS_STYLE[d.status] || STATUS_STYLE.INACTIVE;
              const dlDays = daysUntil(d.licenceExpiry);
              return (
                <tr key={d.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{d.totalKm?.toLocaleString('en-IN') || 0} km total</div>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>{d.phone}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{d.licenceNumber || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{d.totalTrips || 0}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: scoreColor(d.safetyScore || 5) }}>
                      {(d.safetyScore || 5).toFixed(1)} / 5.0
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: dlDays !== null && dlDays < 30 ? '#A32D2D' : 'var(--text-secondary)' }}>
                    {d.licenceExpiry ? `${dlDays! >= 0 ? dlDays + 'd' : 'EXPIRED'}` : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 7px', borderRadius: 4, background: ss.bg, color: ss.color }}>{d.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <button onClick={() => openEdit(d)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
