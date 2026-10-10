import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../../design-system/motion';
import {
  FileText,
  CheckCircle2,
  Truck,
  Scale,
  ShieldCheck,
} from 'lucide-react';

interface StageItem {
  label: string;
  value: string;
}

interface StageData {
  id: string;
  stepShort: string;
  tabLabel: string;
  headline: string;
  subline: string;
  statusBadge: string;
  primaryValue: string;
  primaryLabel: string;
  items: StageItem[];
  progressLabel: string;
  progressPercent: number;
  progressDetail: string;
  icon: React.ElementType;
}

const STAGES: StageData[] = [
  {
    id: 'order',
    stepShort: '01',
    tabLabel: 'Order',
    headline: 'Consignment Booking',
    subline: 'Patel Agro Center · Dewas Mandi',
    statusBadge: 'ORDER CONFIRMED',
    primaryValue: '₹7,88,000',
    primaryLabel: 'Net Consignment Value',
    items: [
      { label: 'Consignment Order', value: 'ORD-IND-2026-8841' },
      { label: 'Bag Quantity', value: '400 Bags (20.0 MT)' },
      { label: 'Order Value', value: '₹7,88,000 net' },
      { label: 'Current Status', value: 'Confirmed · Ready for RTGS' },
    ],
    progressLabel: 'FTL Capacity Allocation',
    progressPercent: 100,
    progressDetail: '400 / 400 Bags (Dudh Dhara 50kg)',
    icon: FileText,
  },
  {
    id: 'payment',
    stepShort: '02',
    tabLabel: 'Payment',
    headline: 'Advance Payment Audit',
    subline: 'Central Accounts Desk · Sunita Jain',
    statusBadge: 'UTR CLEARED',
    primaryValue: '₹7,88,000',
    primaryLabel: '100% Advance Reconciled',
    items: [
      { label: 'Bank UTR Ref', value: 'UTR-HDFC-99420148' },
      { label: 'Reconciled Amount', value: '₹7,88,000 (100%)' },
      { label: 'Credit Exposure', value: '₹0 (Zero Risk Policy)' },
      { label: 'Current Status', value: 'Cleared · Loading Unlocked' },
    ],
    progressLabel: 'Ledger Reconciliation',
    progressPercent: 100,
    progressDetail: 'HDFC Corporate Statement Matched',
    icon: CheckCircle2,
  },
  {
    id: 'loading',
    stepShort: '03',
    tabLabel: 'Loading',
    headline: 'Bay Loading & Stowage',
    subline: 'Bay 01 Terminal · Balram Yadav',
    statusBadge: 'STOWAGE COMPLETE',
    primaryValue: '400 / 400 Bags',
    primaryLabel: 'Full Truckload Stowage',
    items: [
      { label: 'Assigned Vehicle', value: 'MP-09-GH-8821 (Tata Signa)' },
      { label: 'Bag Quantity', value: '400 Bags (20,000 kg)' },
      { label: 'Bay Allocation', value: 'Bay 01 · 10 Pallet Rows' },
      { label: 'Current Status', value: 'Stowed · Ready for Scale' },
    ],
    progressLabel: 'Vehicle Stowage Progress',
    progressPercent: 100,
    progressDetail: '10 of 10 Pallet Bays Stowed',
    icon: Truck,
  },
  {
    id: 'weighbridge',
    stepShort: '04',
    tabLabel: 'Weighbridge',
    headline: 'Avery Metrology Deck',
    subline: 'Deck 01 · Calibrated Dual-Platform',
    statusBadge: 'LEGAL FOR TRADE',
    primaryValue: '20,030 kg',
    primaryLabel: 'Certified Net Cargo Mass',
    items: [
      { label: 'Gross / Tare Mass', value: '29,450 kg / 9,420 kg' },
      { label: 'Net Cargo Mass', value: '20,030 kg (+30 kg)' },
      { label: 'Tolerance Bound', value: '±100 kg Legal Limit' },
      { label: 'Current Status', value: 'Metrology Certified' },
    ],
    progressLabel: 'Tolerance Metrology Guard',
    progressPercent: 30,
    progressDetail: '+30 kg Variance within ±100 kg Bound',
    icon: Scale,
  },
  {
    id: 'dispatch',
    stepShort: '05',
    tabLabel: 'Dispatch',
    headline: 'Gate Pass & Transit',
    subline: 'Plant Out-Gate 02 · Manglia Facility',
    statusBadge: 'GATE PASS RELEASED',
    primaryValue: 'GP-MGL-2026-0891',
    primaryLabel: 'Lorry Receipt LR-IND-2026-4412',
    items: [
      { label: 'Consignment Order', value: 'ORD-IND-2026-8841' },
      { label: 'Transit Corridor', value: 'NH-52 Dewas Road (42 km)' },
      { label: 'Dealer Notice', value: 'WhatsApp Manifest Sent' },
      { label: 'Current Status', value: 'Released · En Route' },
    ],
    progressLabel: 'Security Transit Verification',
    progressPercent: 100,
    progressDetail: 'Cryptographic QR Latch Passed',
    icon: ShieldCheck,
  },
];

