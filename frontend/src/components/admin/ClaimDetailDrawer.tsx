import React, { useState } from 'react';
import { Claim } from '../../types';
import { useApp, formatINR, bagsToMT } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { IssueCreditNoteModal } from './IssueCreditNoteModal';
import {
  X,
  Building,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Truck,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface ClaimDetailDrawerProps {
  claim: Claim | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const ClaimDetailDrawer: React.FC<ClaimDetailDrawerProps> = ({
  claim,
  onClose,
  onUpdated,
}) => {
  const { rejectClaim, orders, showToast } = useApp();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!claim) return null;

  const order = orders.find((o) => o.id === claim.orderId);
  const isPending = claim.status === 'under_review' || claim.status === 'submitted';

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      showToast('Please state a reason for rejecting the claim.', 'error');
      return;
    }
    rejectClaim(claim.id, rejectReason);
    setShowRejectModal(false);
    onUpdated?.();
    onClose();
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
                  {claim.id}
                </span>
                <StatusBadge status={claim.status} />
              </div>
              <div className="text-[11px] text-slate-500">
                Filed against Order <strong className="text-slate-800 dark:text-slate-200 font-mono">{claim.orderId}</strong> · {claim.submittedDate}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Discrepancy Highlight Card */}
            <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block tracking-wider">
                  Reported Discrepancy
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                  {claim.shortageQuantityBags} Bags Short
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Type: <strong className="text-slate-800 dark:text-slate-200 uppercase">{claim.claimType.replace('_', ' ')}</strong>
                </span>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="text-slate-500">Expected: <strong className="text-slate-800 dark:text-slate-200">{claim.expectedQuantityBags} bags</strong></div>
                <div className="text-slate-500">Received: <strong className="text-rose-600 dark:text-rose-400 font-bold">{claim.receivedQuantityBags} bags</strong></div>
                <div className="text-[10px] text-slate-400 mt-1">Shortage: {claim.shortageWeightKg || claim.shortageQuantityBags * 50} kg</div>
              </div>
            </div>

            {/* Consignee Details */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-500" />
                <span>Claimant Dealership &amp; Unloading Location</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 text-[10px] block">Dealership Agency:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{claim.dealerAgency}</span>
                  <div className="text-[11px] text-slate-500">{claim.dealerName}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Delivery Location:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{claim.location || 'Dewas Mandi Yard'}</span>
                  <div className="text-[11px] text-slate-500">Distributor: {claim.distributorName || 'Malwa Agri Feeds'}</div>
                </div>
              </div>
            </div>

            {/* Description & Narrative */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Consignee Shortage Statement</span>
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                "{claim.description || `Delivery tally confirmed only ${claim.receivedQuantityBags} bags unloaded at godown. Driver acknowledged shortage on physical LR copy with driver signature.`}"
              </p>
            </div>

            {/* Photographic Evidence */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-500" />
                  <span>Unloading Inspection Photographs</span>
                </h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Geo-tagged &amp; Timestamps Verified
                </span>
              </div>

              {/* Photo Evidence Tiles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                  <img
                    src="/bfel_claim_evidence_bags.png"
                    alt="Bags tally inspection photo"
                    className="w-full h-32 object-cover hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="p-2 text-[10px] text-slate-500 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                    <span>Pallet Tally Count</span>
                    <span className="font-mono">Dewas Yard</span>
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50 dark:bg-slate-950/60">
                  <FileText className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Driver Endorsement Slip</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Signed by Driver: Rakesh Yadav</span>
                </div>
              </div>
            </div>

            {/* Resolved Credit Note Banner if approved */}
            {claim.status === 'approved' && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Claim Resolved &amp; Credit Note Issued</span>
                  </span>
                  <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                    {claim.creditNoteId || 'CN-2026-0019'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  Credit adjustment amount of <strong>{formatINR(claim.creditNoteAmount || (claim.shortageQuantityBags * 1420))}</strong> added to distributor ledger.
                </div>
                {claim.adminRemarks && (
                  <div className="text-[10px] text-slate-500 italic mt-1">
                    Remarks: "{claim.adminRemarks}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Bar */}
          {isPending && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 text-xs font-semibold cursor-pointer transition-colors"
              >
                Reject Claim
              </button>

              <button
                type="button"
                onClick={() => setShowCreditModal(true)}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve &amp; Issue Credit Note</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Issue Credit Note Modal */}
      {showCreditModal && (
        <IssueCreditNoteModal
          claim={claim}
          onClose={() => setShowCreditModal(false)}
          onSuccess={() => {
            onUpdated?.();
            onClose();
          }}
        />
      )}

      {/* Reject Claim Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Reject Shortage Claim
              </h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300">
              State the operational reason for rejecting this shortage claim. This will be logged in the permanent audit trail.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Weighbridge exit net weight matched proforma bag tally; driver reported full count acknowledged."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition-all"
              >
                Reject Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
