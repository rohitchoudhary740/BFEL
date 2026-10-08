import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Scale,
  ClipboardCheck,
  Truck,
  ArrowRight,
  FileText,
  Building,
  Lock,
} from 'lucide-react';

export const AboutBfelModal: React.FC = () => {
  const { closeModal } = useApp();

  const lifecycleSteps = [
    { title: 'Order', desc: '50 kg bags (20/25 MT)' },
    { title: 'Payment', desc: '100% advance RTGS' },
    { title: 'Verification', desc: 'Accounts UTR match' },
    { title: 'Loading', desc: 'Plant bay queue' },
    { title: 'Weighbridge', desc: 'Tare & gross ±100 kg' },
    { title: 'Gate Pass', desc: 'Tamper seal check' },
    { title: 'Dispatch', desc: 'LR & WhatsApp alert' },
    { title: 'Delivery', desc: 'Pod & claim audit' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-500 font-extrabold flex items-center justify-center text-lg border border-amber-500/30 shadow-xs">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">
                  BFEL <span className="text-amber-600 dark:text-amber-500 font-bold">FLOW</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  v2.4 Production
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cattle Feed Distribution &amp; Operations Platform
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close about modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs text-slate-600 dark:text-slate-300">
          {/* Mission statement */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Connected operations from order to dispatch.
            </h4>
            <p className="mt-1 leading-relaxed text-slate-500 dark:text-slate-400">
              BFEL Flow connects cattle-feed manufacturing and rural distribution across Madhya Pradesh.
              From dealer order booking to payment verification, truck loading, weighbridge validation,
              gate clearance, dispatch and claims — every operational step stays connected and traceable.
            </p>
          </div>

          {/* Visual Lifecycle Stepper */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Operational Lifecycle
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">8 Reconciled Milestones</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {lifecycleSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5"
                >
                  <div className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    0{idx + 1}. {step.title}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Core Trust Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Role-Based Access</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Dedicated operational workspaces for Dealer, Distributor, Sales Agent, Accounts, Loading Operator, and Admin with enforced permissions.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                <ClipboardCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Payment Traceability</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Strict 100% advance RTGS/NEFT bank matching and slip verification before truck loading orders are released.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                <Scale className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Weight-Controlled Dispatch</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Avery Weigh-Tronix digital scale indicator integration with calibrated tare, gross, and net weight tolerance enforcement (±100 kg).
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Operational Audit Trail</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Every login, approval, bag adjustment, gate pass issuance, and credit note settlement is recorded in an immutable ledger.
              </p>
            </div>
          </div>

          {/* Plant Metrology Specifications */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block font-sans text-[10px]">Plant Location</span>
              <strong className="text-slate-900 dark:text-white">Manglia Industrial Area, Indore (M.P.)</strong>
            </div>
            <div className="sm:text-right">
              <span className="text-slate-400 block font-sans text-[10px]">Packing Standard</span>
              <strong className="text-slate-900 dark:text-white">50 kg HDPE Bags · 20 MT (400) / 25 MT (500)</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
