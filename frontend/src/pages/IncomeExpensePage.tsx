import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { incomeExpenseApi, vehicleApi } from '../services/api';

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  INCOME:  { bg: '#EAF3DE', color: '#3B6D11' },
  EXPENSE: { bg: '#FCEBEB', color: '#A32D2D' },
};

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

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };
  const labelStyle: React.CSSProperties = { fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Income &amp; expenses</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
            <option value="">All vehicles</option>
            {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }} />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }} />
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, background: '#185FA5', color: '#fff', border: 'none', cursor: 'pointer' }}>+ Add entry</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total income', value: `₹${totalIncome.toLocaleString('en-IN')}`, color: '#3B6D11', bg: '#EAF3DE' },
          { label: 'Total expense', value: `₹${totalExpense.toLocaleString('en-IN')}`, color: '#A32D2D', bg: '#FCEBEB' },
          { label: 'Net profit', value: `₹${netProfit.toLocaleString('en-IN')}`, color: '#185FA5', bg: '#E6F1FB' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 14 }}>{editId ? 'Edit entry' : 'Add entry'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Type *</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Vehicle</label>
              <select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} style={inputStyle}>
                <option value="">-- Select vehicle --</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="e.g. 5000" min="0" step="0.01" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief note..." style={inputStyle} />
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
              {['Date', 'Vehicle', 'Type', 'Description', 'Category', 'Amount (₹)', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading...</td></tr>}
            {!isLoading && entries.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No entries found</td></tr>}
            {entries.map((e: any) => {
              const ts = TYPE_STYLE[e.type] || TYPE_STYLE.EXPENSE;
              return (
                <tr key={e.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)' }}>{e.date ? new Date(e.date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{e.vehicle?.regNumber || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 7px', borderRadius: 4, background: ts.bg, color: ts.color }}>{e.type}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{e.description || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{e.category || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: e.type === 'INCOME' ? '#3B6D11' : '#A32D2D' }}>
                    {e.type === 'INCOME' ? '+' : '-'}₹{(e.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(e)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => { if (window.confirm('Delete this entry?')) deleteMutation.mutate(e.id); }} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid #FCEBEB', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>Delete</button>
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
