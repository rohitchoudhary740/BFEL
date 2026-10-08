import React, { useState } from 'react';
import { useApp, formatINR } from '../../context/AppContext';
import { X, MapPin, Camera, Check, ShieldCheck, ArrowRight, Save, WifiOff } from 'lucide-react';

export const DealerVisitModal: React.FC = () => {
  const { currentUser, recordDealerVisit, closeModal, isOfflineMode, showToast } = useApp();

  const [agency, setAgency] = useState<string>('Patel Agro Agency');
  const [contact, setContact] = useState<string>('Ramesh Patel (+91 98260 41290)');
  const [currentStock, setCurrentStock] = useState<number>(64);
  const [outstanding, setOutstanding] = useState<number>(0);
  const [notes, setNotes] = useState<string>(
    'Conducted physical stock audit. Dudh Dhara 50kg moving rapidly with Dewas milk societies. Dealer requesting advance booking for 400 bags.'
  );
  const [gpsLocked, setGpsLocked] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    recordDealerVisit({
      agentId: currentUser.id,
      agentName: currentUser.name,
      dealerId: 'user-dealer-1',
      dealerAgency: agency,
      dealerContact: contact,
      location: 'Dewas Mandi Yard, MP',
      gpsStatus: isOfflineMode ? 'offline_cached' : 'verified',
      gpsCoordinates: '22.9676° N, 76.0534° E',
      visitTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      lastVisitDate: '2026-09-25',
      lastOrderDate: '2026-10-02',
      outstandingBalance: outstanding,
      currentStockBags: currentStock,
      notes,
      photos: [],
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
              Field Sales · Malwa Territory
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Record Dealer Check-In &amp; Audit
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
          {/* GPS Check-in Banner */}
          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="font-bold text-emerald-900 dark:text-emerald-200">
                  Geo-Fence GPS Verified
                </div>
                <div className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                  22.9676° N, 76.0534° E · Dewas Mandi Hub
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
              ACCURACY 4m
            </span>
          </div>

          {/* Offline Mode Banner if active */}
          {isOfflineMode && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Offline Field Mode:</strong> Action will be safely cached locally on your device and queued for background sync.
              </span>
            </div>
          )}

          {/* Dealership Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Dealership Name</label>
              <input
                type="text"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full px-2.5 py-1.5 font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Contact Person</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-2.5 py-1.5 font-medium rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Physical Stock Audit & Outstanding */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-slate-500 text-[11px] mb-1">
                Current Godown Stock (Bags)
              </label>
              <input
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[11px] mb-1">
                Outstanding Balance (₹)
              </label>
              <input
                type="number"
                value={outstanding}
                onChange={(e) => setOutstanding(parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Visit Notes */}
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Field Discussion &amp; Stock Demand Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          {/* Camera Proof */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Dealership Godown Banner Photo
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <Check className="w-3 h-3" /> Captured
            </span>
          </div>

          {/* Actions */}
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Record Visit &amp; Sync</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
