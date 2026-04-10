import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { shipmentApi, shipmentPaymentApi, documentApi } from '../services/api';
import { ArrowLeft, MapPin, History, Mail, Plus, Trash2, ExternalLink, FileText, Receipt, Link2, Truck, User, Camera, IndianRupee, CreditCard, Wallet } from 'lucide-react';

const STATUS_COLORS: Record<string, { badge: string; label: string }> = {
  INQUIRY:    { badge: 'badge-purple', label: 'Inquiry' },
  QUOTED:     { badge: 'badge-cyan',   label: 'Quoted' },
  BOOKED:     { badge: 'badge-blue',   label: 'Booked' },
  DISPATCHED: { badge: 'badge-orange', label: 'Dispatched' },
  IN_TRANSIT: { badge: 'badge-green',  label: 'In Transit' },
  DELAYED:    { badge: 'badge-red',    label: 'Delayed' },
  DELIVERED:  { badge: 'badge-green',  label: 'Delivered' },
  CANCELLED:  { badge: 'badge-gray',   label: 'Cancelled' },
};

export const ShipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const { data: shipData, isLoading } = useQuery(['shipment', id], () => shipmentApi.getOne(id!), { enabled: !!id });
  const { data: payData, refetch: refetchPay } = useQuery(['shipment-payments', id], () => shipmentPaymentApi.getByShipment(id!), { enabled: !!id });

  const shipment = shipData?.data;
  const payments = payData?.data;

  const addPayMut = useMutation(
    (d: any) => shipmentPaymentApi.create(d),
    { onSuccess: () => { refetchPay(); setShowPayForm(false); setPayAmount(''); setPayMethod(''); setPayNotes(''); } },
  );
  const deletePayMut = useMutation(
    (payId: string) => shipmentPaymentApi.remove(payId),
    { onSuccess: () => refetchPay() },
  );

  const sendEmailMut = useMutation((type: string) =>
    type === 'booking' ? shipmentApi.getOne(id!).then(() => fetch(`/api/v1/shipments/${id}/email/booking`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }))
      : fetch(`/api/v1/shipments/${id}/email/tracking`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } })
  );

  if (isLoading || !shipment) return <div className="py-10 text-center text-slate-400">Loading...</div>;

  const sc = STATUS_COLORS[shipment.status] || STATUS_COLORS.INQUIRY;
  const totalAmount = shipment.finalAmount || shipment.quotedAmount || 0;
  const totalPaid = payments?.totalPaid || 0;
  const balance = totalAmount - totalPaid;

  return (
    <div className="page">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/shipments')} className="btn-secondary btn-sm inline-flex items-center gap-1">
            <ArrowLeft size={14} />
            Back
          </button>
          <div>
            <div className="text-lg font-bold text-slate-800">{shipment.trackingNumber}</div>
            <div className="text-sm text-slate-500">{shipment.origin} → {shipment.destination}</div>
          </div>
          <span className={sc.badge}>{sc.label}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/dashboard?shipmentId=${id}`)} className="btn-secondary btn-sm inline-flex items-center gap-1">
            <MapPin size={14} />
            Track Live
          </button>
          <button onClick={() => navigate(`/shipments/${id}/history`)} className="btn-secondary btn-sm inline-flex items-center gap-1">
            <History size={14} />
            Route History
          </button>
          <button onClick={() => sendEmailMut.mutate('tracking')} className="btn-primary btn-sm inline-flex items-center gap-1">
            <Mail size={14} />
            Send Tracking Email
          </button>
        </div>
      </div>

      {/* Payment summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Amount', value: `₹${totalAmount.toLocaleString('en-IN')}`, color: 'text-brand-600', bar: 'bg-brand-600', icon: IndianRupee },
          { label: 'Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, color: 'text-emerald-600', bar: 'bg-emerald-500', icon: CreditCard },
          { label: balance >= 0 ? 'Balance Due' : 'Excess Paid', value: `₹${Math.abs(balance).toLocaleString('en-IN')}`, color: balance > 0 ? 'text-red-600' : 'text-emerald-600', bar: balance > 0 ? 'bg-red-500' : 'bg-emerald-500', icon: Wallet },
        ].map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="stat-card">
              <div className={`stat-card-bar ${c.bar}`} />
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={12} className="text-slate-400" />
                <span className="section-label !mb-0">{c.label}</span>
              </div>
              <div className={`text-2xl font-extrabold ${c.color}`}>{c.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4">
        {/* Left — Shipment info + Payments */}
        <div className="flex flex-col gap-4">
          {/* Shipment details */}
          <div className="card p-4">
            <div className="section-label">Shipment Details</div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Origin', shipment.origin],
                ['Destination', shipment.destination],
                ['Cargo', `${shipment.cargoDescription || '—'} · ${shipment.weightMT || 0} MT`],
                ['Truck Type', shipment.truckType || '—'],
                ['Scheduled Pickup', shipment.scheduledPickup ? new Date(shipment.scheduledPickup).toLocaleDateString('en-IN') : '—'],
                ['Estimated Delivery', shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString('en-IN') : '—'],
                ['Actual Pickup', shipment.actualPickup ? new Date(shipment.actualPickup).toLocaleDateString('en-IN') : '—'],
                ['Actual Delivery', shipment.actualDelivery ? new Date(shipment.actualDelivery).toLocaleDateString('en-IN') : '—'],
                ['Quoted Amount', shipment.quotedAmount ? `₹${shipment.quotedAmount.toLocaleString('en-IN')}` : '—'],
                ['Final Amount', shipment.finalAmount ? `₹${shipment.finalAmount.toLocaleString('en-IN')}` : '—'],
                ['Insurance', shipment.insuranceEnabled ? `₹${(shipment.insuranceCoverage || 0).toLocaleString('en-IN')} coverage` : 'No'],
              ].map(([l, v]) => (
                <div key={l as string} className="flex justify-between text-sm py-1">
                  <span className="text-slate-400">{l}</span>
                  <span className="font-medium text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Activity */}
          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="section-label !mb-0">Payment Activity</div>
              <button onClick={() => setShowPayForm(true)} className="btn-primary btn-sm inline-flex items-center gap-1">
                <Plus size={12} />
                Add Payment
              </button>
            </div>

            {showPayForm && (
              <div className="bg-slate-50 rounded-lg p-3.5 mb-3 border border-slate-200">
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Amount" min="0.01" className="input" />
                  <input value={payMethod} onChange={e => setPayMethod(e.target.value)} placeholder="Method (cash/UPI/bank)" className="input" />
                  <input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Notes" className="input" />
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => { if (payAmount) addPayMut.mutate({ shipmentId: id, amount: parseFloat(payAmount), paymentMethod: payMethod, notes: payNotes }); }}
                    disabled={addPayMut.isLoading} className="btn btn-sm bg-emerald-500 text-white hover:bg-emerald-600 border-0">
                    {addPayMut.isLoading ? 'Saving...' : 'Record Payment'}
                  </button>
                  <button onClick={() => setShowPayForm(false)} className="btn-secondary btn-sm">Cancel</button>
                </div>
              </div>
            )}

            {(!payments?.payments || payments.payments.length === 0) ? (
              <div className="py-5 text-center text-slate-400 text-sm">No payments recorded</div>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr>
                    {['Amount', 'Method', 'Notes', 'Date', ''].map(h => <th key={h}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {payments.payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="text-sm font-semibold text-emerald-600">₹{p.amount?.toLocaleString('en-IN')}</td>
                        <td className="text-xs text-slate-500">{p.paymentMethod || '—'}</td>
                        <td className="text-xs text-slate-500">{p.notes || '—'}</td>
                        <td className="text-xs text-slate-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}</td>
                        <td>
                          <button onClick={() => { if (confirm('Delete this payment?')) deletePayMut.mutate(p.id); }} className="btn-danger btn-sm inline-flex items-center gap-1">
                            <Trash2 size={11} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right — Customer, Driver, Vehicle info */}
        <div className="flex flex-col gap-4">
          {/* Vehicle & Driver */}
          <div className="card p-4">
            <div className="section-label flex items-center gap-1.5">
              <Truck size={12} />
              Vehicle &amp; Driver
            </div>
            {[
              ['Vehicle', shipment.vehicle?.regNumber || 'Not assigned'],
              ['Type', shipment.vehicle?.type || '—'],
              ['Driver', shipment.driver?.name || 'Not assigned'],
              ['Driver Phone', shipment.driver?.phone || '—'],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between text-sm py-1">
                <span className="text-slate-400">{l}</span>
                <span className="font-medium text-slate-800">{v}</span>
              </div>
            ))}
          </div>

          {/* Customer */}
          <div className="card p-4">
            <div className="section-label flex items-center gap-1.5">
              <User size={12} />
              Customer
            </div>
            {[
              ['Consignee', shipment.consigneeName || '—'],
              ['Phone', shipment.consigneePhone || '—'],
              ['Shipper Phone', shipment.shipperPhone || '—'],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between text-sm py-1">
                <span className="text-slate-400">{l}</span>
                <span className="font-medium text-slate-800">{v}</span>
              </div>
            ))}
          </div>

          {/* POD */}
          <div className="card p-4">
            <div className="section-label flex items-center gap-1.5">
              <Camera size={12} />
              Proof of Delivery
            </div>
            {shipment.podImageUrl ? (
              <div>
                <a href={shipment.podImageUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-600 font-medium underline inline-flex items-center gap-1">
                  <ExternalLink size={12} />
                  View POD
                </a>
                <div className="text-[11px] text-slate-400 mt-1">Captured: {shipment.podCapturedAt ? new Date(shipment.podCapturedAt).toLocaleString('en-IN') : '—'}</div>
              </div>
            ) : <div className="text-sm text-slate-400">Not uploaded yet</div>}
          </div>

          {/* Documents */}
          <div className="card p-4">
            <div className="section-label flex items-center gap-1.5">
              <FileText size={12} />
              Documents
            </div>
            <div className="flex flex-col gap-1.5">
              <button onClick={async () => { const r = await documentApi.downloadLR(id!); const u = URL.createObjectURL(new Blob([r.data])); window.open(u); }}
                className="btn-secondary btn-sm text-left justify-start inline-flex items-center gap-2">
                <Receipt size={13} />
                Download Lorry Receipt (LR)
              </button>
              <button onClick={async () => { const r = await documentApi.downloadInvoice(id!); const u = URL.createObjectURL(new Blob([r.data])); window.open(u); }}
                className="btn-secondary btn-sm text-left justify-start inline-flex items-center gap-2">
                <FileText size={13} />
                Download Invoice PDF
              </button>
            </div>
          </div>

          {/* Tracking link */}
          <div className="card p-4">
            <div className="section-label flex items-center gap-1.5">
              <Link2 size={12} />
              Tracking Link
            </div>
            <div className="text-xs text-brand-600 break-all">
              {window.location.origin}/track/{shipment.trackingNumber}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