export const InteractiveWorkflowPreview: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Subtle auto-progression every 8 seconds unless paused by user interaction
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const currentStage = STAGES[activeStageIndex];
  const Icon = currentStage.icon;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[520px] select-none"
    >
      {/* Subtle ambient warm backlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 rounded-2xl bg-gradient-to-tr from-orange-500/10 via-amber-500/5 to-transparent blur-xl opacity-60"
      />

      {/* =========================================================================
          PREMIUM OPERATIONAL PRODUCT PREVIEW VESSEL
          Compact, balanced horizontal layout (~480-520px wide, ~400-440px tall)
          ========================================================================= */}
      <div className="relative z-10 rounded-2xl bg-[#0C0F17] text-white border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* TOP: Simple header containing "BFEL FLOW" and "ILLUSTRATIVE DEMO" */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#090C13]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#F58220]" />
            <span className="text-xs font-bold tracking-wider uppercase text-zinc-200">
              BFEL FLOW
            </span>
          </div>

          <span className="text-[10px] font-mono font-medium tracking-wide text-zinc-400 bg-white/[0.04] px-2.5 py-0.5 rounded border border-white/[0.06] uppercase">
            ILLUSTRATIVE DEMO
          </span>
        </div>

        {/* WORKFLOW: Five compact stages: Order -> Payment -> Loading -> Weighbridge -> Dispatch */}
        <div className="px-4 py-2.5 bg-[#080B10] border-b border-white/[0.06]">
          <div
            role="tablist"
            aria-label="Workflow Stages"
            className="grid grid-cols-5 gap-1.5 p-1 bg-white/[0.02] rounded-xl border border-white/[0.04]"
          >
            {STAGES.map((stage, idx) => {
              const isActive = idx === activeStageIndex;

              return (
                <button
                  key={stage.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`stage-panel-${stage.id}`}
                  id={`stage-tab-${stage.id}`}
                  type="button"
                  onClick={() => {
                    setActiveStageIndex(idx);
                    setAutoPlay(false);
                  }}
                  className={`
                    py-1.5 px-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer text-center truncate
                    ${
                      isActive
                        ? 'bg-[#F58220] text-slate-950 font-bold shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }
                  `}
                >
                  {stage.tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT: Selected stage prominently with one clear visual and relevant info */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Stage Identification Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F58220] shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight truncate">
                  {currentStage.headline}
                </h3>
                <p className="text-[11px] text-zinc-400 truncate">
                  {currentStage.subline}
                </p>
              </div>
            </div>

            <div className="px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] font-mono font-semibold tracking-wide uppercase shrink-0 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentStage.statusBadge}</span>
            </div>
          </div>

          {/* Prominent Primary Metric Banner (Horizontal composition) */}
          <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] text-zinc-400 uppercase font-medium tracking-wide block truncate">
                {currentStage.primaryLabel}
              </span>
              <span className="text-2xl sm:text-[1.65rem] font-extrabold tracking-tight text-white block">
                {currentStage.primaryValue}
              </span>
            </div>
          </div>

          {/* Clean 4-Item Horizontal Grid (Only most relevant operational data) */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-0.5">
            {currentStage.items.map((item, idx) => (
              <div key={idx} className="min-w-0">
                <span className="text-[11px] text-zinc-400 uppercase font-medium tracking-wider block">
                  {item.label}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-200 block truncate">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Clear Horizontal Visual Progress / Verification Bar */}
          <div className="pt-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1.5 font-medium">
              <span className="truncate">{currentStage.progressLabel}</span>
              <span className="text-zinc-300 font-mono shrink-0 ml-2">{currentStage.progressDetail}</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${currentStage.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM: Subtle progress indicator and current stage */}
        <div className="px-5 py-2.5 border-t border-white/[0.06] bg-[#090C13] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400">Stage {currentStage.stepShort} of 05</span>
            <span className="text-zinc-600">·</span>
            <span className="font-semibold text-zinc-200">{currentStage.tabLabel}</span>
          </div>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {STAGES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeStageIndex
                    ? 'w-5 bg-[#F58220]'
                    : i < activeStageIndex
                    ? 'w-1.5 bg-emerald-500/70'
                    : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
