import React, { useState } from 'react';
import { Claim } from '../../types';
import { useApp, formatINR } from '../../context/AppContext';
import {
  FileText,
  X,
  ShieldCheck,
  CheckCircle2,
  Building,
  CreditCard,
  Sparkles,
} from 'lucide-react';

interface IssueCreditNoteModalProps {
  claim: Claim | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const IssueCreditNoteModal: React.FC<IssueCreditNoteModalProps> = ({
  claim,
  onClose,
  onSuccess,
}) => {
  const { approveClaim, currentUser, showToast } = useApp();
  const [remarks, setRemarks] = useState('Shortage verified against driver endorsed LR receipt tally. Approved for ledger adjustment.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!claim) return null;

  const creditAmount = claim.shortageQuantityBags * 1420;
  const simulatedCreditNoteId = `CN-2026-${Math.floor(100 + Math.random() * 899)}`;

  const handleIssue = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      approveClaim(claim.id, remarks);
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Issue Official Credit Note
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Official Document Preview Banner */}
          <div className="p-4 rounded-xl bg-slate-950 text-white font-mono border border-slate-800 space-y-2">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-amber-400">BHARAT FEEDS &amp; EXTRACTIONS LTD</span>
              <span className="text-slate-400">CREDIT NOTE PREVIEW</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Note ID: <strong className="text-emerald-400">{simulatedCreditNoteId}</strong></div>
              <div>Date: <strong>{new Date().toISOString().substring(0, 10)}</strong></div>
              <div>Consignee: <span className="text-slate-200">{claim.dealerAgency}</span></div>
              <div>Order Ref: <span className="text-slate-200">{claim.orderId}</span></div>
              <div>Claim Ref: <span className="text-slate-200">{claim.id}</span></div>
              <div>Discrepancy: <span className="text-rose-400 font-bold">{claim.shortageQuantityBags} bags shortage</span></div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Approved Credit Adjustment:</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">
                {formatINR(creditAmount)}
              </span>
            </div>
          </div>

          {/* Ledger Impact Explanation */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1 text-[11px] text-emerald-900 dark:text-emerald-200">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Financial Ledger Impact</span>
            </div>
            <div>• Claim status transitions from <strong className="uppercase">Under Review</strong> to <strong className="uppercase">Resolved</strong>.</div>
            <div>• <strong className="font-mono">{formatINR(creditAmount)}</strong> will be credited directly to the distributor &amp; dealer wallet ledger.</div>
            <div>• Permanent immutable audit event recorded under {currentUser.name}.</div>
          </div>

          {/* Remarks input */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Approval Remarks / Reason *
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleIssue}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Issuing Credit Note...' : `Issue Credit Note (${formatINR(creditAmount)})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
