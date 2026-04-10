import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reminderApi, vehicleApi } from '../services/api';
import { Plus, Trash2, Bell, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

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

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">Reminders</h1>
          {typeof upcomingCount === 'number' && upcomingCount > 0 && (
            <span className="badge-red">
              <Bell size={11} /> {upcomingCount} upcoming
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
            <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} className="rounded" />
            Unread only
          </label>
          <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="select">
            <option value="">All vehicles</option>
            {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
          </select>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
            <Plus size={15} /> Add reminder
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-section">
          <div className="form-section-title">New reminder</div>
          <div className="form-grid">
            <div>
              <label className="form-label">Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Insurance renewal" className="input" />
            </div>
            <div>
              <label className="form-label">Due date *</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className="input" />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="select">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Vehicle</label>
              <select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} className="select">
                <option value="">-- Select vehicle --</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional details..." className="input" />
            </div>

            {error && <div className="col-span-full text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

            <div className="col-span-full flex gap-2 mt-1">
              <button onClick={handleSubmit} disabled={createMutation.isLoading} className="btn-primary">
                {createMutation.isLoading ? 'Saving...' : 'Add reminder'}
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
              {['Vehicle', 'Title', 'Due date', 'Category', 'Status', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="text-center text-slate-400 py-6">Loading...</td></tr>}
            {!isLoading && reminders.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-6">No reminders found</td></tr>}
            {reminders.map((r: any) => {
              const isRead = r.isRead || r.status === 'READ';
              const dueDays = r.dueDate ? Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / 86400000) : null;
              const overdue = dueDays !== null && dueDays < 0;
              return (
                <tr key={r.id} className={isRead ? 'opacity-70' : ''}>
                  <td className="font-medium text-slate-800">{r.vehicle?.regNumber || '\u2014'}</td>
                  <td>
                    <div className="font-medium text-slate-800 text-sm">{r.title}</div>
                    {r.description && <div className="text-[11px] text-slate-400 mt-0.5">{r.description}</div>}
                  </td>
                  <td className={overdue ? 'text-red-600' : 'text-slate-500'}>
                    <span className="text-xs">{r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '\u2014'}</span>
                    {overdue && (
                      <span className="badge-red ml-1.5 text-[10px]">
                        <AlertTriangle size={10} /> OVERDUE
                      </span>
                    )}
                    {dueDays !== null && dueDays >= 0 && dueDays <= 7 && (
                      <span className="badge-orange ml-1.5 text-[10px]">
                        <Clock size={10} /> {dueDays}d
                      </span>
                    )}
                  </td>
                  <td className="text-xs text-slate-500">{r.category ? r.category.replace(/_/g, ' ') : '\u2014'}</td>
                  <td>
                    <span className={isRead ? 'badge-green' : 'badge-red'}>{isRead ? 'Read' : 'Unread'}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {!isRead && (
                        <button onClick={() => markReadMutation.mutate(r.id)} className="btn-secondary btn-sm">
                          <CheckCircle size={13} /> Mark read
                        </button>
                      )}
                      <button onClick={() => { if (window.confirm('Delete this reminder?')) deleteMutation.mutate(r.id); }} className="btn-danger btn-sm">
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
