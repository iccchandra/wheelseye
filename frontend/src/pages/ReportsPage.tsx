import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { reportsApi } from '../services/api';
import { Download, Package, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

const fmt = (n: number) => n?.toLocaleString('en-IN') ?? '\u2014';

export const ReportsPage: React.FC = () => {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  const params = { from, to };

  const { data: otdrData }    = useQuery(['otdr',    from, to], () => reportsApi.getOTDR(params),            { keepPreviousData: true });
  const { data: lanesData }   = useQuery(['lanes',   from, to], () => reportsApi.getLanePerformance(params), { keepPreviousData: true });
  const { data: carriersData }= useQuery(['carriers',from, to], () => reportsApi.getCarrierScorecard(params),{ keepPreviousData: true });

  const otdr     = otdrData?.data     || {};
  const lanes    = lanesData?.data    || [];
  const carriers = carriersData?.data || [];

  const exportExcel = async () => {
    const res  = await reportsApi.exportExcel(params);
    const url  = URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href  = url;
    link.download = `shipments-report-${from}-${to}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page space-y-5">

      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <div className="flex gap-2 items-center">
          <label className="text-xs text-slate-500">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input w-auto" />
          <label className="text-xs text-slate-500">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input w-auto" />
          <button onClick={exportExcel} className="btn-secondary">
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* OTDR summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total delivered',  value: fmt(otdr.total),       icon: Package,       barColor: 'bg-brand-500' },
          { label: 'On time',          value: fmt(otdr.onTime),      icon: CheckCircle,   barColor: 'bg-emerald-500' },
          { label: 'Delayed',          value: fmt(otdr.delayed),     icon: AlertTriangle,  barColor: 'bg-red-500' },
          { label: 'OTDR %',           value: `${otdr.otdrPercent ?? 0}%`, icon: TrendingUp, barColor: otdr.otdrPercent >= 85 ? 'bg-emerald-500' : 'bg-red-500' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card-bar ${s.barColor}`} />
            <div className="flex items-center gap-3 mt-1">
              <s.icon size={18} className="text-slate-400" />
              <div>
                <div className="text-xl font-semibold text-slate-800">{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lane performance */}
      <div className="table-container">
        <div className="px-4 py-3 border-b border-slate-200 text-sm font-semibold text-slate-700">Lane performance</div>
        <table>
          <thead>
            <tr>
              {['Lane', 'Trips', 'Avg freight (\u20B9)', 'Avg transit (hrs)'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lanes.length === 0 && <tr><td colSpan={4} className="text-center text-slate-400 py-5">No data for period</td></tr>}
            {lanes.map((l: any, i: number) => (
              <tr key={i}>
                <td className="font-medium text-slate-800">{l.lane}</td>
                <td className="text-slate-700">{l.count}</td>
                <td className="text-slate-700">{'\u20B9'}{fmt(l.avgAmount)}</td>
                <td className="text-slate-700">{l.avgTransitHours}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Carrier scorecard */}
      <div className="table-container">
        <div className="px-4 py-3 border-b border-slate-200 text-sm font-semibold text-slate-700">Carrier scorecard</div>
        <table>
          <thead>
            <tr>
              {['Vehicle', 'Trips', 'On time', 'Delayed', 'OTDR %'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {carriers.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-5">No data for period</td></tr>}
            {carriers.map((c: any) => (
              <tr key={c.vehicleId}>
                <td className="font-medium text-slate-800">{c.regNumber}</td>
                <td className="text-slate-700">{c.trips}</td>
                <td className="text-emerald-600">{c.onTime}</td>
                <td className={c.delayed > 0 ? 'text-red-600' : 'text-slate-400'}>{c.delayed}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.otdr >= 85 ? 'bg-emerald-500' : c.otdr >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${c.otdr}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 min-w-[36px]">{c.otdr}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
