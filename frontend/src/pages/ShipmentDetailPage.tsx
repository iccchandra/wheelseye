import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { shipmentApi, shipmentPaymentApi, documentApi } from '../services/api';

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  INQUIRY:    { bg: 'var(--purple-light)', color: 'var(--purple)', label: 'Inquiry' },
  QUOTED:     { bg: 'var(--cyan-light)',   color: 'var(--cyan)',   label: 'Quoted' },
  BOOKED:     { bg: 'var(--accent-light)', color: 'var(--accent)', label: 'Booked' },
  DISPATCHED: { bg: 'var(--orange-light)', color: 'var(--orange)', label: 'Dispatched' },
  IN_TRANSIT: { bg: 'var(--green-light)',  color: 'var(--green)',  label: 'In Transit' },
  DELAYED:    { bg: 'var(--red-light)',    color: 'var(--red)',    label: 'Delayed' },
  DELIVERED:  { bg: 'var(--green-light)',  color: 'var(--green)',  label: 'Delivered' },
  CANCELLED:  { bg: 'var(--bg-tertiary)',  color: 'var(--text-tertiary)', label: 'Cancelled' },
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

  if (isLoading || !shipment) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;

  const sc = STATUS_COLORS[shipment.status] || STATUS_COLORS.INQUIRY;
  const totalAmount = shipment.finalAmount || shipment.quotedAmount || 0;
  const totalPaid = payments?.totalPaid || 0;
  const balance = totalAmount - totalPaid;

  const card: React.CSSProperties = { background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, boxShadow: 'var(--shadow-sm)' };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 6 };

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/shipments')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Back</button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{shipment.trackingNumber}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{shipment.origin} → {shipment.destination}</div>
          </div>
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/dashboard?shipmentId=${id}`)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Track Live</button>
          <button onClick={() => navigate(`/shipments/${id}/history`)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Route History</button>
          <button onClick={() => sendEmailMut.mutate('tracking')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-gradient)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: 'var(--shadow-colored)' }}>Send Tracking Email</button>
        </div>
      </div>

      {/* Payment summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Amount', value: `₹${totalAmount.toLocaleString('en-IN')}`, color: 'var(--accent)', gradient: 'var(--accent-gradient)' },
          { label: 'Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, color: 'var(--green)', gradient: 'var(--green-gradient)' },
          { label: balance >= 0 ? 'Balance Due' : 'Excess Paid', value: `₹${Math.abs(balance).toLocaleString('en-IN')}`, color: balance > 0 ? 'var(--red)' : 'var(--green)', gradient: balance > 0 ? 'var(--red-gradient)' : 'var(--green-gradient)' },
        ].map(c => (
          <div key={c.label} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.gradient }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Left — Shipment info + Payments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Shipment details */}
          <div style={card}>
            <div style={lbl}>Shipment Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{l}</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Activity */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={lbl}>Payment Activity</div>
              <button onClick={() => setShowPayForm(true)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', background: 'var(--accent-gradient)', color: '#fff', cursor: 'pointer' }}>+ Add Payment</button>
            </div>

            {showPayForm && (
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Amount" min="0.01" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                  <input value={payMethod} onChange={e => setPayMethod(e.target.value)} placeholder="Method (cash/UPI/bank)" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                  <input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Notes" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={() => { if (payAmount) addPayMut.mutate({ shipmentId: id, amount: parseFloat(payAmount), paymentMethod: payMethod, notes: payNotes }); }}
                    disabled={addPayMut.isLoading} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', background: 'var(--green)', color: '#fff', cursor: 'pointer' }}>
                    {addPayMut.isLoading ? 'Saving...' : 'Record Payment'}
                  </button>
                  <button onClick={() => setShowPayForm(false)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {(!payments?.payments || payments.payments.length === 0) ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No payments recorded</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Amount', 'Method', 'Notes', 'Date', ''].map(h => <th key={h}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {payments.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.paymentMethod || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.notes || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}</td>
                      <td><button onClick={() => { if (confirm('Delete this payment?')) deletePayMut.mutate(p.id); }} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, border: '1px solid var(--border)', background: 'var(--red-light)', color: 'var(--red)', cursor: 'pointer' }}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right — Customer, Driver, Vehicle info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Vehicle & Driver */}
          <div style={card}>
            <div style={lbl}>Vehicle & Driver</div>
            {[
              ['Vehicle', shipment.vehicle?.regNumber || 'Not assigned'],
              ['Type', shipment.vehicle?.type || '—'],
              ['Driver', shipment.driver?.name || 'Not assigned'],
              ['Driver Phone', shipment.driver?.phone || '—'],
            ].map(([l, v]) => (
              <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{l}</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Customer */}
          <div style={card}>
            <div style={lbl}>Customer</div>
            {[
              ['Consignee', shipment.consigneeName || '—'],
              ['Phone', shipment.consigneePhone || '—'],
              ['Shipper Phone', shipment.shipperPhone || '—'],
            ].map(([l, v]) => (
              <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{l}</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* POD */}
          <div style={card}>
            <div style={lbl}>Proof of Delivery</div>
            {shipment.podImageUrl ? (
              <div>
                <a href={shipment.podImageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, textDecoration: 'underline' }}>View POD</a>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Captured: {shipment.podCapturedAt ? new Date(shipment.podCapturedAt).toLocaleString('en-IN') : '—'}</div>
              </div>
            ) : <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Not uploaded yet</div>}
          </div>

          {/* Documents */}
          <div style={card}>
            <div style={lbl}>Documents</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={async () => { const r = await documentApi.downloadLR(id!); const u = URL.createObjectURL(new Blob([r.data])); window.open(u); }}
                style={{ padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left' }}>
                Download Lorry Receipt (LR)
              </button>
              <button onClick={async () => { const r = await documentApi.downloadInvoice(id!); const u = URL.createObjectURL(new Blob([r.data])); window.open(u); }}
                style={{ padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left' }}>
                Download Invoice PDF
              </button>
            </div>
          </div>

          {/* Tracking link */}
          <div style={card}>
            <div style={lbl}>Tracking Link</div>
            <div style={{ fontSize: 12, color: 'var(--accent)', wordBreak: 'break-all' }}>
              {window.location.origin}/track/{shipment.trackingNumber}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
