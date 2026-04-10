import React, { useRef, useState, useEffect } from 'react';
import { useGpsStore } from '../../store/gpsStore';
import { shipmentApi, uploadApi, gpsApi } from '../../services/api';

interface Props {
  shipment: any;
  onRefresh: () => void;
  onViewHistory?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  IN_TRANSIT: '#3B6D11', DISPATCHED: '#BA7517', DELAYED: '#A32D2D', DELIVERED: '#185FA5',
};

export const DetailPanel: React.FC<Props> = ({ shipment, onRefresh, onViewHistory }) => {
  const { positions, alerts } = useGpsStore();
  const [podUrl, setPodUrl] = useState('');
  const [showPodInput, setShowPodInput] = useState(false);
  const [podUploading, setPodUploading] = useState(false);
  const podFileRef = useRef<HTMLInputElement>(null);
  const [stops, setStops] = useState<any>(null);

  useEffect(() => {
    if (shipment?.vehicleId) {
      gpsApi.getStops(shipment.vehicleId).then(r => setStops(r.data)).catch(() => setStops(null));
    } else {
      setStops(null);
    }
  }, [shipment?.vehicleId]);

  if (!shipment) {
    return (
      <div style={{ borderLeft: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
          Select a truck to view details
        </div>
      </div>
    );
  }

  const pos = positions[shipment.vehicleId];
  const shipmentAlerts = alerts.filter(a => a.shipmentId === shipment.id).slice(0, 5);
  const color = STATUS_COLORS[shipment.status] || '#888780';
  const prog = calculateProgress(shipment);

  const handlePODFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPodUploading(true);
    try {
      const res = await uploadApi.upload(file, 'pod');
      await shipmentApi.uploadPOD(shipment.id, { podImageUrl: res.data.url });
      onRefresh();
    } catch { /* ignore */ }
    setPodUploading(false);
    setShowPodInput(false);
    if (podFileRef.current) podFileRef.current.value = '';
  };

  const handlePODUrl = async () => {
    const trimmed = podUrl.trim();
    if (!trimmed) return;
    await shipmentApi.uploadPOD(shipment.id, { podImageUrl: trimmed });
    setPodUrl('');
    setShowPodInput(false);
    onRefresh();
  };

  return (
    <div style={{ borderLeft: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
          {shipment.vehicle?.regNumber || shipment.trackingNumber}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{shipment.origin} → {shipment.destination}</div>
      </div>

      {/* ETA */}
      <div style={{ padding: '12px 14px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>ETA</div>
        <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)' }}>
          {shipment.estimatedDelivery ? formatDateTime(shipment.estimatedDelivery) : '—'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 8 }}>
          {shipment.status === 'DELIVERED' ? 'Trip completed' : 'Estimated arrival'}
        </div>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${prog}%`, background: color, borderRadius: 2, transition: 'width .3s' }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>{prog}% complete</div>
      </div>

      {/* Trip info */}
      <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Trip info</div>
        {[
          ['Driver', shipment.driver?.name || '—'],
          ['Phone', shipment.driver?.phone || '—'],
          ['Speed', pos ? `${pos.speed} km/h` : '—'],
          ['Last ping', pos ? formatRelative(pos.timestamp) : '—'],
          ['Cargo', `${shipment.cargoDescription || '—'} · ${shipment.weightMT} MT`],
          ['Tracking #', shipment.trackingNumber],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Recent alerts</div>
        {shipmentAlerts.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No alerts</div>
        ) : shipmentAlerts.map(a => (
          <div key={a.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: alertColor(a.type), flexShrink: 0, marginTop: 5 }} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>{a.message}</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{formatRelative(a.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stops & Running */}
      {stops && stops.segments?.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            Today's Activity
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 11 }}>
            <span style={{ color: 'var(--red)', fontWeight: 500 }}>{stops.stopCount} stops ({stops.totalStoppedFormatted})</span>
            <span style={{ color: 'var(--green)', fontWeight: 500 }}>Running {stops.totalRunningFormatted}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {stops.segments.slice(0, 8).map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: s.type === 'STOPPED' ? 'var(--red)' : 'var(--green)' }} />
                <span style={{ fontWeight: 500, color: 'var(--text-primary)', minWidth: 55 }}>{s.type === 'STOPPED' ? 'Stopped' : 'Running'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{s.durationFormatted}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {new Date(s.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '10px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => window.open(`/track/${shipment.trackingNumber}`, '_blank')}
          style={{ flex: 1, padding: '7px 0', borderRadius: 6, fontSize: 12, background: '#E6F1FB', color: '#0C447C', border: '0.5px solid #B5D4F4', cursor: 'pointer' }}
        >
          Share tracking
        </button>
        <button
          onClick={onViewHistory}
          style={{ flex: 1, padding: '7px 0', borderRadius: 6, fontSize: 12, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', cursor: 'pointer' }}
        >
          Route history
        </button>
        {showPodInput ? (
          <div style={{ width: '100%', marginTop: 2 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <button onClick={() => podFileRef.current?.click()} disabled={podUploading}
                style={{ flex: 1, padding: '7px 0', borderRadius: 6, fontSize: 12, background: '#185FA5', color: '#fff', border: 'none', cursor: podUploading ? 'wait' : 'pointer' }}>
                {podUploading ? 'Uploading...' : 'Choose file'}
              </button>
              <button onClick={() => { setShowPodInput(false); setPodUrl(''); }}
                style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', cursor: 'pointer' }}>Cancel</button>
            </div>
            <input ref={podFileRef} type="file" accept="image/*,.pdf" onChange={handlePODFile} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: 4 }}>
              <input type="url" value={podUrl} onChange={e => setPodUrl(e.target.value)} placeholder="or paste URL"
                style={{ flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
              <button onClick={handlePODUrl} disabled={!podUrl.trim()}
                style={{ padding: '5px 8px', borderRadius: 6, fontSize: 11, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', cursor: 'pointer' }}>Save URL</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowPodInput(true)}
            style={{ width: '100%', padding: '7px 0', borderRadius: 6, fontSize: 12, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', cursor: 'pointer', marginTop: 2 }}>
            Upload POD
          </button>
        )}
      </div>
    </div>
  );
};

function calculateProgress(s: any): number {
  if (s.status === 'DELIVERED') return 100;
  if (!s.actualPickup || !s.estimatedDelivery) return 0;
  const start = new Date(s.actualPickup).getTime();
  const end = new Date(s.estimatedDelivery).getTime();
  const now = Date.now();
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function alertColor(type: string) {
  if (['ROUTE_DEVIATION', 'OVERSPEED', 'DELAYED'].includes(type)) return '#A32D2D';
  if (['IDLE', 'NIGHT_DRIVING'].includes(type)) return '#BA7517';
  if (['DELIVERED', 'POD_UPLOADED', 'TRIP_COMPLETED'].includes(type)) return '#185FA5';
  return '#3B6D11';
}
