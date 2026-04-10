import React, { useState } from 'react';

const STATUS_LABEL: Record<string, string> = {
  IN_TRANSIT: 'Moving', DISPATCHED: 'Idle',
  DELAYED: 'Delayed', DELIVERED: 'Delivered',
  BOOKED: 'Booked', INQUIRY: 'Inquiry',
};
const STATUS_BADGE: Record<string, string> = {
  IN_TRANSIT: 'badge-green',
  DISPATCHED: 'badge-orange',
  DELAYED:    'badge-red',
  DELIVERED:  'badge-blue',
  BOOKED:     'badge-purple',
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
    <div className="border-r border-slate-200 flex flex-col bg-white overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-200 flex justify-between items-center">
        <span className="section-label !mb-0">Active loads</span>
        <span className="text-[11px] text-slate-400">{shipments.length} trucks</span>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search vehicle / route..."
        className="input !py-1.5 !text-xs mx-3 mt-2 mb-1 !w-[calc(100%-24px)]"
      />

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-4 text-xs text-slate-400 text-center">No shipments found</div>
        )}
        {filtered.map((s) => {
          const isSelected = selected?.id === s.id;
          const badgeCls = STATUS_BADGE[s.status] || 'badge-gray';
          return (
            <div
              key={s.id}
              onClick={() => onSelect(s)}
              className={`px-3 py-2.5 border-b border-slate-100 cursor-pointer transition-colors duration-100 ${
                isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[13px] font-medium text-slate-800">{s.vehicle?.regNumber || s.trackingNumber}</span>
                <span className={`${badgeCls} !text-[10px] !px-1.5 !py-0`}>
                  {STATUS_LABEL[s.status] || s.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">{s.origin} → {s.destination}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {s.driver?.name || 'No driver'} · {s.estimatedDelivery ? `ETA ${formatETA(s.estimatedDelivery)}` : '\u2014'}
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
