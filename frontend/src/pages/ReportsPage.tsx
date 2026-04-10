import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { reportsApi } from '../services/api';

const fmt = (n: number) => n?.toLocaleString('en-IN') ?? '—';

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

  const inputStyle: React.CSSProperties = { padding: '5px 8px', border: '0.5px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Reports</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
          <button onClick={exportExcel} style={{ padding: '6px 14px', borderRadius: 7, background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97', fontSize: 13, cursor: 'pointer' }}>Export Excel</button>
        </div>
      </div>

      {/* OTDR summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total delivered',  value: fmt(otdr.total),       color: 'var(--text-primary)' },
          { label: 'On time',          value: fmt(otdr.onTime),      color: '#3B6D11' },
          { label: 'Delayed',          value: fmt(otdr.delayed),     color: '#A32D2D' },
          { label: 'OTDR %',           value: `${otdr.otdrPercent ?? 0}%`, color: otdr.otdrPercent >= 85 ? '#3B6D11' : '#A32D2D' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Lane performance */}
      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Lane performance</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Lane', 'Trips', 'Avg freight (₹)', 'Avg transit (hrs)'].map(h => (
                <th key={h} style={{ padding: '7px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lanes.length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No data for period</td></tr>}
            {lanes.map((l: any, i: number) => (
              <tr key={i} style={{ borderBottom: '0.5px solid var(--border)' }}>
                <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{l.lane}</td>
                <td style={{ padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)' }}>{l.count}</td>
                <td style={{ padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)' }}>₹{fmt(l.avgAmount)}</td>
                <td style={{ padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)' }}>{l.avgTransitHours}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Carrier scorecard */}
      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Carrier scorecard</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Vehicle', 'Trips', 'On time', 'Delayed', 'OTDR %'].map(h => (
                <th key={h} style={{ padding: '7px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {carriers.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No data for period</td></tr>}
            {carriers.map((c: any) => (
              <tr key={c.vehicleId} style={{ borderBottom: '0.5px solid var(--border)' }}>
                <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{c.regNumber}</td>
                <td style={{ padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)' }}>{c.trips}</td>
                <td style={{ padding: '9px 12px', fontSize: 13, color: '#3B6D11' }}>{c.onTime}</td>
                <td style={{ padding: '9px 12px', fontSize: 13, color: c.delayed > 0 ? '#A32D2D' : 'var(--text-secondary)' }}>{c.delayed}</td>
                <td style={{ padding: '9px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.otdr}%`, background: c.otdr >= 85 ? '#3B6D11' : c.otdr >= 70 ? '#BA7517' : '#A32D2D', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', minWidth: 36 }}>{c.otdr}%</span>
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
