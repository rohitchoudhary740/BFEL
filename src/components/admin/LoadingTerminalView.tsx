import React, { useState, useEffect } from 'react';
import { useApp, BAG_WEIGHT_KG, TRUCK_LIMITS, bagsToKg, bagsToMT } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import {
  Truck,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  RefreshCw,
  Lock,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

interface LoadingTerminalViewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
  orderId?: string;
}

export const LoadingTerminalView: React.FC<LoadingTerminalViewProps> = ({
  onNavigateToTab,
  orderId = 'BFEL-2026-8491',
}) => {
  const { orders, completeLoading, updateLoadingProgress, openModal, showToast } = useApp();

  // Find target order or fallback to first active loading order or default 8491
  const order =
    orders.find((o) => o.id === orderId) ||
    orders.find((o) => o.status === 'loading' || o.status === 'payment_verified') ||
    orders[0];

  const maxCapacityBags = order?.truckCapacity === '25_MT' ? 500 : 400;
  const targetOrderBags = order ? Math.min(order.totalBags, maxCapacityBags) : 400;

  // Local state for tablet terminal
  const [bagsLoaded, setBagsLoaded] = useState<number>(() => {
    if (order?.status === 'loading_completed' || order?.status === 'dispatched') {
      return targetOrderBags;
    }
    return order?.loadingProgressBags || 372;
  });

  const [tareWeight, setTareWeight] = useState<number>(order?.tareWeightKg || 12450);
  const [sealNumber, setSealNumber] = useState<string>(order?.sealNumber || 'SEAL-BFEL-8841');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order?.loadingProgressBags && order.status === 'loading') {
      setBagsLoaded(order.loadingProgressBags);
    }
  }, [order?.id, order?.loadingProgressBags, order?.status]);

  if (!order) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <p className="font-bold text-base text-slate-800 dark:text-slate-200">No Active Order Selected</p>
        <button
          onClick={() => onNavigateToTab?.('loading')}
          className="mt-3 px-4 py-2 bg-amber-500 font-bold rounded-lg cursor-pointer"
        >
          Return to Truck Planner
        </button>
      </div>
    );
  }

  // Weight calculations
  const netWeightKg = bagsLoaded * BAG_WEIGHT_KG;
  const grossWeightKg = tareWeight + netWeightKg;
  const remainingBags = Math.max(0, targetOrderBags - bagsLoaded);
  const isMaxCapacityReached = bagsLoaded >= maxCapacityBags;
  const isOrderFullyLoaded = bagsLoaded >= targetOrderBags;
  const isAlreadyCompleted = order.status === 'loading_completed' || order.status === 'dispatched';

  const handleAdjustBags = (delta: number) => {
    if (isAlreadyCompleted) {
      showToast('Order loading is already completed and sealed.', 'info');
      return;
    }

    const nextVal = bagsLoaded + delta;

    if (nextVal < 0) {
      setBagsLoaded(0);
      return;
    }

    if (nextVal > maxCapacityBags) {
      showToast(`Loading cannot exceed ${maxCapacityBags} bags for a ${order.truckCapacity.replace('_', ' ')} truck.`, 'error');
      setBagsLoaded(maxCapacityBags);
      return;
    }

    setBagsLoaded(nextVal);
    updateLoadingProgress(order.id, nextVal, tareWeight, tareWeight + (nextVal * BAG_WEIGHT_KG), sealNumber);
  };

  const handleCompleteLoading = () => {
    if (bagsLoaded < targetOrderBags) {
      showToast(`Order requires ${targetOrderBags} bags. Currently loaded: ${bagsLoaded} bags.`, 'error');
      return;
    }

    if (!sealNumber.trim()) {
      showToast('Please enter the security seal number before gate pass clearance.', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      completeLoading(order.id, tareWeight, grossWeightKg, sealNumber);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Plant Operations', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Truck Planner', onClick: () => onNavigateToTab?.('loading') },
          { label: `Loading Bay 3 — ${order.assignedVehicle || 'MP09AB1234'}` },
        ]}
        title={`Loading Terminal: Bay 3 (${order.assignedVehicle || 'MP09AB1234'})`}
        subtitle="Industrial Weighbridge & Bag Loading Interface · 50 kg Standard Cattle Feed Bag Control"
        badge={{ text: order.status.replace('_', ' '), variant: isAlreadyCompleted ? 'emerald' : 'amber' }}
        secondaryAction={{
          label: 'Back to Planner',
          onClick: () => onNavigateToTab?.('loading'),
        }}
      />

      {/* Industrial Tablet Main Container */}
      <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl p-4 sm:p-6 space-y-6">
        {/* Terminal Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-lg font-mono">
              B3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white font-mono">
                  {order.assignedVehicle || 'MP09AB1234'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold font-mono text-[10px] uppercase">
                  {order.truckCapacity.replace('_', ' ')} TRUCK
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Consignee: <strong className="text-slate-200">{order.dealerAgency}</strong> ({order.destination}) · Order <span className="font-mono text-amber-300">{order.id}</span>
              </p>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Weighbridge Scale</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center justify-end gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Calibrated: Manglia Bay 3
            </span>
          </div>
        </div>

        {/* Big Counter Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Loaded Bags */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Loaded Bags
            </span>
            <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
              {bagsLoaded}{' '}
              <span className="text-xl sm:text-2xl text-slate-500 font-semibold font-sans">
                / {targetOrderBags}
              </span>
            </div>
            <div className="text-xs font-semibold">
              {isMaxCapacityReached ? (
                <span className="text-amber-400 font-bold flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Maximum capacity reached ({maxCapacityBags} bags)
                </span>
              ) : remainingBags > 0 ? (
                <span className="text-slate-400">{remainingBags} bags remaining to complete load</span>
              ) : (
                <span className="text-emerald-400 font-bold">✓ Target Bag Count Loaded</span>
              )}
            </div>
          </div>

          {/* Box 2: Tonnage Metrics */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Current Weight (MT)
            </span>
            <div className="text-4xl sm:text-5xl font-black font-mono text-amber-400 tracking-tight">
              {bagsToMT(bagsLoaded).toFixed(1)}{' '}
              <span className="text-xl sm:text-2xl text-slate-500 font-semibold font-sans">
                / {bagsToMT(targetOrderBags).toFixed(1)} MT
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Net Weight: <strong className="text-slate-200">{netWeightKg.toLocaleString()} kg</strong>
            </div>
          </div>

          {/* Box 3: Weighbridge Readings */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between font-mono text-xs">
            <div className="space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Tare Weight (Empty):</span>
                <span className="font-bold text-slate-200">{tareWeight.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Net Weight (Feed):</span>
                <span className="font-bold text-amber-400">{netWeightKg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Scale Weight:</span>
                <span className="font-extrabold text-emerald-400">{grossWeightKg.toLocaleString()} kg</span>
              </div>
            </div>
            <div className="pt-2 text-[10px] text-slate-500 text-center">
              Tolerance: ±50 kg standard bag variance
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Loading Progress</span>
            <span className="font-bold text-white">
              {Math.min(100, Math.round((bagsLoaded / targetOrderBags) * 100))}%
            </span>
          </div>
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOrderFullyLoaded ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, (bagsLoaded / targetOrderBags) * 100)}%` }}
            />
          </div>
        </div>

        {/* Industrial Tablet Big Controls */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Terminal Conveyor Controls
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Strict capacity limits enforced (max {maxCapacityBags} bags)
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <button
              type="button"
              disabled={bagsLoaded <= 0 || isAlreadyCompleted}
              onClick={() => handleAdjustBags(-10)}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Minus className="w-4 h-4" />
              <span>-10 Bags</span>
            </button>

            <button
              type="button"
              disabled={isMaxCapacityReached || isAlreadyCompleted}
              onClick={() => handleAdjustBags(10)}
              className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+10 Bags</span>
            </button>

            <button
              type="button"
              disabled={isMaxCapacityReached || isAlreadyCompleted}
              onClick={() => handleAdjustBags(50)}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+50 Bags</span>
            </button>

            <button
              type="button"
              disabled={isAlreadyCompleted}
              onClick={() => {
                setBagsLoaded(targetOrderBags);
                updateLoadingProgress(order.id, targetOrderBags, tareWeight, tareWeight + (targetOrderBags * BAG_WEIGHT_KG), sealNumber);
                showToast(`Loaded full consignment: ${targetOrderBags} bags.`, 'success');
              }}
              className="col-span-3 sm:col-span-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Fill Target ({targetOrderBags})
            </button>
          </div>
        </div>

        {/* Security Seal & Complete Section */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Security Seal Number *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                disabled={isAlreadyCompleted}
                value={sealNumber}
                onChange={(e) => setSealNumber(e.target.value)}
                placeholder="e.g. SEAL-BFEL-8841"
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500 uppercase disabled:opacity-50"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Physical heavy-duty seal affixed to truck cargo door prior to factory gate clearance.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isAlreadyCompleted ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openModal('gate_pass', { orderId: order.id })}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4 text-amber-400" />
                  <span>View Gate Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('dispatch', { orderId: order.id })}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <span>Proceed to Dispatch →</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || bagsLoaded < targetOrderBags}
                onClick={handleCompleteLoading}
                className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isSubmitting ? 'Finalizing Weighbridge...' : 'Complete Loading & Gate Pass'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
