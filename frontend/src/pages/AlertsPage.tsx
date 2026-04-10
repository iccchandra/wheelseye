import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { alertApi } from '../services/api';

const TYPE_COLOR: Record<string, string> = {
  ROUTE_DEVIATION: '#A32D2D', OVERSPEED: '#A32D2D', DELIVERY_DELAY: '#A32D2D',
  IDLE: '#BA7517', NIGHT_DRIVING: '#BA7517', DOCUMENT_EXPIRY: '#BA7517',
  GEOFENCE_ENTRY: '#185FA5', GEOFENCE_EXIT: '#185FA5',
  TRIP_STARTED: '#3B6D11', TRIP_COMPLETED: '#3B6D11', POD_UPLOADED: '#3B6D11',
};
const TYPE_LABEL: Record<string, string> = {
  ROUTE_DEVIATION: 'Route deviation', OVERSPEED: 'Over-speed', DELIVERY_DELAY: 'Delay',
  IDLE: 'Idle / halt', NIGHT_DRIVING: 'Night driving', DOCUMENT_EXPIRY: 'Doc expiry',
  GEOFENCE_ENTRY: 'Geofence entry', GEOFENCE_EXIT: 'Geofence exit',
  TRIP_STARTED: 'Trip started', TRIP_COMPLETED: 'Delivered', POD_UPLOADED: 'POD uploaded',
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
    <div style={{ padding: '20px 24px', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Alert inbox</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['unread', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: filter === f ? '#185FA5' : 'var(--bg-secondary)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              border: `0.5px solid ${filter === f ? '#185FA5' : 'var(--border)'}`,
            }}>
              {f === 'unread' ? 'Unread' : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)', fontSize: 13 }}>
            No alerts {filter === 'unread' ? '— all caught up' : 'found'}
          </div>
        )}
        {alerts.map((a: any) => (
          <div key={a.id} style={{
            background: 'var(--bg-primary)', border: `0.5px solid var(--border)`,
            borderRadius: 10, padding: '10px 14px',
            borderLeft: `3px solid ${TYPE_COLOR[a.type] || '#888'}`,
            display: 'flex', gap: 12, alignItems: 'flex-start',
            opacity: a.acknowledged ? 0.6 : 1,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                <span style={{
                  fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 3,
                  background: (TYPE_COLOR[a.type] || '#888') + '18',
                  color: TYPE_COLOR[a.type] || '#888',
                }}>
                  {TYPE_LABEL[a.type] || a.type}
                </span>
                {!a.acknowledged && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A32D2D', display: 'inline-block' }} />
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{a.message}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {new Date(a.createdAt).toLocaleString('en-IN')}
                {a.lat && ` · ${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}`}
              </div>
            </div>
            {!a.acknowledged && (
              <button
                onClick={() => ackMutation.mutate(a.id)}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', flexShrink: 0 }}
              >
                Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
