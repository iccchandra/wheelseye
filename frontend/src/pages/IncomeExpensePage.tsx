import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { incomeExpenseApi, vehicleApi } from '../services/api';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const CATEGORIES = [
  'FUEL', 'TOLL', 'MAINTENANCE', 'SALARY', 'INSURANCE', 'EMI', 'FREIGHT',
  'LOADING', 'UNLOADING', 'PENALTY', 'MISCELLANEOUS',
];

export const IncomeExpensePage: React.FC = () => {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    vehicleId: '', type: 'EXPENSE', amount: '', date: '', description: '', category: 'MISCELLANEOUS',
  });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery(
    ['income-expense', typeFilter, vehicleFilter, dateFrom, dateTo],
    () => incomeExpenseApi.getAll({
      type: typeFilter || undefined,
      vehicleId: vehicleFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    { keepPreviousData: true },
  );

  const { data: reportData } = useQuery(
    ['income-expense-report', vehicleFilter, dateFrom, dateTo],
    () => incomeExpenseApi.getReport({
      vehicleId: vehicleFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    { keepPreviousData: true },
  );

  const { data: vehiclesData } = useQuery('vehicles-all', () => vehicleApi.getAll());
  const vehicles = vehiclesData?.data || [];

  const _rd = data?.data;
  const entries = Array.isArray(_rd) ? _rd : _rd?.data || [];
  const report = reportData?.data || {};

  const createMutation = useMutation(
    (data: any) => incomeExpenseApi.create(data),
    { onSuccess: () => { qc.invalidateQueries('income-expense'); qc.invalidateQueries('income-expense-report'); resetForm(); } },
  );
  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => incomeExpenseApi.update(id, data),
    { onSuccess: () => { qc.invalidateQueries('income-expense'); qc.invalidateQueries('income-expense-report'); resetForm(); } },
  );
  const deleteMutation = useMutation(
    (id: string) => incomeExpenseApi.remove(id),
    { onSuccess: () => { qc.invalidateQueries('income-expense'); qc.invalidateQueries('income-expense-report'); } },
  );

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setError('');
    setForm({ vehicleId: '', type: 'EXPENSE', amount: '', date: '', description: '', category: 'MISCELLANEOUS' });
  };

  const openEdit = (entry: any) => {
    setEditId(entry.id);
    setForm({
      vehicleId: entry.vehicleId || '',
      type: entry.type || 'EXPENSE',
      amount: String(entry.amount || ''),
      date: entry.date ? entry.date.slice(0, 10) : '',
      description: entry.description || '',
      category: entry.category || 'MISCELLANEOUS',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.amount || !form.date || !form.type) {
      setError('Amount, date and type are required'); return;
    }
    setError('');
    const payload = {
      vehicleId: form.vehicleId || undefined,
      type: form.type,
      amount: parseFloat(form.amount),
      date: form.date,
      description: form.description || undefined,
      category: form.category,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const totalIncome = report.totalIncome || 0;
  const totalExpense = report.totalExpense || 0;
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Income &amp; expenses</h1>
        <div className="flex gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="select">
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="select">
            <option value="">All vehicles</option>
            {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input w-auto" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input w-auto" />
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
            <Plus size={15} /> Add entry
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total income', value: `\u20B9${totalIncome.toLocaleString('en-IN')}`, icon: TrendingUp, barColor: 'bg-emerald-500' },
          { label: 'Total expense', value: `\u20B9${totalExpense.toLocaleString('en-IN')}`, icon: TrendingDown, barColor: 'bg-red-500' },
          { label: 'Net profit', value: `\u20B9${netProfit.toLocaleString('en-IN')}`, icon: DollarSign, barColor: 'bg-brand-500' },
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

      {/* Form */}
      {showForm && (
        <div className="form-section">
          <div className="form-section-title">{editId ? 'Edit entry' : 'Add entry'}</div>
          <div className="form-grid">
            <div>
              <label className="form-label">Type *</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="select">
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div>
              <label className="form-label">Vehicle</label>
              <select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} className="select">
                <option value="">-- Select vehicle --</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="select">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Amount ({'\u20B9'}) *</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="e.g. 5000" min="0" step="0.01" className="input" />
            </div>
            <div>
              <label className="form-label">Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief note..." className="input" />
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
              {['Date', 'Vehicle', 'Type', 'Description', 'Category', 'Amount (\u20B9)', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center text-slate-400 py-6">Loading...</td></tr>}
            {!isLoading && entries.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-6">No entries found</td></tr>}
            {entries.map((e: any) => (
              <tr key={e.id}>
                <td className="text-slate-700">{e.date ? new Date(e.date).toLocaleDateString('en-IN') : '\u2014'}</td>
                <td className="font-medium text-slate-800">{e.vehicle?.regNumber || '\u2014'}</td>
                <td>
                  <span className={e.type === 'INCOME' ? 'badge-green' : 'badge-red'}>{e.type}</span>
                </td>
                <td className="text-xs text-slate-500">{e.description || '\u2014'}</td>
                <td className="text-xs text-slate-500">{e.category || '\u2014'}</td>
                <td className={`font-medium ${e.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {e.type === 'INCOME' ? '+' : '-'}{'\u20B9'}{(e.amount || 0).toLocaleString('en-IN')}
                </td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(e)} className="btn-secondary btn-sm">
                      <Edit size={13} />
                    </button>
                    <button onClick={() => { if (window.confirm('Delete this entry?')) deleteMutation.mutate(e.id); }} className="btn-danger btn-sm">
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
