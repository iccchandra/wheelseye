import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userApi } from '../services/api';
import { UserPlus, Pencil, Trash2, Shield, X } from 'lucide-react';

const ROLES = ['ADMIN', 'OPS', 'SHIPPER', 'TRANSPORTER'];
const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'badge-purple',
  OPS: 'badge-blue',
  SHIPPER: 'badge-green',
  TRANSPORTER: 'badge-orange',
};

const PERM_GROUPS = [
  { label: 'Vehicles', keys: ['vehicles_list', 'vehicles_add', 'vehicles_edit'] },
  { label: 'Drivers', keys: ['drivers_list', 'drivers_add', 'drivers_edit'] },
  { label: 'Shipments', keys: ['shipments_list', 'shipments_add', 'shipments_edit'] },
  { label: 'Customers', keys: ['customers_list', 'customers_add', 'customers_edit'] },
  { label: 'Fuel', keys: ['fuel_list', 'fuel_add', 'fuel_edit'] },
  { label: 'Finance', keys: ['finance_list', 'finance_add', 'finance_edit'] },
  { label: 'Reminders', keys: ['reminders_list', 'reminders_add'] },
  { label: 'Tracking', keys: ['tracking_live', 'tracking_history'] },
  { label: 'Geofence', keys: ['geofence_list', 'geofence_add', 'geofence_events'] },
  { label: 'Billing', keys: ['billing_list', 'billing_create'] },
  { label: 'Reports', keys: ['reports_view', 'reports_export'] },
  { label: 'Settings', keys: ['settings_manage'] },
  { label: 'Users', keys: ['users_list', 'users_add', 'users_edit'] },
];

const emptyForm = { name: '', phone: '', email: '', role: 'OPS', isActive: true, permissions: {} as Record<string, boolean> };

export const UsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery(
    ['users', search, roleFilter],
    () => userApi.getAll({ search: search || undefined, role: roleFilter || undefined, limit: 50 }),
    { keepPreviousData: true },
  );

  const users = data?.data?.data || data?.data || [];

  const saveMut = useMutation(
    (d: any) => editId ? userApi.update(editId, d) : userApi.create(d),
    { onSuccess: () => { qc.invalidateQueries('users'); setShowForm(false); setEditId(null); setForm(emptyForm); } },
  );

  const deleteMut = useMutation(
    (id: string) => userApi.remove(id),
    { onSuccess: () => qc.invalidateQueries('users') },
  );

  const openEdit = (u: any) => {
    setForm({ name: u.name || '', phone: u.phone || '', email: u.email || '', role: u.role || 'OPS', isActive: u.isActive ?? true, permissions: u.permissions || {} });
    setEditId(u.id);
    setShowForm(true);
  };

  const togglePerm = (key: string) => setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));

  if (showForm) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">{editId ? 'Edit User' : 'Add User'}</h1>
          <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} className="btn-secondary btn-sm inline-flex items-center gap-1">
            <X size={14} />
            Cancel
          </button>
        </div>
        <div className="form-section">
          <div className="form-grid grid-cols-2 mb-3.5">
            {[
              { key: 'name', label: 'Name', required: true },
              { key: 'phone', label: 'Phone', required: true },
              { key: 'email', label: 'Email' },
            ].map(f => (
              <div key={f.key}>
                <label className="form-label">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input" />
              </div>
            ))}
            <div>
              <label className="form-label">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="select">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-800">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-brand-600" />
                Active
              </label>
            </div>
          </div>

          <div className="mb-3.5">
            <label className="form-label flex items-center gap-1.5 mb-2">
              <Shield size={12} />
              Permissions
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PERM_GROUPS.map(g => (
                <div key={g.label} className="bg-slate-50 rounded-lg p-2.5 px-3">
                  <div className="text-xs font-medium text-slate-700 mb-1.5">{g.label}</div>
                  {g.keys.map(k => (
                    <label key={k} className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-0.5 cursor-pointer">
                      <input type="checkbox" checked={!!form.permissions[k]} onChange={() => togglePerm(k)} />
                      {k.split('_').pop()}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => saveMut.mutate(form)} className="btn-primary">
            {saveMut.isLoading ? 'Saving...' : editId ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="btn-primary btn-sm inline-flex items-center gap-1">
          <UserPlus size={14} />
          Add user
        </button>
      </div>

      <div className="flex gap-2 mb-3.5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, email..." className="input flex-1" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="select w-auto">
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {['Name', 'Phone', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="text-center text-slate-400 text-sm py-6">Loading...</td></tr>
            )}
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-400 text-sm py-6">No users found</td></tr>
            )}
            {users.map((u: any) => {
              const badgeClass = ROLE_BADGE[u.role] || 'badge-blue';
              return (
                <tr key={u.id}>
                  <td className="font-medium">{u.name || '—'}</td>
                  <td className="text-xs text-slate-500">{u.phone}</td>
                  <td className="text-xs text-slate-500">{u.email || '—'}</td>
                  <td>
                    <span className={badgeClass}>{u.role}</span>
                  </td>
                  <td>
                    <span className={u.isActive ? 'badge-green' : 'badge-gray'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="btn-ghost btn-sm inline-flex items-center gap-1">
                        <Pencil size={12} />
                        Edit
                      </button>
                      <button onClick={() => { if (confirm('Delete this user?')) deleteMut.mutate(u.id); }} className="btn-danger btn-sm inline-flex items-center gap-1">
                        <Trash2 size={12} />
                        Delete
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
