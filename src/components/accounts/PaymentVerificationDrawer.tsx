import React, { useState } from 'react';
import { useApp, formatINR } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { X, CheckCircle, AlertOctagon, FileText, Building, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export const PaymentVerificationDrawer: React.FC = () => {
  const { activeModalData, payments, orders, verifyPayment, rejectPayment, closeModal, auditLogs } = useApp();

  const paymentId = activeModalData?.paymentId || payments[0]?.id;
  const payment = payments.find((p) => p.id === paymentId) || payments[0];
  const order = orders.find((o) => o.id === payment?.orderId);

  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectBox, setShowRejectBox] = useState<boolean>(false);

  if (!payment) return null;

  const relevantAudits = auditLogs.filter(
    (a) => a.reference.includes(payment.id) || (order && a.reference.includes(order.id))
  );

  const handleVerify = () => {
    verifyPayment(payment.id);
    closeModal();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('Please specify rejection reason for audit records.');
      return;
    }
    rejectPayment(payment.id, rejectReason);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Payment Verification Desk
              </span>
              <StatusBadge status={payment.status} size="sm" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Review UTR {payment.utr}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Key Amount Card */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[11px] text-slate-400">Verified Payment Amount</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {formatINR(payment.amount)}
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs">
                {payment.mode}
              </span>
              <div className="text-[11px] text-slate-400 mt-1">{payment.submittedAt}</div>
            </div>
          </div>

          {/* Payment & Order Details */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Transaction Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px]">Order ID</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{payment.orderId}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Dealership</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{payment.dealerAgency}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Dealer Contact</span>
                <p className="font-medium text-slate-700 dark:text-slate-300">{payment.dealerName}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Remitting Bank</span>
                <p className="font-medium text-slate-700 dark:text-slate-300">{payment.bankName}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 text-[10px]">Bank UTR Reference</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white text-sm bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  {payment.utr}
                </p>
              </div>
            </div>
          </div>

          {/* Order Snapshot if attached */}
          {order && (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Attached Plant Order Info
              </h3>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Feed Product:</span>
                <strong className="text-slate-800 dark:text-slate-200">{order.items[0]?.productName}</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Quantity &amp; Truck:</span>
                <span className="font-mono font-bold">
                  {order.totalBags} Bags ({order.totalWeightMT} MT) · {order.truckCapacity}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Destination:</span>
                <span className="font-medium">{order.destination}</span>
              </div>
            </div>
          )}

          {/* Receipt Preview */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Deposit Slip / RTGS Receipt
            </span>
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-400" />
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Official Bank Stamped Advice (PNB Dewas)
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                PUNBR52026100299841 · Timestamp: {payment.submittedAt} · Amount: {formatINR(payment.amount)}
              </p>
              <div className="px-2.5 py-1 text-[11px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-800">
                Digital Signature Verified
              </div>
            </div>
          </div>

          {/* Rejection Input Box if triggered */}
          {showRejectBox && (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-2">
              <label className="block text-xs font-bold text-rose-800 dark:text-rose-300">
                Rejection Reason (Required for Audit Trail)
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. UTR not reflecting in SBI statement or amount mismatch"
                className="w-full p-2 text-xs rounded border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

          {/* Audit History */}
          <div className="space-y-1.5 pt-2">
            <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Verification Audit History
            </span>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {relevantAudits.map((a) => (
                <div
                  key={a.id}
                  className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px]"
                >
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{a.action}</span>
                    <span className="font-mono text-slate-400">{a.timestamp}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5">
                    Actor: {a.user} ({a.role})
                  </div>
                  <p className="text-slate-500 mt-1">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowRejectBox(true)}
            disabled={payment.status === 'verified'}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Reject Payment</span>
          </button>

          <button
            type="button"
            onClick={handleVerify}
            disabled={payment.status === 'verified'}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{payment.status === 'verified' ? 'Already Verified' : 'Verify & Release to Bay 3'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
