import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { UserCheck, UserX, Users, Clock, QrCode, Download, CalendarDays, Search } from 'lucide-react';
import { vehicleApi, driverApi, attendanceApi } from '../services/api';

type Tab = 'today' | 'history' | 'qr';

export const AttendancePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('today');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [driverFilter, setDriverFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [qrVehicle, setQrVehicle] = useState('');
  const [qrData, setQrData] = useState('');

  const { data: todayData, isLoading: todayLoading } = useQuery('attendance-today', attendanceApi.getToday, { refetchInterval: 30000 });
  const { data: historyData, isLoading: historyLoading } = useQuery(
    ['attendance-history', dateFilter, driverFilter, vehicleFilter],
    () => attendanceApi.getAll({ date: dateFilter || undefined, driverId: driverFilter || undefined, vehicleId: vehicleFilter || undefined }),
    { enabled: tab === 'history' },
  );
  const { data: vehiclesData } = useQuery('vehicles-all', () => vehicleApi.getAll());
  const { data: driversData } = useQuery('drivers-all', () => driverApi.getAll());

  const today = todayData?.data || {};
  const records = today.records || [];
  const historyRecords = historyData?.data?.data || historyData?.data || [];
  const vehicles = vehiclesData?.data || [];
  const drivers = driversData?.data || [];

  const generateQR = async () => {
    if (!qrVehicle) return;
    const res = await attendanceApi.getQR(qrVehicle);
    setQrData(res.data.qr);
  };

  const downloadQR = () => {
    if (!qrData) return;
    const link = document.createElement('a');
    link.download = `vehicle-qr-${qrVehicle}.png`;
    link.href = qrData;
    link.click();
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Driver Attendance</h1>
        <div className="flex gap-2">
          {(['today', 'history', 'qr'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`}>
              {t === 'today' ? 'Today' : t === 'history' ? 'History' : 'QR Codes'}
            </button>
          ))}
        </div>
      </div>

      {/* TODAY TAB */}
      {tab === 'today' && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-5 gap-3 mb-5">
            {[
              { label: 'Total Drivers', value: today.totalDrivers || 0, icon: Users, color: 'text-slate-700', bar: 'bg-slate-500' },
              { label: 'Present Today', value: today.presentToday || 0, icon: UserCheck, color: 'text-emerald-600', bar: 'bg-emerald-500' },
              { label: 'On Duty Now', value: today.currentlyOnDuty || 0, icon: Clock, color: 'text-blue-600', bar: 'bg-blue-500' },
              { label: 'Checked Out', value: today.checkedOut || 0, icon: UserX, color: 'text-amber-600', bar: 'bg-amber-500' },
              { label: 'Absent', value: today.absent || 0, icon: UserX, color: 'text-red-600', bar: 'bg-red-500' },
            ].map(c => (
              <div key={c.label} className="stat-card">
                <div className={`stat-card-bar ${c.bar}`} />
                <div className="flex items-center gap-1.5 mb-1">
                  <c.icon size={12} className="text-slate-400" />
                  <span className="section-label !mb-0">{c.label}</span>
                </div>
                <div className={`text-2xl font-extrabold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Today's records */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {['Driver', 'Vehicle', 'Type', 'Location', 'Time'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {todayLoading && <tr><td colSpan={5} className="text-center text-slate-400 py-8">Loading...</td></tr>}
                {!todayLoading && records.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-8">No attendance recorded today</td></tr>}
                {records.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <div className="font-medium text-slate-800">{r.driver?.name || '—'}</div>
                      <div className="text-[11px] text-slate-400">{r.driver?.phone}</div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-700">{r.vehicle?.regNumber || r.vehicleSnapshot?.regNumber || '—'}</div>
                      <div className="text-[11px] text-slate-400">{r.vehicle?.type || r.vehicleSnapshot?.type}</div>
                    </td>
                    <td>
                      <span className={r.type === 'CHECK_IN' ? 'badge-green' : 'badge-orange'}>
                        {r.type === 'CHECK_IN' ? 'Check In' : 'Check Out'}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs max-w-[200px] truncate" title={r.address}>
                      {r.address || `${r.lat?.toFixed(4)}, ${r.lng?.toFixed(4)}`}
                    </td>
                    <td className="text-slate-500">
                      {r.createdAt ? new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <>
          <div className="flex gap-2 mb-4">
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input w-auto" />
            <select value={driverFilter} onChange={e => setDriverFilter(e.target.value)} className="select w-auto">
              <option value="">All drivers</option>
              {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="select w-auto">
              <option value="">All vehicles</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
            </select>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {['Driver', 'Vehicle', 'Type', 'Location', 'Selfie', 'Device', 'Time'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {historyLoading && <tr><td colSpan={7} className="text-center text-slate-400 py-8">Loading...</td></tr>}
                {!historyLoading && (!Array.isArray(historyRecords) || historyRecords.length === 0) && <tr><td colSpan={7} className="text-center text-slate-400 py-8">No records found</td></tr>}
                {Array.isArray(historyRecords) && historyRecords.map((r: any) => (
                  <tr key={r.id}>
                    <td className="font-medium text-slate-800">{r.driver?.name || '—'}</td>
                    <td className="text-slate-700">{r.vehicle?.regNumber || r.vehicleSnapshot?.regNumber || '—'}</td>
                    <td>
                      <span className={r.type === 'CHECK_IN' ? 'badge-green' : 'badge-orange'}>
                        {r.type === 'CHECK_IN' ? 'Check In' : 'Check Out'}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs max-w-[180px] truncate" title={r.address}>{r.address || '—'}</td>
                    <td>
                      {r.selfieUrl ? (
                        <a href={r.selfieUrl} target="_blank" rel="noreferrer" className="text-brand-600 text-xs underline">View</a>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="text-slate-400 text-[11px]">{r.deviceInfo || '—'}</td>
                    <td className="text-slate-500">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* QR CODES TAB */}
      {tab === 'qr' && (
        <div className="grid grid-cols-[1fr_400px] gap-6">
          {/* Vehicle list with QR buttons */}
          <div>
            <div className="section-label mb-3">Generate QR for vehicle</div>
            <div className="card divide-y divide-slate-100">
              {vehicles.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between px-4 py-3 hover:bg-blue-50/30 transition-colors">
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{v.regNumber}</div>
                    <div className="text-[11px] text-slate-400">{v.make} {v.model} · {v.type}</div>
                  </div>
                  <button onClick={() => { setQrVehicle(v.id); attendanceApi.getQR(v.id).then(r => setQrData(r.data.qr)); }}
                    className={`btn-sm ${qrVehicle === v.id ? 'btn-primary' : 'btn-secondary'}`}>
                    <QrCode size={14} /> QR
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* QR preview */}
          <div className="card p-6 text-center sticky top-6 self-start">
            {qrData ? (
              <>
                <div className="section-label mb-3">Vehicle QR Code</div>
                <img src={qrData} alt="QR Code" className="mx-auto mb-4 rounded-lg border border-slate-200 shadow-sm" />
                <div className="text-sm font-medium text-slate-700 mb-1">
                  {vehicles.find((v: any) => v.id === qrVehicle)?.regNumber}
                </div>
                <div className="text-xs text-slate-400 mb-4">
                  Driver scans this QR to mark attendance
                </div>
                <button onClick={downloadQR} className="btn-primary w-full">
                  <Download size={16} /> Download QR
                </button>
                <div className="mt-3 text-[11px] text-slate-400">
                  Print and place on vehicle dashboard
                </div>
              </>
            ) : (
              <div className="py-12 text-slate-400 text-sm">
                <QrCode size={48} className="mx-auto mb-3 text-slate-300" />
                Select a vehicle to generate QR code
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
