import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LiveMap } from '../components/dashboard/LiveMap';
import { ShipmentSidebar } from '../components/dashboard/ShipmentSidebar';
import { DetailPanel } from '../components/dashboard/DetailPanel';
import { useGpsSocket } from '../hooks/useGpsSocket';
import { shipmentApi, gpsApi, reportsApi, reminderApi } from '../services/api';
import { useGpsStore } from '../store/gpsStore';

type Tab = 'live' | 'history' | 'geo';

export const DashboardPage: React.FC = () => {
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('live');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getUnreadAlertCount } = useGpsStore();
  const qc = useQueryClient();

  useGpsSocket(selected?.id);

  const { data: shipmentsData, refetch } = useQuery(
    ['shipments', 'active'],
    () => shipmentApi.getAll({ status: 'IN_TRANSIT,DISPATCHED,DELAYED', limit: 50 }),
    { refetchInterval: 60000 },
  );
  const shipments = shipmentsData?.data?.data || [];

  useEffect(() => {
    const sid = searchParams.get('shipmentId');
    if (sid && shipments.length && !selected) {
      const match = shipments.find((s: any) => s.id === sid);
      if (match) setSelected(match);
    }
  }, [searchParams, shipments, selected]);

  const { data: statsData } = useQuery('dashboard-stats', shipmentApi.getDashboardStats, { refetchInterval: 30000 });
  const { data: geofencesData } = useQuery('geofences', gpsApi.getGeofences, { enabled: tab === 'geo' });
  const { data: historyData } = useQuery(['history', selected?.id], () => gpsApi.getRouteHistory(selected!.id), { enabled: tab === 'history' && !!selected?.id });

  // Dashboard widgets data
  const { data: ieChartData } = useQuery('ie-chart', () => reportsApi.getIEChart(7), { refetchInterval: 300000 });
  const { data: remindersData } = useQuery('reminders-today', reminderApi.getToday, { refetchInterval: 60000 });
  const { data: geoEventsData } = useQuery('geofence-events', () => reportsApi.getGeofenceEvents(15), { refetchInterval: 30000 });
  const { data: vehicleLocsData } = useQuery('vehicle-locations', reportsApi.getVehicleLocations, { refetchInterval: 60000 });

  const markReadMut = useMutation((id: string) => reminderApi.markAsRead(id), { onSuccess: () => qc.invalidateQueries('reminders-today') });

  const stats = statsData?.data;
  const geofences = geofencesData?.data || [];
  const history = historyData?.data || [];
  const ieChart = ieChartData?.data || { labels: [], income: [], expense: [] };
  const todayReminders = remindersData?.data || [];
  const geoEvents = geoEventsData?.data || [];
  const vehicleLocs = vehicleLocsData?.data || [];
  const unread = getUnreadAlertCount();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', flexShrink: 0, boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 13 }}>
          <StatChip color="var(--green)" count={stats?.moving ?? 0} label="moving" />
          <StatChip color="var(--orange)" count={stats?.idle ?? 0} label="idle" />
          <StatChip color="var(--red)" count={stats?.delayed ?? 0} label="delayed" />
          <StatChip color="var(--accent)" count={stats?.delivered ?? 0} label="delivered" />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {unread > 0 && (
            <button onClick={() => navigate('/alerts')} style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--red-light)', color: 'var(--red)', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              {unread} alerts
            </button>
          )}
        </div>
      </div>

      {/* Main area: sidebar + map + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 240px', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <ShipmentSidebar shipments={shipments} selected={selected} onSelect={s => { setSelected(s); setTab('live'); }} />

        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Map */}
          <div style={{ position: 'relative', flex: 1, minHeight: 300 }}>
            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, zIndex: 500 }}>
              {(['live', 'history', 'geo'] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: tab === t ? 'var(--accent)' : 'var(--bg-primary)', color: tab === t ? '#fff' : 'var(--text-secondary)', border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`, boxShadow: 'var(--shadow-sm)' }}>
                  {t === 'live' ? 'Live' : t === 'history' ? 'History' : 'Geofence'}
                </button>
              ))}
            </div>
            <LiveMap shipments={shipments} selectedId={selected?.id} onSelectShipment={setSelected} geofences={tab === 'geo' ? geofences : []} historyPath={tab === 'history' ? history : []} tab={tab} />
          </div>

          {/* Bottom widgets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--border)', borderTop: '1px solid var(--border)', maxHeight: 200, overflowY: 'auto' }}>

            {/* IE Chart */}
            <div style={{ background: 'var(--bg-primary)', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Income vs Expense (7d)</div>
              {ieChart.labels.length > 0 ? (
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 80 }}>
                  {ieChart.labels.map((label: string, i: number) => {
                    const maxVal = Math.max(...ieChart.income, ...ieChart.expense, 1);
                    const incH = (ieChart.income[i] / maxVal) * 70;
                    const expH = (ieChart.expense[i] / maxVal) * 70;
                    return (
                      <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 70 }}>
                          <div style={{ width: 6, height: incH, background: 'var(--green)', borderRadius: 2, minHeight: 2 }} title={`Income: ₹${ieChart.income[i]}`} />
                          <div style={{ width: 6, height: expH, background: 'var(--red)', borderRadius: 2, minHeight: 2 }} title={`Expense: ₹${ieChart.expense[i]}`} />
                        </div>
                        <div style={{ fontSize: 8, color: 'var(--text-tertiary)' }}>{label.split(' ')[0]}</div>
                      </div>
                    );
                  })}
                </div>
              ) : <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No data</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-tertiary)' }}><span style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} /> Income</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-tertiary)' }}><span style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--red)', display: 'inline-block' }} /> Expense</span>
              </div>
            </div>

            {/* Reminders */}
            <div style={{ background: 'var(--bg-primary)', padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Reminders</div>
                {todayReminders.length > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: 'var(--red-light)', color: 'var(--red)' }}>{todayReminders.length}</span>}
              </div>
              {todayReminders.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No reminders due today</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {todayReminders.slice(0, 5).map((r: any) => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{r.vehicle?.regNumber}</div>
                      </div>
                      <button onClick={() => markReadMut.mutate(r.id)} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Done</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Geofence events */}
            <div style={{ background: 'var(--bg-primary)', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Geofence Events</div>
              {geoEvents.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No recent events</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {geoEvents.slice(0, 6).map((e: any) => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '3px 0' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: e.type === 'GEOFENCE_ENTRY' ? 'var(--green)' : 'var(--red)' }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{e.vehicleId?.slice(0, 8)}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>{e.type === 'GEOFENCE_ENTRY' ? 'entered' : 'exited'}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)' }}>
                        {e.createdAt ? new Date(e.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DetailPanel shipment={selected} onRefresh={refetch} onViewHistory={() => selected && navigate(`/shipments/${selected.id}/history`)} />
      </div>
    </div>
  );
};

const StatChip: React.FC<{ color: string; count: number; label: string }> = ({ color, count, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span> {label}
  </div>
);
