import React, { useState } from 'react';
import { PaymentRecord } from '../../types';
import { useApp, formatINR } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  X,
  Building,
  CheckCircle2,
  AlertOctagon,
  FileText,
  Clock,
  ShieldCheck,
  CreditCard,
  Calendar,
  AlertTriangle,
  Download,
} from 'lucide-react';

interface PaymentDetailDrawerProps {
  payment: PaymentRecord | null;
  onClose: () => void;
  onVerified?: () => void;
}

export const PaymentDetailDrawer: React.FC<PaymentDetailDrawerProps> = ({
  payment,
  onClose,
  onVerified,
}) => {
  const { verifyPayment, rejectPayment, orders, showToast } = useApp();
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!payment) return null;

  const order = orders.find((o) => o.id === payment.orderId);

  const handleConfirmVerify = () => {
    setIsProcessing(true);
    setTimeout(() => {
      verifyPayment(payment.id);
      setIsProcessing(false);
      setShowVerifyConfirm(false);
      onVerified?.();
      onClose();
    }, 400);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      showToast('Please state a reason for rejecting the payment.', 'error');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      rejectPayment(payment.id, rejectReason);
      setIsProcessing(false);
      setShowRejectModal(false);
      onClose();
    }, 400);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col text-xs">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                  {payment.id}
                </span>
                <StatusBadge status={payment.status} />
              </div>
              <div className="text-[11px] text-slate-500">
                Payment Proof for Order <strong className="text-slate-800 dark:text-slate-200 font-mono">{payment.orderId}</strong>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Amount Banner */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Payment Submitted Amount
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatINR(payment.amount)}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Mode: <strong className="text-slate-800 dark:text-slate-200 uppercase">{payment.mode}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Bank Reference UTR
                </span>
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 inline-block mt-1 select-all">
                  {payment.utr}
                </span>
              </div>
            </div>

            {/* Dealership Details */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-500" />
                <span>Dealership &amp; Remitter Details</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 text-[10px] block">Dealership Agency:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{payment.dealerAgency}</span>
                  <div className="text-[11px] text-slate-500">Contact: {payment.dealerName}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Beneficiary Account:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">BFEL Operations Ltd</span>
                  <div className="text-[11px] font-mono text-slate-500">A/C: 4091002941098</div>
                  <div className="text-[10px] text-slate-400 font-mono">IFSC: SBIN0001398</div>
                </div>
              </div>
            </div>

            {/* Evidence Preview Slip */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Bank Advice Slip Evidence</span>
                </h3>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Digital Receipt Attached
                </span>
              </div>

              {/* Simulated Bank Receipt Slip */}
              <div className="p-4 rounded-lg bg-slate-950 text-white font-mono text-[11px] space-y-2 border border-slate-800 shadow-inner">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-400">STATE BANK OF INDIA</span>
                  <span className="text-slate-400">E-RECEIPT FOR RTGS/NEFT</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>UTR Number: <span className="text-white font-bold">{payment.utr}</span></div>
                  <div>Date: <span className="text-white">{payment.submittedAt}</span></div>
                  <div>Sender: <span className="text-white">{payment.dealerAgency}</span></div>
                  <div>Amount: <span className="text-emerald-400 font-bold">{formatINR(payment.amount)}</span></div>
                  <div>Beneficiary: <span className="text-white">BHARAT FEEDS &amp; EXTRACTIONS LTD</span></div>
                  <div>Credit A/C: <span className="text-white">...41098 (Manglia Plant)</span></div>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-500 text-center">
                  AUTHENTICATED INTERBANK CBS SETTLEMENT CONFIRMATION
                </div>
              </div>
            </div>

            {/* Verification Timeline */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Verification Timeline</span>
              </h3>
              <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                <div className="relative">
                  <div className="absolute -left-4 top-0.5 w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Payment Submitted</span>
                    <span className="text-slate-400 font-mono text-[10px] ml-2">{payment.submittedAt}</span>
                    <div className="text-[11px] text-slate-500">Dealer uploaded RTGS reference {payment.utr}</div>
                  </div>
                </div>

                <div className="relative">
                  <div className={`absolute -left-4 top-0.5 w-3 h-3 rounded-full border border-white dark:border-slate-900 ${
                    payment.status === 'verified'
                      ? 'bg-emerald-500'
                      : payment.status === 'rejected'
                      ? 'bg-rose-500'
                      : 'bg-amber-500 animate-pulse'
                  }`} />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {payment.status === 'verified'
                        ? `Payment Verified by ${payment.verifiedBy || 'Finance Desk'}`
                        : payment.status === 'rejected'
                        ? 'Payment Rejected by Finance Desk'
                        : 'Under Review at Accounts Desk'}
                    </span>
                    {payment.verifiedAt && (
                      <span className="text-slate-400 font-mono text-[10px] ml-2">{payment.verifiedAt}</span>
                    )}
                    <div className="text-[11px] text-slate-500">
                      {payment.status === 'verified'
                        ? 'Bank ledger entry matched. Order released for loading.'
                        : payment.status === 'rejected'
                        ? `Rejection reason: ${payment.rejectionReason || 'UTR unverified'}`
                        : 'Awaiting accountant UTR clearance'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          {payment.status === 'pending_verification' && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer transition-colors"
              >
                Reject Payment
              </button>

              <button
                type="button"
                onClick={() => setShowVerifyConfirm(true)}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Payment ({formatINR(payment.amount)})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Verification Confirmation Modal */}
      {showVerifyConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Verify Advance Payment?
              </h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to verify payment <strong>{payment.id}</strong> of{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">{formatINR(payment.amount)}</strong> for{' '}
              <strong>{payment.dealerAgency}</strong>?
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg space-y-1 text-[11px] text-slate-500">
              <div>✓ Order <strong className="text-slate-800 dark:text-slate-200">{payment.orderId}</strong> status updates to "Payment Verified"</div>
              <div>✓ Order immediately releases to Plant Loading Bay 3 queue</div>
              <div>✓ Financial audit event logged under current user session</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowVerifyConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmVerify}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-all flex items-center gap-1.5"
              >
                {isProcessing ? 'Verifying...' : '✓ Confirm & Clear Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Reject Payment Submission
              </h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300">
              Specify the operational reason why this UTR payment cannot be verified. This reason will be recorded in the audit trail.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. UTR not reflected in SBI account statement; amount mismatch against proforma."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition-all"
              >
                {isProcessing ? 'Rejecting...' : 'Reject Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
