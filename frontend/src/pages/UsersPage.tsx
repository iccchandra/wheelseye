import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userApi } from '../services/api';

const ROLES = ['ADMIN', 'OPS', 'SHIPPER', 'TRANSPORTER'];
const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  ADMIN: { bg: '#EEEDFE', color: '#534AB7' },
  OPS: { bg: '#E6F1FB', color: '#185FA5' },
  SHIPPER: { bg: '#EAF3DE', color: '#3B6D11' },
  TRANSPORTER: { bg: '#FAEEDA', color: '#854F0B' },
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
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{editId ? 'Edit User' : 'Add User'}</div>
          <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} style={{ padding: '6px 14px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        </div>
        <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[
              { key: 'name', label: 'Name', required: true },
              { key: 'phone', label: 'Phone', required: true },
              { key: 'email', label: 'Email' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#185FA5' }} />
                Active
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Permissions</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {PERM_GROUPS.map(g => (
                <div key={g.label} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>{g.label}</div>
                  {g.keys.map(k => (
                    <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!form.permissions[k]} onChange={() => togglePerm(k)} />
                      {k.split('_').pop()}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => saveMut.mutate(form)} style={{ padding: '8px 20px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>
            {saveMut.isLoading ? 'Saving...' : editId ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Users</div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}
          style={{ padding: '6px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>+ Add user</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, email..."
          style={{ flex: 1, padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Name', 'Phone', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading...</td></tr>}
            {!isLoading && users.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No users found</td></tr>}
            {users.map((u: any) => {
              const rc = ROLE_COLORS[u.role] || ROLE_COLORS.OPS;
              return (
                <tr key={u.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500 }}>{u.name || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{u.phone}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{u.email || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 7px', borderRadius: 4, background: rc.bg, color: rc.color }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 7px', borderRadius: 4, background: u.isActive ? '#EAF3DE' : '#F1EFE8', color: u.isActive ? '#3B6D11' : '#5F5E5A' }}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(u)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => { if (confirm('Delete this user?')) deleteMut.mutate(u.id); }} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid #F09595', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>Delete</button>
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
