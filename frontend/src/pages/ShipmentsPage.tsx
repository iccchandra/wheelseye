import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { shipmentApi } from '../services/api';
import { Plus, Eye, MapPin, History, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  INQUIRY:    { className: 'badge-purple', label: 'Inquiry' },
  BOOKED:     { className: 'badge-blue', label: 'Booked' },
  DISPATCHED: { className: 'badge-orange', label: 'Dispatched' },
  IN_TRANSIT: { className: 'badge-green', label: 'Moving' },
  DELAYED:    { className: 'badge-red', label: 'Delayed' },
  DELIVERED:  { className: 'badge-green', label: 'Delivered' },
  CANCELLED:  { className: 'badge-gray', label: 'Cancelled' },
};

export const ShipmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);

  const { data, isLoading } = useQuery(
    ['shipments', search, status, page],
    () => shipmentApi.getAll({ search: search || undefined, status: status || undefined, page, limit: 15 }),
    { keepPreviousData: true },
  );

  const result     = data?.data || {};
  const shipments  = result.data || [];
  const totalPages = result.totalPages || 1;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">All shipments</h1>
        <button onClick={() => navigate('/shipments/new')} className="btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5" />
          New shipment
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tracking #, route, consignee..."
            className="input pl-9"
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="select w-44">
          <option value="">All statuses</option>
          {Object.entries(STATUS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {['Tracking #', 'Route', 'Cargo', 'Vehicle / Driver', 'Status', 'ETA', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="text-center text-slate-400 py-6">Loading...</td></tr>
            )}
            {!isLoading && shipments.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-400 py-6">No shipments found</td></tr>
            )}
            {shipments.map((s: any) => {
              const sb = STATUS_BADGE[s.status] || STATUS_BADGE.INQUIRY;
              return (
                <tr key={s.id} className="cursor-pointer">
                  <td className="font-medium text-slate-800">{s.trackingNumber}</td>
                  <td className="text-slate-500">{s.origin} → {s.destination}</td>
                  <td className="text-slate-500">{s.cargoDescription} · {s.weightMT}MT</td>
                  <td>
                    <div className="text-slate-500">{s.vehicle?.regNumber || '—'}</div>
                    <div className="text-xs text-slate-400">{s.driver?.name || 'No driver'}</div>
                  </td>
                  <td>
                    <span className={sb.className}>{sb.label}</span>
                  </td>
                  <td className="text-slate-500">
                    {s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/shipments/${s.id}/details`)} className="btn-primary btn-sm">
                        <Eye className="w-3 h-3" /> View
                      </button>
                      <button onClick={() => navigate(`/dashboard?shipmentId=${s.id}`)} className="btn-secondary btn-sm">
                        <MapPin className="w-3 h-3" /> Track
                      </button>
                      <button onClick={() => navigate(`/shipments/${s.id}/history`)} className="btn-secondary btn-sm">
                        <History className="w-3 h-3" /> History
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm">
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <span className="text-xs text-slate-500 px-2">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm">
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
