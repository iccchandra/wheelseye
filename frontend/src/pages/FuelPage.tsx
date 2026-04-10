import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fuelApi, vehicleApi, driverApi } from '../services/api';
import { Plus, Edit, Trash2, Fuel, DollarSign, TrendingUp } from 'lucide-react';

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

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Fuel management</h1>
        <div className="flex gap-2">
          <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="select">
            <option value="">All vehicles</option>
            {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input w-auto" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input w-auto" />
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
            <Plus size={15} /> Add fuel
          </button>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total quantity', value: `${(report.totalQuantity || 0).toLocaleString('en-IN')} L`, icon: Fuel, barColor: 'bg-brand-500' },
          { label: 'Total cost', value: `\u20B9${(report.totalCost || 0).toLocaleString('en-IN')}`, icon: DollarSign, barColor: 'bg-red-500' },
          { label: 'Avg price / L', value: `\u20B9${(report.avgPricePerUnit || 0).toFixed(2)}`, icon: TrendingUp, barColor: 'bg-emerald-500' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className={`stat-card-bar ${c.barColor}`} />
            <div className="flex items-center gap-3 mt-1">
              <c.icon size={18} className="text-slate-400" />
              <div>
                <div className="text-xs text-slate-400">{c.label}</div>
                <div className="text-lg font-semibold text-slate-800">{c.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="form-section">
          <div className="form-section-title">{editId ? 'Edit fuel entry' : 'Add fuel entry'}</div>
          <div className="form-grid">
            <div>
              <label className="form-label">Vehicle *</label>
              <select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} className="select">
                <option value="">-- Select vehicle --</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Driver</label>
              <select value={form.driverId} onChange={e => set('driverId', e.target.value)} className="select">
                <option value="">-- Select driver --</option>
                {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Fill date *</label>
              <input type="date" value={form.fillDate} onChange={e => set('fillDate', e.target.value)} className="input" />
            </div>
            <div>
              <label className="form-label">Quantity (L) *</label>
              <input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="e.g. 120" min="0" step="0.01" className="input" />
            </div>
            <div>
              <label className="form-label">Price / L *</label>
              <input type="number" value={form.pricePerUnit} onChange={e => set('pricePerUnit', e.target.value)} placeholder="e.g. 89.50" min="0" step="0.01" className="input" />
            </div>
            <div>
              <label className="form-label">Total amount</label>
              <input type="number" value={form.totalAmount} readOnly className="input bg-slate-50 text-slate-400" />
            </div>
            <div>
              <label className="form-label">Odometer</label>
              <input type="number" value={form.odometerReading} onChange={e => set('odometerReading', e.target.value)} placeholder="e.g. 45230" min="0" className="input" />
            </div>
            <div>
              <label className="form-label">Fuel type</label>
              <select value={form.fuelType} onChange={e => set('fuelType', e.target.value)} className="select">
                {FUEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Station</label>
              <input value={form.station} onChange={e => set('station', e.target.value)} placeholder="e.g. HP Pump, NH44" className="input" />
            </div>
            <div className="col-span-full">
              <label className="form-label">Comments</label>
              <input value={form.comments} onChange={e => set('comments', e.target.value)} placeholder="Optional notes..." className="input" />
            </div>

            {error && <div className="col-span-full text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

            <div className="col-span-full flex gap-2 mt-1">
              <button onClick={handleSubmit} disabled={createMutation.isLoading || updateMutation.isLoading} className="btn-primary">
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editId ? 'Update' : 'Add entry'}
              </button>
              <button onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {['Fill date', 'Vehicle', 'Driver', 'Quantity (L)', 'Price/L', 'Total (\u20B9)', 'Odometer', 'Station', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="text-center text-slate-400 py-6">Loading...</td></tr>}
            {!isLoading && entries.length === 0 && <tr><td colSpan={9} className="text-center text-slate-400 py-6">No fuel entries found</td></tr>}
            {entries.map((f: any) => (
              <tr key={f.id}>
                <td className="text-slate-700">{f.fillDate ? new Date(f.fillDate).toLocaleDateString('en-IN') : '\u2014'}</td>
                <td className="font-medium text-slate-800">{f.vehicle?.regNumber || '\u2014'}</td>
                <td className="text-xs text-slate-500">{f.driver?.name || '\u2014'}</td>
                <td className="text-slate-700">{f.quantity?.toLocaleString('en-IN')}</td>
                <td className="text-slate-500">{'\u20B9'}{(f.pricePerUnit || 0).toFixed(2)}</td>
                <td className="font-medium text-slate-800">{'\u20B9'}{(f.totalAmount || 0).toLocaleString('en-IN')}</td>
                <td className="text-xs text-slate-500">{f.odometerReading ? f.odometerReading.toLocaleString('en-IN') : '\u2014'}</td>
                <td className="text-xs text-slate-500">{f.station || '\u2014'}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(f)} className="btn-secondary btn-sm">
                      <Edit size={13} />
                    </button>
                    <button onClick={() => { if (window.confirm('Delete this fuel entry?')) deleteMutation.mutate(f.id); }} className="btn-danger btn-sm">
                      <Trash2 size={13} />
                    </button>
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
