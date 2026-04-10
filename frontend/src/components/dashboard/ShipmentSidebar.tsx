import React, { useState } from 'react';

const STATUS_LABEL: Record<string, string> = {
  IN_TRANSIT: 'Moving', DISPATCHED: 'Idle',
  DELAYED: 'Delayed', DELIVERED: 'Delivered',
  BOOKED: 'Booked', INQUIRY: 'Inquiry',
};
const STATUS_CLASS: Record<string, { bg: string; color: string }> = {
  IN_TRANSIT: { bg: '#EAF3DE', color: '#3B6D11' },
  DISPATCHED:  { bg: '#FAEEDA', color: '#854F0B' },
  DELAYED:     { bg: '#FCEBEB', color: '#A32D2D' },
  DELIVERED:   { bg: '#E6F1FB', color: '#0C447C' },
  BOOKED:      { bg: '#EEEDFE', color: '#534AB7' },
};

interface Props {
  shipments: any[];
  selected: any;
  onSelect: (s: any) => void;
}

export const ShipmentSidebar: React.FC<Props> = ({ shipments, selected, onSelect }) => {
  const [search, setSearch] = useState('');

  const filtered = shipments.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.trackingNumber?.toLowerCase().includes(q) ||
      s.origin?.toLowerCase().includes(q) ||
      s.destination?.toLowerCase().includes(q) ||
      s.driver?.name?.toLowerCase().includes(q) ||
      s.vehicle?.regNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Active loads</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{shipments.length} trucks</span>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search vehicle / route..."
        style={{ margin: '8px 12px', padding: '5px 8px', border: '0.5px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', width: 'calc(100% - 24px)' }}
      />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 16, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>No shipments found</div>
        )}
        {filtered.map((s) => {
          const isSelected = selected?.id === s.id;
          const sc = STATUS_CLASS[s.status] || { bg: '#F1EFE8', color: '#5F5E5A' };
          return (
            <div
              key={s.id}
              onClick={() => onSelect(s)}
              style={{
                padding: '9px 12px', borderBottom: '0.5px solid var(--border)',
                cursor: 'pointer', background: isSelected ? '#E6F1FB' : 'var(--bg-primary)',
                transition: 'background .12s',
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSelected ? '#E6F1FB' : 'var(--bg-primary)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{s.vehicle?.regNumber || s.trackingNumber}</span>
                <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 3, background: sc.bg, color: sc.color }}>
                  {STATUS_LABEL[s.status] || s.status}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.origin} → {s.destination}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {s.driver?.name || 'No driver'} · {s.estimatedDelivery ? `ETA ${formatETA(s.estimatedDelivery)}` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatETA(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return 'Overdue';
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
