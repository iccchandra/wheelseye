import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { shipmentApi } from '../services/api';

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  INQUIRY:    { bg: '#EEEDFE', color: '#534AB7', label: 'Inquiry' },
  BOOKED:     { bg: '#E6F1FB', color: '#185FA5', label: 'Booked' },
  DISPATCHED: { bg: '#FAEEDA', color: '#854F0B', label: 'Dispatched' },
  IN_TRANSIT: { bg: '#EAF3DE', color: '#3B6D11', label: 'Moving' },
  DELAYED:    { bg: '#FCEBEB', color: '#A32D2D', label: 'Delayed' },
  DELIVERED:  { bg: '#E1F5EE', color: '#0F6E56', label: 'Delivered' },
  CANCELLED:  { bg: '#F1EFE8', color: '#5F5E5A', label: 'Cancelled' },
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
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>All shipments</div>
        <button
          onClick={() => navigate('/shipments/new')}
          style={{ padding: '6px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}
        >
          + New shipment
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search tracking #, route, consignee..."
          style={{ flex: 1, padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Tracking #', 'Route', 'Cargo', 'Vehicle / Driver', 'Status', 'ETA', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading...</td></tr>
            )}
            {!isLoading && shipments.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No shipments found</td></tr>
            )}
            {shipments.map((s: any) => {
              const ss = STATUS_STYLE[s.status] || STATUS_STYLE.INQUIRY;
              return (
                <tr key={s.id} style={{ borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{s.trackingNumber}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.origin} → {s.destination}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.cargoDescription} · {s.weightMT}MT</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <div>{s.vehicle?.regNumber || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.driver?.name || 'No driver'}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 7px', borderRadius: 4, background: ss.bg, color: ss.color }}>{ss.label}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => navigate(`/shipments/${s.id}/details`)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '1px solid var(--accent)', background: 'var(--accent-light)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>View</button>
                      <button onClick={() => navigate(`/dashboard?shipmentId=${s.id}`)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Track</button>
                      <button onClick={() => navigate(`/shipments/${s.id}/history`)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>History</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>← Prev</button>
          <span style={{ padding: '4px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 12 }}>Next →</button>
        </div>
      )}
    </div>
  );
};
