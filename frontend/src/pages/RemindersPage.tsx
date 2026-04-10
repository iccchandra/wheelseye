import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reminderApi, vehicleApi } from '../services/api';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  UNREAD: { bg: '#FCEBEB', color: '#A32D2D' },
  READ:   { bg: '#EAF3DE', color: '#3B6D11' },
};

const CATEGORIES = [
  'INSURANCE', 'RC_RENEWAL', 'LICENCE_RENEWAL', 'SERVICE', 'FITNESS',
  'POLLUTION', 'PERMIT', 'TAX', 'OTHER',
];

export const RemindersPage: React.FC = () => {
  const qc = useQueryClient();
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    vehicleId: '', title: '', dueDate: '', description: '', category: 'OTHER',
  });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery(
    ['reminders', vehicleFilter, unreadOnly],
    () => reminderApi.getAll({
      vehicleId: vehicleFilter || undefined,
      unreadOnly: unreadOnly || undefined,
    }),
    { keepPreviousData: true },
  );

  const { data: upcomingData } = useQuery(
    'reminders-upcoming',
    () => reminderApi.getUpcoming(),
  );

  const { data: vehiclesData } = useQuery('vehicles-all', () => vehicleApi.getAll());
  const vehicles = vehiclesData?.data || [];

  const _rd = data?.data;
  const reminders = Array.isArray(_rd) ? _rd : _rd?.data || [];
  const upcomingCount = upcomingData?.data?.length || upcomingData?.data?.count || 0;

  const createMutation = useMutation(
    (data: any) => reminderApi.create(data),
    { onSuccess: () => { qc.invalidateQueries('reminders'); qc.invalidateQueries('reminders-upcoming'); resetForm(); } },
  );
  const markReadMutation = useMutation(
    (id: string) => reminderApi.markAsRead(id),
    { onSuccess: () => { qc.invalidateQueries('reminders'); qc.invalidateQueries('reminders-upcoming'); } },
  );
  const deleteMutation = useMutation(
    (id: string) => reminderApi.remove(id),
    { onSuccess: () => { qc.invalidateQueries('reminders'); qc.invalidateQueries('reminders-upcoming'); } },
  );

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const resetForm = () => {
    setShowForm(false);
    setError('');
    setForm({ vehicleId: '', title: '', dueDate: '', description: '', category: 'OTHER' });
  };

  const handleSubmit = () => {
    if (!form.title || !form.dueDate) {
      setError('Title and due date are required'); return;
    }
    setError('');
    createMutation.mutate({
      vehicleId: form.vehicleId || undefined,
      title: form.title,
      dueDate: form.dueDate,
      description: form.description || undefined,
      category: form.category,
    });
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };
  const labelStyle: React.CSSProperties = { fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Reminders</div>
          {typeof upcomingCount === 'number' && upcomingCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 10, background: '#FCEBEB', color: '#A32D2D' }}>
              {upcomingCount} upcoming
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} />
            Unread only
          </label>
          <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
            <option value="">All vehicles</option>
            {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
          </select>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, background: '#185FA5', color: '#fff', border: 'none', cursor: 'pointer' }}>+ Add reminder</button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 14 }}>New reminder</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Insurance renewal" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Due date *</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Vehicle</label>
              <select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} style={inputStyle}>
                <option value="">-- Select vehicle --</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional details..." style={inputStyle} />
            </div>

            {error && <div style={{ gridColumn: '1/-1', fontSize: 13, color: '#A32D2D', padding: '8px 12px', background: '#FCEBEB', borderRadius: 7 }}>{error}</div>}

            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={handleSubmit} disabled={createMutation.isLoading} style={{ padding: '8px 20px', borderRadius: 7, background: '#185FA5', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: createMutation.isLoading ? 0.7 : 1 }}>
                {createMutation.isLoading ? 'Saving...' : 'Add reminder'}
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
              {['Vehicle', 'Title', 'Due date', 'Category', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading...</td></tr>}
            {!isLoading && reminders.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No reminders found</td></tr>}
            {reminders.map((r: any) => {
              const isRead = r.isRead || r.status === 'READ';
              const ss = isRead ? STATUS_STYLE.READ : STATUS_STYLE.UNREAD;
              const dueDays = r.dueDate ? Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / 86400000) : null;
              const overdue = dueDays !== null && dueDays < 0;
              return (
                <tr key={r.id} style={{ borderBottom: '0.5px solid var(--border)', opacity: isRead ? 0.7 : 1 }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{r.vehicle?.regNumber || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{r.title}</div>
                    {r.description && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{r.description}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: overdue ? '#A32D2D' : 'var(--text-secondary)' }}>
                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '—'}
                    {overdue && <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 500, background: '#FCEBEB', color: '#A32D2D', padding: '1px 5px', borderRadius: 3 }}>OVERDUE</span>}
                    {dueDays !== null && dueDays >= 0 && dueDays <= 7 && <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 500, background: '#FAEEDA', color: '#854F0B', padding: '1px 5px', borderRadius: 3 }}>{dueDays}d</span>}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{r.category ? r.category.replace(/_/g, ' ') : '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 7px', borderRadius: 4, background: ss.bg, color: ss.color }}>{isRead ? 'Read' : 'Unread'}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {!isRead && (
                        <button onClick={() => markReadMutation.mutate(r.id)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid #B5D4F4', background: '#E6F1FB', color: '#0C447C', cursor: 'pointer' }}>Mark read</button>
                      )}
                      <button onClick={() => { if (window.confirm('Delete this reminder?')) deleteMutation.mutate(r.id); }} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid #FCEBEB', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>Delete</button>
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
