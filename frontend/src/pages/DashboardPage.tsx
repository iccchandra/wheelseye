import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LiveMap } from '../components/dashboard/LiveMap';
import { ShipmentSidebar } from '../components/dashboard/ShipmentSidebar';
import { DetailPanel } from '../components/dashboard/DetailPanel';
import { useGpsSocket } from '../hooks/useGpsSocket';
import { shipmentApi, gpsApi, reportsApi, reminderApi, vehicleApi } from '../services/api';
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
  const { data: allVehiclesData } = useQuery('vehicles-all', () => vehicleApi.getAll(), { refetchInterval: 60000 });

  const markReadMut = useMutation((id: string) => reminderApi.markAsRead(id), { onSuccess: () => qc.invalidateQueries('reminders-today') });

  const stats = statsData?.data;
  const geofences = geofencesData?.data || [];
  const history = historyData?.data || [];
  const ieChart = ieChartData?.data || { labels: [], income: [], expense: [] };
  const todayReminders = remindersData?.data || [];
  const geoEvents = geoEventsData?.data || [];
  const vehicleLocs = vehicleLocsData?.data || [];
  const allVehicles = allVehiclesData?.data || [];
  const unread = getUnreadAlertCount();

  return (
    <div className="flex flex-col h-screen">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12 bg-white border-b border-slate-200 shrink-0 shadow-sm">
        <div className="flex gap-4.5 items-center text-[13px]">
          <StatChip color="bg-emerald-500" count={stats?.moving ?? 0} label="moving" />
          <StatChip color="bg-amber-500" count={stats?.idle ?? 0} label="idle" />
          <StatChip color="bg-red-500" count={stats?.delayed ?? 0} label="delayed" />
          <StatChip color="bg-brand-500" count={stats?.delivered ?? 0} label="delivered" />
        </div>
        <div className="flex gap-2 items-center">
          {unread > 0 && (
            <button onClick={() => navigate('/alerts')} className="px-3 py-1 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors">
              {unread} alerts
            </button>
          )}
        </div>
      </div>

      {/* Main area: sidebar + map + detail */}
      <div className="grid grid-cols-[220px_1fr_240px] flex-1 overflow-hidden min-h-0">
        <ShipmentSidebar shipments={shipments} selected={selected} onSelect={s => { setSelected(s); setTab('live'); }} />

        <div className="flex flex-col overflow-hidden">
          {/* Map */}
          <div className="relative flex-1 min-h-[300px]">
            <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-[500]">
              {(['live', 'history', 'geo'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer shadow-sm border transition-colors ${
                    tab === t
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t === 'live' ? 'Live' : t === 'history' ? 'History' : 'Geofence'}
                </button>
              ))}
            </div>
            <LiveMap shipments={shipments} vehicles={allVehicles} selectedId={selected?.id} onSelectShipment={setSelected} geofences={tab === 'geo' ? geofences : []} historyPath={tab === 'history' ? history : []} tab={tab} />
          </div>

          {/* Bottom widgets */}
          <div className="grid grid-cols-3 gap-px bg-slate-200 border-t border-slate-200 max-h-[200px] overflow-y-auto">

            {/* IE Chart */}
            <div className="bg-white p-3">
              <div className="section-label mb-2">Income vs Expense (7d)</div>
              {ieChart.labels.length > 0 ? (
                <div className="flex gap-0.5 items-end h-20">
                  {ieChart.labels.map((label: string, i: number) => {
                    const maxVal = Math.max(...ieChart.income, ...ieChart.expense, 1);
                    const incH = (ieChart.income[i] / maxVal) * 70;
                    const expH = (ieChart.expense[i] / maxVal) * 70;
                    return (
                      <div key={label} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="flex gap-px items-end h-[70px]">
                          <div className="w-1.5 bg-emerald-500 rounded-sm min-h-[2px]" style={{ height: incH }} title={`Income: \u20B9${ieChart.income[i]}`} />
                          <div className="w-1.5 bg-red-500 rounded-sm min-h-[2px]" style={{ height: expH }} title={`Expense: \u20B9${ieChart.expense[i]}`} />
                        </div>
                        <div className="text-[8px] text-slate-400">{label.split(' ')[0]}</div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="text-xs text-slate-400">No data</div>}
              <div className="flex gap-2.5 mt-1.5 text-[10px]">
                <span className="flex items-center gap-1 text-slate-400"><span className="w-1.5 h-1.5 rounded-sm bg-emerald-500 inline-block" /> Income</span>
                <span className="flex items-center gap-1 text-slate-400"><span className="w-1.5 h-1.5 rounded-sm bg-red-500 inline-block" /> Expense</span>
              </div>
            </div>

            {/* Reminders */}
            <div className="bg-white p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="section-label !mb-0">Today's Reminders</div>
                {todayReminders.length > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">{todayReminders.length}</span>}
              </div>
              {todayReminders.length === 0 ? <div className="text-xs text-slate-400">No reminders due today</div> : (
                <div className="flex flex-col gap-1">
                  {todayReminders.slice(0, 5).map((r: any) => (
                    <div key={r.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
                      <div>
                        <div className="font-medium text-slate-800">{r.title}</div>
                        <div className="text-[10px] text-slate-400">{r.vehicle?.regNumber}</div>
                      </div>
                      <button onClick={() => markReadMut.mutate(r.id)} className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 cursor-pointer">Done</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Geofence events */}
            <div className="bg-white p-3">
              <div className="section-label mb-2">Geofence Events</div>
              {geoEvents.length === 0 ? <div className="text-xs text-slate-400">No recent events</div> : (
                <div className="flex flex-col gap-0.5">
                  {geoEvents.slice(0, 6).map((e: any) => (
                    <div key={e.id} className="flex items-center gap-1.5 text-[11px] py-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${e.type === 'GEOFENCE_ENTRY' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="font-medium text-slate-800">{e.vehicleId?.slice(0, 8)}</span>
                      <span className="text-slate-400">{e.type === 'GEOFENCE_ENTRY' ? 'entered' : 'exited'}</span>
                      <span className="ml-auto text-[10px] text-slate-400">
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
  <div className="flex items-center gap-1.5 text-slate-500">
    <span className={`w-[7px] h-[7px] rounded-full inline-block ${color}`} />
    <span className="font-semibold text-slate-800">{count}</span> {label}
  </div>
);
