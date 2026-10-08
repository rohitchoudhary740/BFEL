import React, { useState } from 'react';
import { useApp, BAG_WEIGHT_KG, bagsToKg, formatINR } from '../../context/AppContext';
import { ClaimType } from '../../types';
import { X, Upload, AlertCircle, Camera, Check, ArrowRight } from 'lucide-react';

export const DealerClaimsModal: React.FC = () => {
  const { activeModalData, orders, currentUser, createClaim, closeModal, showToast } = useApp();

  const orderId = activeModalData?.orderId || orders[0]?.id || 'BFEL-2026-8485';
  const targetOrder = orders.find((o) => o.id === orderId);

  const [claimType, setClaimType] = useState<ClaimType>('shortage');
  const [expectedBags, setExpectedBags] = useState<number>(activeModalData?.expectedBags || targetOrder?.totalBags || 400);
  const [receivedBags, setReceivedBags] = useState<number>(392); // 8 bags short demo
  const [description, setDescription] = useState<string>(
    'During unloading at Dewas Mandi warehouse, 8 bags were short from rear cargo stack. LR endorsed and countersigned by driver.'
  );
  const [location, setLocation] = useState<string>('Dewas Mandi Yard, MP');

  // Auto-calculated shortage values (Rule: user cannot manually manipulate contradictory shortage)
  const shortageBags = Math.max(0, expectedBags - receivedBags);
  const expectedKg = bagsToKg(expectedBags);
  const receivedKg = bagsToKg(receivedBags);
  const shortageKg = bagsToKg(shortageBags);

  // 3 sample photos
  const photos = [
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><text x="200" y="140" fill="%2394a3b8" font-size="16" text-anchor="middle" font-family="sans-serif">Photo 1: Unloading Bay Stack Count</text><text x="200" y="170" fill="%2338bdf8" font-size="14" text-anchor="middle" font-family="sans-serif">392 bags tallied on physical tally sheet</text></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><text x="200" y="140" fill="%2394a3b8" font-size="16" text-anchor="middle" font-family="sans-serif">Photo 2: Stamped LR Shortage Endorsement</text><text x="200" y="170" fill="%2338bdf8" font-size="14" text-anchor="middle" font-family="sans-serif">Driver counter-signed 8 bags short</text></svg>',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><text x="200" y="140" fill="%2394a3b8" font-size="16" text-anchor="middle" font-family="sans-serif">Photo 3: Truck Cargo Bed Clearance</text><text x="200" y="170" fill="%2338bdf8" font-size="14" text-anchor="middle" font-family="sans-serif">Empty flatbed inspection</text></svg>',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shortageBags <= 0 && claimType === 'shortage') {
      showToast('Received bags must be less than expected to claim shortage', 'error');
      return;
    }

    createClaim({
      orderId,
      dealerName: currentUser.name,
      dealerAgency: currentUser.entityName,
      claimType,
      expectedBags,
      receivedBags,
      description,
      photos,
      location,
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Field Claims Desk
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              File Unloading Claim for {orderId}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Claim Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Claim Nature
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'shortage', label: 'Shortage' },
                { type: 'damaged_bags', label: 'Damaged Bags' },
                { type: 'quality_issue', label: 'Quality Issue' },
                { type: 'wrong_product', label: 'Wrong Product' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setClaimType(type as ClaimType)}
                  className={`py-2 px-1 text-center font-bold text-xs rounded-lg border transition-all cursor-pointer ${
                    claimType === type
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Strict Shortage Calculation Panel */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Automatic Shortage Computation
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Expected Bag Count</label>
                <input
                  type="number"
                  value={expectedBags}
                  onChange={(e) => setExpectedBags(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Received Bag Count</label>
                <input
                  type="number"
                  value={receivedBags}
                  onChange={(e) => setReceivedBags(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Calculated Results Table */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Net Weight:</span>
                <span className="font-mono font-semibold">{expectedKg.toLocaleString()} kg ({(expectedKg / 1000).toFixed(1)} MT)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Physical Received Weight:</span>
                <span className="font-mono font-semibold">{receivedKg.toLocaleString()} kg ({(receivedKg / 1000).toFixed(1)} MT)</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold">
                <span>Calculated Shortage:</span>
                <span className="font-mono">
                  {shortageBags} Bags ({shortageKg.toLocaleString()} kg / {(shortageKg / 1000).toFixed(2)} MT)
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Inspection Description &amp; Unloading Notes
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          {/* Photo Evidence Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Photo Evidence Attached (3 Files)
              </label>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> GPS &amp; Timestamp tagged
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((src, i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 relative bg-slate-900 group"
                >
                  <img src={src} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-medium">
                    Photo {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={closeModal}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md cursor-pointer transition-all"
            >
              <span>Submit Shortage Claim</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
