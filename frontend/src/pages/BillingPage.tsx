import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { billingApi, documentApi } from '../services/api';
import { Download, CreditCard } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  DRAFT:     'badge-gray',
  SENT:      'badge-blue',
  PAID:      'badge-green',
  OVERDUE:   'badge-red',
  CANCELLED: 'badge-gray',
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
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Billing & invoices</h1>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select w-40">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {['Invoice #', 'Shipment', 'Consignee', 'Amount', 'Due date', 'Status', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center text-slate-400 py-6">Loading...</td></tr>}
            {!isLoading && invoices.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-6">No invoices found</td></tr>}
            {invoices.map((inv: any) => {
              const badgeCls = STATUS_BADGE[inv.status] || STATUS_BADGE.DRAFT;
              const overdue = inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < new Date();
              return (
                <tr key={inv.id}>
                  <td className="font-medium text-slate-800">{inv.invoiceNumber}</td>
                  <td className="text-slate-500">{inv.shipment?.trackingNumber || '—'}</td>
                  <td className="text-slate-500">{inv.consigneeName || '—'}</td>
                  <td className="font-medium text-slate-800">{'\u20B9'}{(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td className={overdue ? 'text-red-600' : 'text-slate-500'}>
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}
                    {overdue && <span className="badge-red ml-1 text-[10px]">OVERDUE</span>}
                  </td>
                  <td>
                    <span className={badgeCls}>{inv.status}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => downloadPDF(inv.id, inv.invoiceNumber)} className="btn-secondary btn-sm">
                        <Download className="w-3 h-3" /> PDF
                      </button>
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <button onClick={() => payMutation.mutate(inv.id)} className="btn-primary btn-sm">
                          <CreditCard className="w-3 h-3" /> Pay
                        </button>
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
