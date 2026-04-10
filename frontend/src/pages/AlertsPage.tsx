import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { alertApi } from '../services/api';
import { Bell, Check } from 'lucide-react';

const TYPE_BADGE: Record<string, string> = {
  ROUTE_DEVIATION: 'badge-red',
  OVERSPEED: 'badge-red',
  DELIVERY_DELAY: 'badge-red',
  IDLE: 'badge-orange',
  NIGHT_DRIVING: 'badge-orange',
  DOCUMENT_EXPIRY: 'badge-orange',
  GEOFENCE_ENTRY: 'badge-blue',
  GEOFENCE_EXIT: 'badge-blue',
  TRIP_STARTED: 'badge-green',
  TRIP_COMPLETED: 'badge-green',
  POD_UPLOADED: 'badge-green',
};

const TYPE_LABEL: Record<string, string> = {
  ROUTE_DEVIATION: 'Route deviation', OVERSPEED: 'Over-speed', DELIVERY_DELAY: 'Delay',
  IDLE: 'Idle / halt', NIGHT_DRIVING: 'Night driving', DOCUMENT_EXPIRY: 'Doc expiry',
  GEOFENCE_ENTRY: 'Geofence entry', GEOFENCE_EXIT: 'Geofence exit',
  TRIP_STARTED: 'Trip started', TRIP_COMPLETED: 'Delivered', POD_UPLOADED: 'POD uploaded',
};

const TYPE_BORDER: Record<string, string> = {
  ROUTE_DEVIATION: 'border-l-red-500',
  OVERSPEED: 'border-l-red-500',
  DELIVERY_DELAY: 'border-l-red-500',
  IDLE: 'border-l-amber-500',
  NIGHT_DRIVING: 'border-l-amber-500',
  DOCUMENT_EXPIRY: 'border-l-amber-500',
  GEOFENCE_ENTRY: 'border-l-blue-500',
  GEOFENCE_EXIT: 'border-l-blue-500',
  TRIP_STARTED: 'border-l-emerald-500',
  TRIP_COMPLETED: 'border-l-emerald-500',
  POD_UPLOADED: 'border-l-emerald-500',
};

export const AlertsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const qc = useQueryClient();

  const { data } = useQuery(
    ['alerts', filter],
    () => alertApi.getAll({ acknowledged: filter === 'unread' ? false : undefined, limit: 50 }),
    { refetchInterval: 15000 },
  );

  const ackMutation = useMutation(
    (id: string) => alertApi.acknowledge(id),
    { onSuccess: () => qc.invalidateQueries('alerts') },
  );

  const alerts = data?.data || [];

  return (
    <div className="page max-w-3xl">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-400" />
          Alert inbox
        </h1>
        <div className="flex gap-1.5">
          {(['unread', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={f === filter ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            >
              {f === 'unread' ? 'Unread' : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {alerts.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
            No alerts {filter === 'unread' ? '-- all caught up' : 'found'}
          </div>
        )}
        {alerts.map((a: any) => (
          <div
            key={a.id}
            className={`card border-l-[3px] ${TYPE_BORDER[a.type] || 'border-l-slate-400'} px-4 py-3 flex gap-3 items-start ${a.acknowledged ? 'opacity-60' : ''}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 items-center mb-1">
                <span className={TYPE_BADGE[a.type] || 'badge-gray'}>
                  {TYPE_LABEL[a.type] || a.type}
                </span>
                {!a.acknowledged && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                )}
              </div>
              <div className="text-sm text-slate-800 mb-0.5">{a.message}</div>
              <div className="text-xs text-slate-400">
                {new Date(a.createdAt).toLocaleString('en-IN')}
                {a.lat && ` · ${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}`}
              </div>
            </div>
            {!a.acknowledged && (
              <button
                onClick={() => ackMutation.mutate(a.id)}
                className="btn-secondary btn-sm shrink-0"
              >
                <Check className="w-3 h-3" /> Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
