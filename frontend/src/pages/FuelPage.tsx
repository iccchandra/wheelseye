import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fuelApi, vehicleApi, driverApi } from '../services/api';

const FUEL_TYPES = ['DIESEL', 'PETROL', 'CNG', 'ELECTRIC'];

export const FuelPage: React.FC = () => {
  const qc = useQueryClient();
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    vehicleId: '', driverId: '', quantity: '', pricePerUnit: '', totalAmount: '',
    odometerReading: '', fillDate: '', fuelType: 'DIESEL', station: '', comments: '',
  });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery(
    ['fuel', vehicleFilter, dateFrom, dateTo],
    () => fuelApi.getAll({
      vehicleId: vehicleFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    { keepPreviousData: true },
  );

  const { data: reportData } = useQuery(
    ['fuel-report', vehicleFilter, dateFrom, dateTo],
    () => fuelApi.getReport({
      vehicleId: vehicleFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    { keepPreviousData: true },
  );

  const { data: vehiclesData } = useQuery('vehicles-all', () => vehicleApi.getAll());
  const { data: driversData } = useQuery('drivers-all', () => driverApi.getAll());
  const vehicles = vehiclesData?.data || [];
  const drivers = driversData?.data || [];

  const responseData = data?.data;
  const entries = Array.isArray(responseData) ? responseData : responseData?.data || [];
  const report = reportData?.data || {};

  const createMutation = useMutation(
    (data: any) => fuelApi.create(data),
    { onSuccess: () => { qc.invalidateQueries('fuel'); qc.invalidateQueries('fuel-report'); resetForm(); } },
  );
  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => fuelApi.update(id, data),
    { onSuccess: () => { qc.invalidateQueries('fuel'); qc.invalidateQueries('fuel-report'); resetForm(); } },
  );
  const deleteMutation = useMutation(
    (id: string) => fuelApi.remove(id),
    { onSuccess: () => { qc.invalidateQueries('fuel'); qc.invalidateQueries('fuel-report'); } },
  );

  const set = (field: string, value: string) => {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === 'quantity' || field === 'pricePerUnit') {
        const qty = parseFloat(field === 'quantity' ? value : next.quantity) || 0;
        const ppu = parseFloat(field === 'pricePerUnit' ? value : next.pricePerUnit) || 0;
        next.totalAmount = qty && ppu ? (qty * ppu).toFixed(2) : '';
      }
      return next;
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setError('');
    setForm({ vehicleId: '', driverId: '', quantity: '', pricePerUnit: '', totalAmount: '', odometerReading: '', fillDate: '', fuelType: 'DIESEL', station: '', comments: '' });
  };

  const openEdit = (entry: any) => {
    setEditId(entry.id);
    setForm({
      vehicleId: entry.vehicleId || '',
      driverId: entry.driverId || '',
      quantity: String(entry.quantity || ''),
      pricePerUnit: String(entry.pricePerUnit || ''),
      totalAmount: String(entry.totalAmount || ''),
      odometerReading: String(entry.odometerReading || ''),
      fillDate: entry.fillDate ? entry.fillDate.slice(0, 10) : '',
      fuelType: entry.fuelType || 'DIESEL',
      station: entry.station || '',
      comments: entry.comments || '',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.vehicleId || !form.quantity || !form.pricePerUnit || !form.fillDate) {
      setError('Vehicle, quantity, price per unit and fill date are required'); return;
    }
    setError('');
    const payload = {
      vehicleId: form.vehicleId,
      driverId: form.driverId || undefined,
      quantity: parseFloat(form.quantity),
      pricePerUnit: parseFloat(form.pricePerUnit),
      totalAmount: parseFloat(form.totalAmount) || parseFloat(form.quantity) * parseFloat(form.pricePerUnit),
      odometerReading: form.odometerReading ? parseFloat(form.odometerReading) : undefined,
      fillDate: form.fillDate,
      fuelType: form.fuelType,
      station: form.station || undefined,
      comments: form.comments || undefined,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };
  const labelStyle: React.CSSProperties = { fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Fuel management</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
            <option value="">All vehicles</option>
            {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }} />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }} />
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, background: '#185FA5', color: '#fff', border: 'none', cursor: 'pointer' }}>+ Add fuel</button>
        </div>
      </div>

      {/* Report cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total quantity', value: `${(report.totalQuantity || 0).toLocaleString('en-IN')} L`, color: '#185FA5', bg: '#E6F1FB' },
          { label: 'Total cost', value: `₹${(report.totalCost || 0).toLocaleString('en-IN')}`, color: '#A32D2D', bg: '#FCEBEB' },
          { label: 'Avg price / L', value: `₹${(report.avgPricePerUnit || 0).toFixed(2)}`, color: '#3B6D11', bg: '#EAF3DE' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 14 }}>{editId ? 'Edit fuel entry' : 'Add fuel entry'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Vehicle *</label>
              <select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} style={inputStyle}>
                <option value="">-- Select vehicle --</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Driver</label>
              <select value={form.driverId} onChange={e => set('driverId', e.target.value)} style={inputStyle}>
                <option value="">-- Select driver --</option>
                {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fill date *</label>
              <input type="date" value={form.fillDate} onChange={e => set('fillDate', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Quantity (L) *</label>
              <input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="e.g. 120" min="0" step="0.01" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Price / L *</label>
              <input type="number" value={form.pricePerUnit} onChange={e => set('pricePerUnit', e.target.value)} placeholder="e.g. 89.50" min="0" step="0.01" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Total amount</label>
              <input type="number" value={form.totalAmount} readOnly style={{ ...inputStyle, background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }} />
            </div>
            <div>
              <label style={labelStyle}>Odometer</label>
              <input type="number" value={form.odometerReading} onChange={e => set('odometerReading', e.target.value)} placeholder="e.g. 45230" min="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fuel type</label>
              <select value={form.fuelType} onChange={e => set('fuelType', e.target.value)} style={inputStyle}>
                {FUEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Station</label>
              <input value={form.station} onChange={e => set('station', e.target.value)} placeholder="e.g. HP Pump, NH44" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Comments</label>
              <input value={form.comments} onChange={e => set('comments', e.target.value)} placeholder="Optional notes..." style={inputStyle} />
            </div>

            {error && <div style={{ gridColumn: '1/-1', fontSize: 13, color: '#A32D2D', padding: '8px 12px', background: '#FCEBEB', borderRadius: 7 }}>{error}</div>}

            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={handleSubmit} disabled={createMutation.isLoading || updateMutation.isLoading} style={{ padding: '8px 20px', borderRadius: 7, background: '#185FA5', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: (createMutation.isLoading || updateMutation.isLoading) ? 0.7 : 1 }}>
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editId ? 'Update' : 'Add entry'}
              </button>
              <button onClick={resetForm} style={{ padding: '8px 20px', borderRadius: 7, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Fill date', 'Vehicle', 'Driver', 'Quantity (L)', 'Price/L', 'Total (₹)', 'Odometer', 'Station', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading...</td></tr>}
            {!isLoading && entries.length === 0 && <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No fuel entries found</td></tr>}
            {entries.map((f: any) => (
              <tr key={f.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)' }}>{f.fillDate ? new Date(f.fillDate).toLocaleDateString('en-IN') : '—'}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{f.vehicle?.regNumber || '—'}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{f.driver?.name || '—'}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)' }}>{f.quantity?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>₹{(f.pricePerUnit || 0).toFixed(2)}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>₹{(f.totalAmount || 0).toLocaleString('en-IN')}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{f.odometerReading ? f.odometerReading.toLocaleString('en-IN') : '—'}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{f.station || '—'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(f)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => { if (window.confirm('Delete this fuel entry?')) deleteMutation.mutate(f.id); }} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid #FCEBEB', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
