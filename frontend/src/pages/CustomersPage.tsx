import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { customerApi } from '../services/api';
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react';

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

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / email / phone..." className="input pl-9 w-60" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
            <Plus size={15} /> Add customer
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-section">
          <div className="form-section-title">{editId ? 'Edit customer' : 'Add customer'}</div>
          <div className="form-grid">
            <div>
              <label className="form-label">Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rajesh Kumar" className="input" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. rajesh@company.com" className="input" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" className="input" />
            </div>
            <div>
              <label className="form-label">GSTIN</label>
              <input value={form.gstin} onChange={e => set('gstin', e.target.value)} placeholder="e.g. 29ABCDE1234F1Z5" className="input" />
            </div>
            <div>
              <label className="form-label">Address</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" className="input" />
            </div>
            <div className="flex items-center gap-2.5 pt-5">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded" />
              <label htmlFor="isActive" className="text-sm text-slate-700 cursor-pointer">Active</label>
            </div>

            {error && <div className="col-span-full text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

            <div className="col-span-full flex gap-2 mt-1">
              <button onClick={handleSubmit} disabled={createMutation.isLoading || updateMutation.isLoading} className="btn-primary">
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editId ? 'Update' : 'Add customer'}
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
              {['Name', 'Email', 'Phone', 'Address', 'GSTIN', 'Status', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center text-slate-400 py-6">Loading...</td></tr>}
            {!isLoading && customers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <Users size={32} className="mx-auto text-slate-300 mb-2" />
                  <div className="text-slate-400 text-sm">No customers found</div>
                </td>
              </tr>
            )}
            {customers.map((c: any) => {
              const active = c.isActive !== false;
              return (
                <tr key={c.id}>
                  <td className="font-medium text-slate-800">{c.name}</td>
                  <td className="text-xs text-slate-500">{c.email || '\u2014'}</td>
                  <td className="text-xs text-slate-500">{c.phone || '\u2014'}</td>
                  <td className="text-xs text-slate-500">{c.address || '\u2014'}</td>
                  <td className="text-xs text-slate-500">{c.gstin || '\u2014'}</td>
                  <td>
                    <span className={active ? 'badge-green' : 'badge-gray'}>{active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="btn-secondary btn-sm">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => { if (window.confirm('Delete this customer?')) deleteMutation.mutate(c.id); }} className="btn-danger btn-sm">
                        <Trash2 size={13} />
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
