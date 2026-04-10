import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { billingApi, documentApi } from '../services/api';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  DRAFT:     { bg: '#F1EFE8', color: '#5F5E5A' },
  SENT:      { bg: '#E6F1FB', color: '#185FA5' },
  PAID:      { bg: '#EAF3DE', color: '#3B6D11' },
  OVERDUE:   { bg: '#FCEBEB', color: '#A32D2D' },
  CANCELLED: { bg: '#F1EFE8', color: '#888780' },
};

declare global { interface Window { Razorpay: any; } }

export const BillingPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery(
    ['invoices', statusFilter],
    () => billingApi.getInvoices({ status: statusFilter || undefined, limit: 20 }),
    { keepPreviousData: true },
  );

  const payMutation = useMutation(
    async (invoiceId: string) => {
      const orderRes = await billingApi.createPaymentOrder(invoiceId);
      const order    = orderRes.data;
      return new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:          order.key_id,
          amount:       order.amount,
          currency:     'INR',
          order_id:     order.id,
          name:         'FreightTrack',
          description:  `Invoice ${order.receipt}`,
          handler: async (response: any) => {
            await billingApi.verifyPayment(invoiceId, response.razorpay_payment_id);
            qc.invalidateQueries('invoices');
            resolve();
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
        });
        rzp.open();
      });
    }
  );

  const downloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    const res  = await documentApi.downloadInvoice(invoiceId);
    const url  = URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href  = url;
    link.download = `${invoiceNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const responseData = data?.data;
  const invoices = Array.isArray(responseData) ? responseData : responseData?.data || [];

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Billing &amp; invoices</div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '6px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-secondary)', outline: 'none' }}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Invoice #', 'Shipment', 'Consignee', 'Amount (₹)', 'Due date', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading...</td></tr>}
            {!isLoading && invoices.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No invoices found</td></tr>}
            {invoices.map((inv: any) => {
              const ss = STATUS_STYLE[inv.status] || STATUS_STYLE.DRAFT;
              const overdue = inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < new Date();
              return (
                <tr key={inv.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{inv.shipment?.trackingNumber || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{inv.consigneeName || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: overdue ? '#A32D2D' : 'var(--text-secondary)' }}>
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}
                    {overdue && <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 500, background: '#FCEBEB', color: '#A32D2D', padding: '1px 5px', borderRadius: 3 }}>OVERDUE</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 7px', borderRadius: 4, background: ss.bg, color: ss.color }}>{inv.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => downloadPDF(inv.id, inv.invoiceNumber)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>PDF</button>
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <button onClick={() => payMutation.mutate(inv.id)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid #B5D4F4', background: '#E6F1FB', color: '#0C447C', cursor: 'pointer' }}>Pay</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
