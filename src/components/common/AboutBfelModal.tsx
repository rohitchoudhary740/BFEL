import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShieldCheck,
  Scale,
  ClipboardCheck,
  Truck,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SpotlightCard } from '../../design-system/SpotlightCard';
import { TruckCapacityVisualizer } from '../../design-system/TruckCapacityVisualizer';
import { WeighbridgeCounter } from '../../design-system/WeighbridgeCounter';
import { IndustrialLoader } from '../../design-system/IndustrialLoader';
import { OperationalMap } from '../../design-system/OperationalMap';

export const AboutBfelModal: React.FC = () => {
  const { closeModal } = useApp();
  const [activeTab, setActiveTab] = useState<'platform' | 'design_system'>('platform');
  const [demoCapacity, setDemoCapacity] = useState<'20_MT' | '25_MT'>('20_MT');
  const [demoBags, setDemoBags] = useState<number>(400);

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
      <div className="w-full max-w-3xl bg-white dark:bg-[#0B1017] border border-slate-200 dark:border-[#1B2636] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#1B2636] flex items-start justify-between bg-slate-50/50 dark:bg-[#06080C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-500 font-extrabold flex items-center justify-center text-lg border border-amber-500/30 shadow-xs">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">
                  BFEL <span className="text-amber-600 dark:text-amber-500 font-bold">FLOW</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111823] text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-[#1B2636]">
                  v2.4 Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cattle Feed Distribution &amp; Operations Platform · Indore (M.P.)
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

        {/* Tab Switcher */}
        <div className="px-5 sm:px-6 pt-3 border-b border-slate-200 dark:border-[#1B2636] flex items-center gap-4 bg-slate-50/20 dark:bg-[#080C12]">
          <button
            type="button"
            onClick={() => setActiveTab('platform')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'platform'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Platform Operations &amp; Trust</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('design_system')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'design_system'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Design System &amp; Metrology Primitives</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300">
          {activeTab === 'platform' ? (
            <>
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
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#06080C] border border-slate-200 dark:border-[#1B2636] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                    Operational Lifecycle
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                    8 Reconciled Milestones
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {lifecycleSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white dark:bg-[#0B1017] border border-slate-200 dark:border-[#1B2636] space-y-0.5"
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
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1B2636] bg-white dark:bg-[#0B1017] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                    <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Role-Based Access</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Dedicated operational workspaces for Dealer, Distributor, Sales Agent, Accounts, Loading Operator, and Admin with enforced permissions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1B2636] bg-white dark:bg-[#0B1017] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                    <ClipboardCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Payment Traceability</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Strict 100% advance RTGS/NEFT bank matching and slip verification before truck loading orders are released.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1B2636] bg-white dark:bg-[#0B1017] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                    <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Weight-Controlled Dispatch</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Avery Weigh-Tronix digital scale indicator integration with calibrated tare, gross, and net weight tolerance enforcement (±100 kg).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1B2636] bg-white dark:bg-[#0B1017] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                    <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>Operational Audit Trail</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Every login, approval, bag adjustment, gate pass issuance, and credit note settlement is recorded in an immutable ledger.
                  </p>
                </div>
              </div>

              {/* Plant Metrology Specifications */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#06080C] border border-slate-200 dark:border-[#1B2636] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block font-sans text-[10px]">Plant Location</span>
                  <strong className="text-slate-900 dark:text-white">Manglia Industrial Area, Indore (M.P.)</strong>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400 block font-sans text-[10px]">Packing Standard</span>
                  <strong className="text-slate-900 dark:text-white">50 kg HDPE Bags · 20 MT (400) / 25 MT (500)</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Introduction to Design System Primitives */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  BFEL Enterprise Design System &amp; Signature Motion
                </h4>
                <p className="mt-1 leading-relaxed text-slate-500 dark:text-slate-400">
                  Precision, industrial, hardware-accelerated components reflecting heavy feed milling and digital logistics.
                  Built with zero-reflow CSS custom properties, full keyboard accessibility, and respect for prefers-reduced-motion.
                </p>
              </div>

              {/* Component 1: SpotlightCard Showcase */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
                  1. SpotlightCard (Cursor-Reactive Lighting · Zero Component Re-Renders)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <SpotlightCard variant="amber" interactive className="p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">Harvest Gold</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Brand signature accent. Move mouse over this card to observe pointer-following radial light and border glow.
                    </p>
                  </SpotlightCard>

                  <SpotlightCard variant="cyan" interactive className="p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-sky-400" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">Weighbridge Cyan</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Telemetry &amp; metrology indicator. Coordinates update CSS variables without triggering React state re-renders.
                    </p>
                  </SpotlightCard>

                  <SpotlightCard variant="lime" interactive className="p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-lime-400" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">Electric Lime</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Active navigation marker matching reference parity. Keyboard navigable via Tab and Enter keys.
                    </p>
                  </SpotlightCard>
                </div>
              </div>

              {/* Component 2: TruckCapacityVisualizer Showcase */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    2. TruckCapacityVisualizer (Rigid 50kg Bags · 20 MT / 25 MT Constraints)
                  </span>
                  {/* Interactive Controls to Test Both Capacities & Bags */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setDemoCapacity('20_MT');
                        setDemoBags(400);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer border ${
                        demoCapacity === '20_MT'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                          : 'bg-slate-100 dark:bg-[#111823] border-slate-200 dark:border-[#1B2636] text-slate-400'
                      }`}
                    >
                      20 MT (400 Bags)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoCapacity('25_MT');
                        setDemoBags(500);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer border ${
                        demoCapacity === '25_MT'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                          : 'bg-slate-100 dark:bg-[#111823] border-slate-200 dark:border-[#1B2636] text-slate-400'
                      }`}
                    >
                      25 MT (500 Bags)
                    </button>
                  </div>
                </div>

                <TruckCapacityVisualizer
                  capacityType={demoCapacity}
                  currentBags={demoBags}
                  label="Interactive Capacity Test Sandbox"
                />

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">Adjust Test Bags:</span>
                  <input
                    type="range"
                    min={0}
                    max={demoCapacity === '20_MT' ? 440 : 550}
                    step={10}
                    value={demoBags}
                    onChange={(e) => setDemoBags(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white shrink-0">
                    {demoBags} bags
                  </span>
                </div>
              </div>

              {/* Component 3: WeighbridgeCounter Showcase */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
                  3. WeighbridgeCounter (Avery Metrology Display · ±100kg Tolerance Guard)
                </span>

                <WeighbridgeCounter
                  tareWeightKg={9420}
                  grossWeightKg={29450}
                  expectedNetKg={20000}
                  sealNumber="SEAL-IND-8841"
                  status="valid"
                />
              </div>

              {/* Component 4: IndustrialLoader */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#06080C] border border-slate-200 dark:border-[#1B2636] flex items-center justify-around">
                <IndustrialLoader size="sm" variant="amber" label="Calibrating Scale" />
                <IndustrialLoader size="md" variant="cyan" label="Verifying UTR" />
                <IndustrialLoader size="sm" variant="lime" label="Dispatch Ready" />
              </div>

              {/* Component 5: OperationalMap */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
                  5. OperationalMap (Regional Logistics GIS Vector Map · Zero API Key)
                </span>
                <OperationalMap
                  role="admin"
                  title="Design System Demo Corridor Map"
                  subtitle="Vector GIS projection with interactive zoom, pan, and mandi yard inspectors."
                  height="340px"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#1B2636] bg-slate-50/50 dark:bg-[#06080C] flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
            Bharat Feeds &amp; Extractions Ltd · ISO 9001:2015 Certified Manufacturing
          </div>
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors ml-auto"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
