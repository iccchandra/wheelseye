import React, { useRef, useState, useEffect } from 'react';
import { useGpsStore } from '../../store/gpsStore';
import { shipmentApi, uploadApi, gpsApi } from '../../services/api';

interface Props {
  shipment: any;
  onRefresh: () => void;
  onViewHistory?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  IN_TRANSIT: 'bg-emerald-500', DISPATCHED: 'bg-amber-500', DELAYED: 'bg-red-500', DELIVERED: 'bg-brand-600',
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
      <div className="border-l border-slate-200 flex items-center justify-center bg-white">
        <div className="text-center text-slate-400 text-sm">
          <div className="text-[28px] mb-2">📍</div>
          Select a truck to view details
        </div>
      </div>
    );
  }

  const pos = positions[shipment.vehicleId];
  const shipmentAlerts = alerts.filter(a => a.shipmentId === shipment.id).slice(0, 5);
  const colorCls = STATUS_COLORS[shipment.status] || 'bg-slate-400';
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
    <div className="border-l border-slate-200 flex flex-col overflow-y-auto bg-white">

      {/* Header */}
      <div className="px-3.5 py-3 border-b border-slate-200">
        <div className="text-[13.5px] font-medium text-slate-800 mb-0.5">
          {shipment.vehicle?.regNumber || shipment.trackingNumber}
        </div>
        <div className="text-[11px] text-slate-500">{shipment.origin} → {shipment.destination}</div>
      </div>

      {/* ETA */}
      <div className="px-3.5 py-3 border-b border-slate-200">
        <div className="section-label mb-1.5">ETA</div>
        <div className="text-xl font-medium text-slate-800">
          {shipment.estimatedDelivery ? formatDateTime(shipment.estimatedDelivery) : '\u2014'}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 mb-2">
          {shipment.status === 'DELIVERED' ? 'Trip completed' : 'Estimated arrival'}
        </div>
        <div className="h-1 bg-slate-200 rounded-sm overflow-hidden">
          <div className={`h-full rounded-sm transition-all duration-300 ${colorCls}`} style={{ width: `${prog}%` }} />
        </div>
        <div className="text-[10px] text-slate-400 mt-1">{prog}% complete</div>
      </div>

      {/* Trip info */}
      <div className="px-3.5 py-2.5 border-b border-slate-200">
        <div className="section-label mb-2">Trip info</div>
        {[
          ['Driver', shipment.driver?.name || '\u2014'],
          ['Phone', shipment.driver?.phone || '\u2014'],
          ['Speed', pos ? `${pos.speed} km/h` : '\u2014'],
          ['Last ping', pos ? formatRelative(pos.timestamp) : '\u2014'],
          ['Cargo', `${shipment.cargoDescription || '\u2014'} · ${shipment.weightMT} MT`],
          ['Tracking #', shipment.trackingNumber],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-800 text-right max-w-[55%]">{value}</span>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="px-3.5 py-2.5 border-b border-slate-200">
        <div className="section-label mb-2">Recent alerts</div>
        {shipmentAlerts.length === 0 ? (
          <div className="text-xs text-slate-400">No alerts</div>
        ) : shipmentAlerts.map(a => (
          <div key={a.id} className="flex gap-2 mb-2">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${alertColorCls(a.type)}`} />
            <div>
              <div className="text-xs text-slate-800 leading-snug">{a.message}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{formatRelative(a.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stops & Running */}
      {stops && stops.segments?.length > 0 && (
        <div className="px-3.5 py-2.5 border-b border-slate-200">
          <div className="section-label mb-1.5">
            Today's Activity
          </div>
          <div className="flex gap-2 mb-2 text-[11px]">
            <span className="text-red-500 font-medium">{stops.stopCount} stops ({stops.totalStoppedFormatted})</span>
            <span className="text-emerald-500 font-medium">Running {stops.totalRunningFormatted}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {stops.segments.slice(0, 8).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px]">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.type === 'STOPPED' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <span className="font-medium text-slate-800 min-w-[55px]">{s.type === 'STOPPED' ? 'Stopped' : 'Running'}</span>
                <span className="text-slate-500">{s.durationFormatted}</span>
                <span className="ml-auto text-[10px] text-slate-400">
                  {new Date(s.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-3.5 py-2.5 flex gap-1.5 flex-wrap">
        <button
          onClick={() => window.open(`/track/${shipment.trackingNumber}`, '_blank')}
          className="btn-sm btn flex-1 bg-blue-50 text-brand-700 border border-blue-200 hover:bg-blue-100"
        >
          Share tracking
        </button>
        <button
          onClick={onViewHistory}
          className="btn-secondary btn-sm flex-1"
        >
          Route history
        </button>
        {showPodInput ? (
          <div className="w-full mt-0.5">
            <div className="flex gap-1 mb-1">
              <button onClick={() => podFileRef.current?.click()} disabled={podUploading}
                className="btn-primary btn-sm flex-1">
                {podUploading ? 'Uploading...' : 'Choose file'}
              </button>
              <button onClick={() => { setShowPodInput(false); setPodUrl(''); }}
                className="btn-secondary btn-sm">Cancel</button>
            </div>
            <input ref={podFileRef} type="file" accept="image/*,.pdf" onChange={handlePODFile} className="hidden" />
            <div className="flex gap-1">
              <input type="url" value={podUrl} onChange={e => setPodUrl(e.target.value)} placeholder="or paste URL"
                className="input !py-1.5 !text-[11px] flex-1" />
              <button onClick={handlePODUrl} disabled={!podUrl.trim()}
                className="btn-secondary btn-sm">Save URL</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowPodInput(true)}
            className="btn-secondary btn-sm w-full mt-0.5">
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

function alertColorCls(type: string) {
  if (['ROUTE_DEVIATION', 'OVERSPEED', 'DELAYED'].includes(type)) return 'bg-red-500';
  if (['IDLE', 'NIGHT_DRIVING'].includes(type)) return 'bg-amber-500';
  if (['DELIVERED', 'POD_UPLOADED', 'TRIP_COMPLETED'].includes(type)) return 'bg-brand-600';
  return 'bg-emerald-500';
}
