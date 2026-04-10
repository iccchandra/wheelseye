import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { driverApi } from '../services/api';
import { FileUpload } from '../components/common/FileUpload';
import { Plus, Search, Edit, X, Eye, Phone, MapPin, Award, Calendar, Shield, User, FileText, Heart, AlertTriangle } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:      'badge-green',
  ON_TRIP:     'badge-blue',
  INACTIVE:    'badge-gray',
  BLACKLISTED: 'badge-red',
};

const STATUSES = ['ACTIVE', 'ON_TRIP', 'INACTIVE', 'BLACKLISTED'];
const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const NATIONALITIES = ['India', 'Australia', 'USA', 'UK', 'Japan', 'Germany', 'France', 'Srilanka', 'Russia'];
const EDUCATION = ['SSC', 'INTER', 'Bachelor Degree', 'Other'];
const DRIVER_TYPES = ['Company', 'Business Associate'];

function scoreColor(score: number) {
  if (score >= 4.5) return 'text-emerald-600';
  if (score >= 3.5) return 'text-amber-600';
  return 'text-red-600';
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

export const DriversPage: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [viewDriver, setViewDriver] = useState<any>(null);

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

  // --- View detail ---
  if (viewDriver) {
    const d = viewDriver;
    const sc = STATUS_BADGE[d.status] || 'badge-gray';
    const dlDays = daysUntil(d.licenceExpiry);

    const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
      <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
        <Icon size={15} className="text-slate-400 shrink-0" />
        <span className="text-xs text-slate-400 w-32 shrink-0">{label}</span>
        <span className="text-sm font-medium text-slate-800">{value || '—'}</span>
      </div>
    );

    return (
      <div className="page">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewDriver(null)} className="btn-secondary btn-sm"><X className="w-3.5 h-3.5" /> Back</button>
            <h1 className="page-title">Driver Details</h1>
          </div>
          <button onClick={() => { openEdit(d); setViewDriver(null); }} className="btn-primary btn-sm"><Edit className="w-3.5 h-3.5" /> Edit</button>
        </div>

        {/* Header card */}
        <div className="card p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {d.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800">{d.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Phone size={13} /> {d.phone}</span>
                {d.email && <span>· {d.email}</span>}
              </div>
            </div>
            <div className="text-right">
              <span className={`${sc} !text-xs`}>{d.status}</span>
              <div className="mt-2 flex items-center gap-1">
                <Award size={16} className={scoreColor(d.safetyScore || 5)} />
                <span className={`text-lg font-bold ${scoreColor(d.safetyScore || 5)}`}>{(d.safetyScore || 5).toFixed(1)}</span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Total Trips', value: d.totalTrips || 0, color: 'text-blue-600' },
              { label: 'Total KM', value: (d.totalKm || 0).toLocaleString('en-IN'), color: 'text-emerald-600' },
              { label: 'Experience', value: d.totalExperience ? `${d.totalExperience} yrs` : '—', color: 'text-violet-600' },
              { label: 'DL Expiry', value: dlDays !== null ? (dlDays >= 0 ? `${dlDays} days` : 'EXPIRED') : '—', color: dlDays !== null && dlDays < 30 ? 'text-red-600' : 'text-slate-700' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className={`text-lg font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Personal Info */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><User size={15} /> Personal Information</h3>
            <InfoRow icon={User} label="Date of Birth" value={d.dateOfBirth ? new Date(d.dateOfBirth).toLocaleDateString('en-IN') : ''} />
            <InfoRow icon={User} label="Gender" value={d.gender} />
            <InfoRow icon={Heart} label="Blood Group" value={d.bloodGroup} />
            <InfoRow icon={MapPin} label="Nationality" value={d.nationality} />
            <InfoRow icon={FileText} label="Education" value={d.education} />
            <InfoRow icon={User} label="Driver Type" value={d.driverType} />
            <InfoRow icon={Calendar} label="Date of Joining" value={d.dateOfJoining ? new Date(d.dateOfJoining).toLocaleDateString('en-IN') : ''} />
            <InfoRow icon={Shield} label="Badge Number" value={d.badgeNumber} />
          </div>

          {/* Licence Info */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><FileText size={15} /> Licence Information</h3>
            <InfoRow icon={FileText} label="Licence Number" value={d.licenceNumber} />
            <InfoRow icon={FileText} label="Ref Number" value={d.licenceRefNumber} />
            <InfoRow icon={Calendar} label="First Issue Date" value={d.licenceFirstIssueDate ? new Date(d.licenceFirstIssueDate).toLocaleDateString('en-IN') : ''} />
            <InfoRow icon={MapPin} label="Licensing Authority" value={d.licencingAuthority} />
            <InfoRow icon={FileText} label="Transport Type" value={d.transportLicenceType} />
            <InfoRow icon={Calendar} label="Transport Expiry" value={d.transportLicenceExpiry ? new Date(d.transportLicenceExpiry).toLocaleDateString('en-IN') : ''} />
            <InfoRow icon={FileText} label="Non-Transport Type" value={d.nonTransportLicenceType} />
            <InfoRow icon={Calendar} label="Non-Transport Expiry" value={d.nonTransportLicenceExpiry ? new Date(d.nonTransportLicenceExpiry).toLocaleDateString('en-IN') : ''} />
          </div>

          {/* ID & Documents */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Shield size={15} /> ID & Documents</h3>
            <InfoRow icon={Shield} label="Aadhaar Number" value={d.aadhaarNumber} />
            {d.photoUrl && <div className="flex items-center gap-3 py-2 border-b border-slate-100"><span className="text-xs text-slate-400 w-32">Photo</span><a href={d.photoUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">View Photo</a>{/\.(jpg|jpeg|png|gif|webp)$/i.test(d.photoUrl) && <img src={d.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover border" />}</div>}
            {d.licenceImageUrl && <div className="flex items-center gap-3 py-2 border-b border-slate-100"><span className="text-xs text-slate-400 w-32">Licence Image</span><a href={d.licenceImageUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">View Document</a></div>}
            {d.aadhaarImageUrl && <div className="flex items-center gap-3 py-2"><span className="text-xs text-slate-400 w-32">Aadhaar Image</span><a href={d.aadhaarImageUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">View Document</a></div>}
          </div>

          {/* Address & Emergency */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><MapPin size={15} /> Address & Emergency</h3>
            <InfoRow icon={MapPin} label="Current Address" value={d.address} />
            <InfoRow icon={MapPin} label="As per Licence" value={d.addressAsPerLicence} />
            <InfoRow icon={MapPin} label="As per Aadhaar" value={d.addressAsPerAadhaar} />
            <div className="border-t border-slate-200 mt-2 pt-2">
              <h4 className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1"><AlertTriangle size={12} /> Emergency Contact</h4>
              <InfoRow icon={User} label="Name" value={d.emergencyContactName} />
              <InfoRow icon={Phone} label="Number" value={d.emergencyContact} />
              <InfoRow icon={User} label="Relation" value={d.emergencyContactRelation} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Form view ---
  if (showForm) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">{editId ? 'Edit driver' : 'Add driver'}</h1>
          <button onClick={resetForm} className="btn-secondary btn-sm">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>

        {/* Basic info */}
        <div className="form-section">
          <div className="form-section-title">Basic Information</div>
          <div className="form-grid">
            <div><label className="form-label">Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="input" /></div>
            <div><label className="form-label">Phone *</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="input" /></div>
            <div><label className="form-label">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input" /></div>
            <div><label className="form-label">Date of Birth</label><input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className="input" /></div>
            <div><label className="form-label">Gender</label><select value={form.gender} onChange={e => set('gender', e.target.value)} className="select"><option value="">Select...</option>{GENDERS.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            <div><label className="form-label">Blood Group</label><select value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)} className="select"><option value="">Select...</option>{BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
            <div><label className="form-label">Nationality</label><select value={form.nationality} onChange={e => set('nationality', e.target.value)} className="select">{NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            <div><label className="form-label">Education</label><select value={form.education} onChange={e => set('education', e.target.value)} className="select"><option value="">Select...</option>{EDUCATION.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
            <div>
              <label className="form-label">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="select">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Employment */}
        <div className="form-section">
          <div className="form-section-title">Employment Details</div>
          <div className="form-grid">
            <div><label className="form-label">Driver Type</label><select value={form.driverType} onChange={e => set('driverType', e.target.value)} className="select">{DRIVER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="form-label">Date of Joining</label><input type="date" value={form.dateOfJoining} onChange={e => set('dateOfJoining', e.target.value)} className="input" /></div>
            <div><label className="form-label">Total Experience (years)</label><input type="number" value={form.totalExperience} onChange={e => set('totalExperience', e.target.value)} min="0" step="0.5" className="input" /></div>
            <div><label className="form-label">Badge Number</label><input value={form.badgeNumber} onChange={e => set('badgeNumber', e.target.value)} className="input" /></div>
          </div>
        </div>

        {/* Licence */}
        <div className="form-section">
          <div className="form-section-title">Licence Information</div>
          <div className="form-grid">
            <div><label className="form-label">Licence Number</label><input value={form.licenceNumber} onChange={e => set('licenceNumber', e.target.value)} className="input" /></div>
            <div><label className="form-label">Licence Ref Number</label><input value={form.licenceRefNumber} onChange={e => set('licenceRefNumber', e.target.value)} className="input" /></div>
            <div><label className="form-label">First Issue Date</label><input type="date" value={form.licenceFirstIssueDate} onChange={e => set('licenceFirstIssueDate', e.target.value)} className="input" /></div>
            <div><label className="form-label">Licencing Authority</label><input value={form.licencingAuthority} onChange={e => set('licencingAuthority', e.target.value)} className="input" /></div>
            <div><label className="form-label">Transport Licence Type</label><input value={form.transportLicenceType} onChange={e => set('transportLicenceType', e.target.value)} className="input" /></div>
            <div><label className="form-label">Transport Licence Expiry</label><input type="date" value={form.transportLicenceExpiry} onChange={e => set('transportLicenceExpiry', e.target.value)} className="input" /></div>
            <div><label className="form-label">Non-Transport Licence Type</label><input value={form.nonTransportLicenceType} onChange={e => set('nonTransportLicenceType', e.target.value)} className="input" /></div>
            <div><label className="form-label">Non-Transport Licence Expiry</label><input type="date" value={form.nonTransportLicenceExpiry} onChange={e => set('nonTransportLicenceExpiry', e.target.value)} className="input" /></div>
          </div>
        </div>

        {/* ID & Documents */}
        <div className="form-section">
          <div className="form-section-title">ID & Documents</div>
          <div className="form-grid">
            <div><label className="form-label">Aadhaar Number</label><input value={form.aadhaarNumber} onChange={e => set('aadhaarNumber', e.target.value)} className="input" /></div>
            <FileUpload label="Driver Photo" value={form.photoUrl} category="driver-photo" accept="image/*" onChange={v => set('photoUrl', v)} />
            <FileUpload label="Licence Image" value={form.licenceImageUrl} category="driver-licence" accept="image/*,.pdf" onChange={v => set('licenceImageUrl', v)} />
            <FileUpload label="Aadhaar Image" value={form.aadhaarImageUrl} category="driver-aadhaar" accept="image/*,.pdf" onChange={v => set('aadhaarImageUrl', v)} />
          </div>
        </div>

        {/* Address */}
        <div className="form-section">
          <div className="form-section-title">Address</div>
          <div className="form-grid">
            <div><label className="form-label">Current Address</label><input value={form.address} onChange={e => set('address', e.target.value)} className="input" /></div>
            <div><label className="form-label">Address as per Licence</label><input value={form.addressAsPerLicence} onChange={e => set('addressAsPerLicence', e.target.value)} className="input" /></div>
            <div><label className="form-label">Address as per Aadhaar</label><input value={form.addressAsPerAadhaar} onChange={e => set('addressAsPerAadhaar', e.target.value)} className="input" /></div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="form-section">
          <div className="form-section-title">Emergency Contact</div>
          <div className="form-grid">
            <div><label className="form-label">Contact Name</label><input value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} className="input" /></div>
            <div><label className="form-label">Contact Number</label><input value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} className="input" /></div>
            <div><label className="form-label">Relation</label><input value={form.emergencyContactRelation} onChange={e => set('emergencyContactRelation', e.target.value)} className="input" /></div>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="flex gap-2">
          <button onClick={handleSubmit} disabled={createMut.isLoading || updateMut.isLoading} className="btn-primary">
            {createMut.isLoading || updateMut.isLoading ? 'Saving...' : editId ? 'Update driver' : 'Add driver'}
          </button>
          <button onClick={resetForm} className="btn-secondary">Cancel</button>
        </div>
      </div>
    );
  }

  // --- List view ---
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Drivers</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / phone / DL..." className="input pl-9 w-60" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="select w-40">
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Add driver
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {['Driver', 'Phone', 'Licence', 'Trips', 'Safety score', 'DL expiry', 'Status', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} className="text-center text-slate-400 py-6">Loading...</td></tr>}
            {!isLoading && drivers.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-6">No drivers found</td></tr>}
            {drivers.map((d: any) => {
              const badgeCls = STATUS_BADGE[d.status] || STATUS_BADGE.INACTIVE;
              const dlDays = daysUntil(d.licenceExpiry);
              return (
                <tr key={d.id}>
                  <td>
                    <div className="font-medium text-slate-800">{d.name}</div>
                    <div className="text-xs text-slate-400">{d.totalKm?.toLocaleString('en-IN') || 0} km total</div>
                  </td>
                  <td className="text-slate-500">{d.phone}</td>
                  <td className="text-slate-500 text-xs">{d.licenceNumber || '—'}</td>
                  <td className="font-medium text-slate-800">{d.totalTrips || 0}</td>
                  <td>
                    <span className={`font-medium ${scoreColor(d.safetyScore || 5)}`}>
                      {(d.safetyScore || 5).toFixed(1)} / 5.0
                    </span>
                  </td>
                  <td className={`text-xs ${dlDays !== null && dlDays < 30 ? 'text-red-600' : 'text-slate-500'}`}>
                    {d.licenceExpiry ? `${dlDays! >= 0 ? dlDays + 'd' : 'EXPIRED'}` : '—'}
                  </td>
                  <td>
                    <span className={badgeCls}>{d.status}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setViewDriver(d)} className="btn-primary btn-sm">
                        <Eye className="w-3 h-3" /> View
                      </button>
                      <button onClick={() => openEdit(d)} className="btn-secondary btn-sm">
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                    </div>
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
