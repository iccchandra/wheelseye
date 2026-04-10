import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { customerApi } from '../services/api';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE:   { bg: '#EAF3DE', color: '#3B6D11' },
  INACTIVE: { bg: '#F1EFE8', color: '#5F5E5A' },
};

export const CustomersPage: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', gstin: '', isActive: true,
  });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery(
    ['customers', search, statusFilter],
    () => customerApi.getAll({
      search: search || undefined,
      isActive: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined,
    }),
    { keepPreviousData: true },
  );

  const _rd = data?.data;
  const customers = Array.isArray(_rd) ? _rd : _rd?.data || [];

  const createMutation = useMutation(
    (data: any) => customerApi.create(data),
    { onSuccess: () => { qc.invalidateQueries('customers'); resetForm(); } },
  );
  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => customerApi.update(id, data),
    { onSuccess: () => { qc.invalidateQueries('customers'); resetForm(); } },
  );
  const deleteMutation = useMutation(
    (id: string) => customerApi.remove(id),
    { onSuccess: () => qc.invalidateQueries('customers') },
  );

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setError('');
    setForm({ name: '', email: '', phone: '', address: '', gstin: '', isActive: true });
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      gstin: c.gstin || '',
      isActive: c.isActive !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name) {
      setError('Customer name is required'); return;
    }
    setError('');
    const payload = {
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      gstin: form.gstin || undefined,
      isActive: form.isActive,
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
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Customers</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / email / phone..." style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', width: 240 }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, background: '#185FA5', color: '#fff', border: 'none', cursor: 'pointer' }}>+ Add customer</button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 14 }}>{editId ? 'Edit customer' : 'Add customer'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rajesh Kumar" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. rajesh@company.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>GSTIN</label>
              <input value={form.gstin} onChange={e => set('gstin', e.target.value)} placeholder="e.g. 29ABCDE1234F1Z5" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
              <label htmlFor="isActive" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>Active</label>
            </div>

            {error && <div style={{ gridColumn: '1/-1', fontSize: 13, color: '#A32D2D', padding: '8px 12px', background: '#FCEBEB', borderRadius: 7 }}>{error}</div>}

            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={handleSubmit} disabled={createMutation.isLoading || updateMutation.isLoading} style={{ padding: '8px 20px', borderRadius: 7, background: '#185FA5', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: (createMutation.isLoading || updateMutation.isLoading) ? 0.7 : 1 }}>
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editId ? 'Update' : 'Add customer'}
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
              {['Name', 'Email', 'Phone', 'Address', 'GSTIN', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading...</td></tr>}
            {!isLoading && customers.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No customers found</td></tr>}
            {customers.map((c: any) => {
              const active = c.isActive !== false;
              const ss = active ? STATUS_STYLE.ACTIVE : STATUS_STYLE.INACTIVE;
              return (
                <tr key={c.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.address || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.gstin || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 7px', borderRadius: 4, background: ss.bg, color: ss.color }}>{active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(c)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => { if (window.confirm('Delete this customer?')) deleteMutation.mutate(c.id); }} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid #FCEBEB', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>Delete</button>
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
