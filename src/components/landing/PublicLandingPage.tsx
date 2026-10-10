import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LandingNavBar } from './LandingNavBar';
import { InteractiveWorkflowPreview } from './InteractiveWorkflowPreview';
import { TruckCapacityVisualizer } from '../../design-system/TruckCapacityVisualizer';
import { WeighbridgeCounter } from '../../design-system/WeighbridgeCounter';
import {
  Shield,
  Truck,
  Scale,
  CheckCircle2,
  Lock,
  ArrowRight,
  FileText,
  AlertCircle,
  Package,
  Building,
  KeyRound,
  Users,
  Check,
  Activity,
  TrendingUp,
  Navigation,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { UserRole } from '../../types';

export const PublicLandingPage: React.FC = () => {
  const { navigateTo, loginWithCredentials, usersList } = useAuth();

  // Interactive Truck Capacity Sandbox State
  const [demoCapacity, setDemoCapacity] = useState<'20_MT' | '25_MT'>('20_MT');
  const [demoBags, setDemoBags] = useState<number>(400);

  // Evaluation Launchpad Authentication State (For safe client evaluation & test compatibility)
  const [evalIdentifier, setEvalIdentifier] = useState('ramesh.patel@patelagro.in');
  const [evalPassword, setEvalPassword] = useState('Password123');
  const [evalError, setEvalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick evaluation role autofill
  const handleRoleFill = (role: UserRole) => {
    setEvalError(null);
    const targetUser = usersList.find((u) => u.role === role && u.status === 'active');
    if (targetUser) {
      setEvalIdentifier(targetUser.email || targetUser.phone);
      setEvalPassword('Password123');
    }
  };

  const handleEvaluationLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvalError(null);
    setIsSubmitting(true);
    try {
      const result = await loginWithCredentials(evalIdentifier, evalPassword);
      if (!result.success) {
        setEvalError(result.error || 'Authentication error.');
      }
    } catch (err: any) {
      setEvalError(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFDFE] dark:bg-[#07090E] text-slate-900 dark:text-slate-100 font-sans selection:bg-amber-500 selection:text-white transition-colors">
      {/* 1. Header Navigation Bar (Floating Pill) */}
      <LandingNavBar />

      <main>
        {/* =========================================================================
            SECTION A — HERO: PRODUCT-LED INDUSTRIAL RESTRAINT
            Slice-inspired composition: editorial typography, generous whitespace,
            and one large, sophisticated operational product visualization.
            ========================================================================= */}
        <section id="hero" className="scroll-mt-24 sm:scroll-mt-28 relative pt-8 sm:pt-12 lg:pt-14 pb-12 sm:pb-14 lg:pb-16 overflow-hidden border-b border-slate-200/80 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-8">
              {/* Left Column: Headline, Supporting Copy, Primary Actions (~48% width) */}
              <div className="w-full lg:w-[48%] space-y-6 sm:space-y-7">
                {/* Overline Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#F58220] animate-pulse" />
                  <span>MANGLIA PLANT, INDORE · AVERY METROLOGY</span>
                </div>

                {/* Primary Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                  Every Feed Order. <br />
                  <span className="text-[#F58220]">One Connected Flow.</span>
                </h1>

                {/* Supporting Text */}
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed font-normal">
                  Connect dealer orders, payment verification, truck loading, weighbridge validation and dispatch in one operational platform.
                </p>

                {/* Primary & Secondary Actions (Clean Pill Design) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <a
                    href="#capacity"
                    className="py-3 px-6 sm:px-7 bg-[#F58220] hover:bg-orange-500 text-slate-950 font-bold rounded-full text-sm cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Explore Platform</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => navigateTo('/login')}
                    className="py-3 px-6 sm:px-7 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold rounded-full text-sm cursor-pointer shadow-xs transition-all text-center"
                  >
                    Sign In
                  </button>
                </div>

                {/* 3 Authoritative Operational Anchors */}
                <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-5 border-t border-slate-200/80 dark:border-white/10 text-xs">
                  <div>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white block text-base sm:text-lg">50 kg</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">HDPE Bag Standard</span>
                  </div>
                  <div>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white block text-base sm:text-lg">20 / 25 MT</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Rigid Axle Bounds</span>
                  </div>
                  <div>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white block text-base sm:text-lg">±100 kg</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Weighbridge Guard</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Balanced, Compact Operational Product Preview (~52% width) */}
              <div className="w-full lg:w-[52%] flex justify-center lg:justify-end">
                <InteractiveWorkflowPreview />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            OPERATIONAL CONSTANTS TICKER
            ========================================================================= */}
        <section className="bg-slate-50/70 dark:bg-[#0B0F17] border-b border-slate-200/80 dark:border-white/10 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 flex items-center gap-3.5 shadow-xs">
                <Package className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <strong className="text-slate-900 dark:text-white block">50 kg HDPE Bags</strong>
                  <span className="text-[11px] text-slate-500">Universal Catalog Unit</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 flex items-center gap-3.5 shadow-xs">
                <Truck className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <strong className="text-slate-900 dark:text-white block">20 MT &amp; 25 MT Limits</strong>
                  <span className="text-[11px] text-slate-500">Rigid Legal Axle Bounds</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 flex items-center gap-3.5 shadow-xs">
                <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <strong className="text-slate-900 dark:text-white block">100% Advance RTGS</strong>
                  <span className="text-[11px] text-slate-500">Zero Credit Dispatches</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 flex items-center gap-3.5 shadow-xs">
                <Scale className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <strong className="text-slate-900 dark:text-white block">±100 kg Dual Scale</strong>
                  <span className="text-[11px] text-slate-500">Avery Weigh-Tronix Guard</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION B — OPERATIONAL CAPACITY: LARGE TRUCK VISUALIZATION
            Centered focal stage with generous whitespace and interactive control.
            ========================================================================= */}
        <section id="capacity" className="scroll-mt-24 sm:scroll-mt-28 py-20 sm:py-28 lg:py-32 border-b border-slate-200/80 dark:border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {/* Editorial Section Header */}
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-mono font-bold tracking-widest text-amber-600 dark:text-amber-500 uppercase block">
                RIGID FLEET CAPACITY ENGINE
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Engineered for Legal Axle Constraints.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Finished feeds are shipped strictly in 50 kg HDPE bags on verified 20 MT (400 bags) or 25 MT (500 bags) transport chassis. Test the capacity engine below to observe how overload prevention works in real time.
              </p>
            </div>

            {/* Interactive Sandbox Container */}
            <div className="space-y-6">
              {/* Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Chassis Config:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoCapacity('20_MT');
                      setDemoBags(400);
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-mono font-bold cursor-pointer transition-all ${
                      demoCapacity === '20_MT'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    20 MT Standard (400 Bags)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoCapacity('25_MT');
                      setDemoBags(500);
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-mono font-bold cursor-pointer transition-all ${
                      demoCapacity === '25_MT'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    25 MT Heavy (500 Bags)
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400 text-[11px] hidden sm:inline">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setDemoBags(0)}
                    className="px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-amber-500 text-[11px] cursor-pointer"
                  >
                    0 Bags (Empty)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoBags(demoCapacity === '20_MT' ? 200 : 250)}
                    className="px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-amber-500 text-[11px] cursor-pointer"
                  >
                    50% Load
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoBags(demoCapacity === '20_MT' ? 400 : 500)}
                    className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] cursor-pointer"
                  >
                    100% Full Load
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoBags(demoCapacity === '20_MT' ? 420 : 520)}
                    className="px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold text-[11px] cursor-pointer"
                  >
                    Test Overload Alert
                  </button>
                </div>
              </div>

              {/* Authoritative Truck Capacity Visualizer */}
              <TruckCapacityVisualizer
                capacityType={demoCapacity}
                currentBags={demoBags}
                label="Simulated Consignment Loading Bay"
                showAxleLayout={true}
              />

              {/* Slider Adjustment Control */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center gap-4">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                  Slide Illustrative Bag Count:
                </span>
                <input
                  type="range"
                  min={0}
                  max={demoCapacity === '20_MT' ? 460 : 560}
                  step={5}
                  value={demoBags}
                  onChange={(e) => setDemoBags(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                  aria-label="Adjust bag count for capacity test"
                />
                <div className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white shrink-0 bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-full border border-slate-200 dark:border-white/10">
                  {demoBags} bags ({(demoBags * 50).toLocaleString()} kg)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION C — CONNECTED OPERATIONAL WORKFLOW
            8 reconciled operational milestones told with Slice-style narrative poise.
            ========================================================================= */}
        <section id="workflow" className="scroll-mt-24 sm:scroll-mt-28 py-20 sm:py-28 lg:py-32 bg-slate-50/70 dark:bg-[#0B0F17] border-b border-slate-200/80 dark:border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-mono font-bold tracking-widest text-amber-600 dark:text-amber-500 uppercase block">
                END-TO-END INDUSTRIAL DISCIPLINE
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                The 8 Reconciled Milestones.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                From order booking to delivery and photographic shortage claims, every operational milestone is recorded in an authoritative ledger.
              </p>
            </div>

            {/* 8-Stage Storytelling Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-amber-500/50 transition-colors shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-amber-500 font-extrabold">01</span>
                  <FileText className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Order Placement</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Mobile order entry enforcing 50kg bag increments and 20T/25T FTL limits with automated slab discounts.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-sky-500/50 transition-colors shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-sky-400 font-extrabold">02</span>
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Advance Verification</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  100% advance RTGS/NEFT bank statement matching by central Accounts Desk before factory release.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-amber-500/50 transition-colors shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-amber-500 font-extrabold">03</span>
                  <Truck className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Truck Assignment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Dedicated fleet vehicle and driver pairing slotted into Bay 01 or Bay 02 loading queues.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-amber-500/50 transition-colors shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-amber-500 font-extrabold">04</span>
                  <Package className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Loading &amp; Bag Count</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Real-time increment logging across 10 pallet rows verifying exact bag count against planned order.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-sky-500/50 transition-colors shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-sky-400 font-extrabold">05</span>
                  <Scale className="w-4 h-4 text-sky-400" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Weighbridge Validation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Dual-scale Avery indicator computes Tare and Gross with strict ±100 kg tolerance certification.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-emerald-500/50 transition-colors shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400 font-extrabold">06</span>
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Seal &amp; Gate Pass</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Numbered security seal recorded and encrypted QR gate pass generated for security checkpoint release.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-amber-500/50 transition-colors shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-amber-500 font-extrabold">07</span>
                  <Activity className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Road Dispatch</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Lorry Receipt (LR) issued and automated WhatsApp template alert dispatched to the receiving dealer.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-sky-500/50 transition-colors shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-sky-400 font-extrabold">08</span>
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Claims &amp; Credit Note</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Photographic evidence review for transit shortage with instant ledger reimbursement into credit wallet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION D — REGIONAL LOGISTICS NETWORK: HIGHWAY CORRIDORS
            Geographically grounded transit routes with clear illustrative labels.
            ========================================================================= */}
        <section id="distribution" className="scroll-mt-24 sm:scroll-mt-28 py-20 sm:py-28 lg:py-32 border-b border-slate-200/80 dark:border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-mono font-bold tracking-widest text-amber-600 dark:text-amber-500 uppercase block">
                REGIONAL LOGISTICS NETWORK
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Malwa–Nimar Consignment Corridors.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Direct heavy-freight dispatches from Manglia Industrial Area (Indore) across verified national and state highway corridors to rural mandi yards.
              </p>
            </div>

            {/* Distribution Corridor Console */}
            <div className="rounded-3xl bg-slate-50/80 dark:bg-[#0A0D15] border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-7 lg:p-8 space-y-6 shadow-2xl">
              {/* Geographic Corridor Schematic */}
              <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/80 dark:border-white/[0.06] text-xs font-mono text-slate-500">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    <Navigation className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Central Dispatch Hub: Manglia Plant, Indore (22.81° N, 75.92° E)</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-medium">
                    Illustrative Regional Route Network · MP Highway Corridors
                  </div>
                </div>

                <div className="py-4 sm:py-6">
                  <svg viewBox="0 0 800 360" className="w-full h-auto select-none" preserveAspectRatio="xMidYMid meet">
                    {/* Background regional reference grid lines */}
                    <line x1="40" y1="70" x2="760" y2="70" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-white/[0.03]" />
                    <line x1="40" y1="165" x2="760" y2="165" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-white/[0.03]" />
                    <line x1="40" y1="260" x2="760" y2="260" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-white/[0.03]" />

                    {/* Highway Corridor Connecting Routes */}
                    {/* Route 1: NH-52 to Dewas Mandi (North-East, 42 km) */}
                    <path
                      d="M 390 165 C 480 150, 560 115, 640 85"
                      fill="none"
                      stroke="#F58220"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Route 2: SH-27 to Ujjain Grain Mandi (North, 56 km) */}
                    <path
                      d="M 390 165 C 375 115, 345 80, 320 55"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Route 3: NH-347BG to Sanwer Mandi (North-West, 32 km) */}
                    <path
                      d="M 390 165 C 300 155, 230 130, 160 105"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Route 4: SH-1 to Khargone Hub (South, 140 km) */}
                    <path
                      d="M 390 165 C 430 215, 475 250, 510 275"
                      fill="none"
                      stroke="#A855F7"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Central Production & Dispatch Hub: Manglia Plant */}
                    <g transform="translate(390, 165)">
                      <circle cx="0" cy="0" r="30" className="fill-orange-500/10 stroke-orange-500/30" strokeWidth="1" />
                      <circle cx="0" cy="0" r="18" className="fill-[#F58220]" />
                      <circle cx="0" cy="0" r="7" className="fill-slate-950" />
                      <text x="0" y="-36" textAnchor="middle" className="text-[12px] font-mono font-black fill-slate-900 dark:fill-white">
                        MANGLIA CENTRAL PLANT
                      </text>
                      <text x="0" y="-22" textAnchor="middle" className="text-[9px] font-mono fill-orange-500 font-bold">
                        Dual Weighbridge Facility (Indore)
                      </text>
                    </g>

                    {/* Node 1: Dewas Mandi (NH-52) */}
                    <g transform="translate(640, 85)">
                      <circle cx="0" cy="0" r="12" className="fill-orange-500/20 stroke-orange-500" strokeWidth="2" />
                      <circle cx="0" cy="0" r="5" className="fill-orange-500" />
                      <rect x="-38" y="-32" width="76" height="15" rx="3" className="fill-slate-900 dark:fill-black stroke-slate-700" strokeWidth="0.8" />
                      <text x="0" y="-21" textAnchor="middle" className="text-[8.5px] font-mono font-bold fill-orange-400">
                        NH-52 (42 km)
                      </text>
                      <text x="0" y="24" textAnchor="middle" className="text-[11px] font-mono font-bold fill-slate-900 dark:fill-white">
                        DEWAS MANDI
                      </text>
                      <text x="0" y="38" textAnchor="middle" className="text-[9px] font-mono fill-slate-500 dark:text-zinc-400">
                        ~50 min transit
                      </text>
                    </g>

                    {/* Node 2: Ujjain Hub (SH-27) */}
                    <g transform="translate(320, 55)">
                      <circle cx="0" cy="0" r="12" className="fill-sky-500/20 stroke-sky-400" strokeWidth="2" />
                      <circle cx="0" cy="0" r="5" className="fill-sky-400" />
                      <rect x="-38" y="-32" width="76" height="15" rx="3" className="fill-slate-900 dark:fill-black stroke-slate-700" strokeWidth="0.8" />
                      <text x="0" y="-21" textAnchor="middle" className="text-[8.5px] font-mono font-bold fill-sky-300">
                        SH-27 (56 km)
                      </text>
                      <text x="0" y="24" textAnchor="middle" className="text-[11px] font-mono font-bold fill-slate-900 dark:fill-white">
                        UJJAIN GRAIN HUB
                      </text>
                      <text x="0" y="38" textAnchor="middle" className="text-[9px] font-mono fill-slate-500 dark:text-zinc-400">
                        ~1 hr 10 min transit
                      </text>
                    </g>

                    {/* Node 3: Sanwer Mandi (NH-347BG) */}
                    <g transform="translate(160, 105)">
                      <circle cx="0" cy="0" r="12" className="fill-emerald-500/20 stroke-emerald-500" strokeWidth="2" />
                      <circle cx="0" cy="0" r="5" className="fill-emerald-500" />
                      <rect x="-44" y="-32" width="88" height="15" rx="3" className="fill-slate-900 dark:fill-black stroke-slate-700" strokeWidth="0.8" />
                      <text x="0" y="-21" textAnchor="middle" className="text-[8.5px] font-mono font-bold fill-emerald-400">
                        NH-347BG (32 km)
                      </text>
                      <text x="0" y="24" textAnchor="middle" className="text-[11px] font-mono font-bold fill-slate-900 dark:fill-white">
                        SANWER RURAL MANDI
                      </text>
                      <text x="0" y="38" textAnchor="middle" className="text-[9px] font-mono fill-slate-500 dark:text-zinc-400">
                        ~40 min transit
                      </text>
                    </g>

                    {/* Node 4: Khargone Hub (SH-1) — Fully visible with 47px bottom padding */}
                    <g transform="translate(510, 275)">
                      <circle cx="0" cy="0" r="12" className="fill-purple-500/20 stroke-purple-400" strokeWidth="2" />
                      <circle cx="0" cy="0" r="5" className="fill-purple-400" />
                      <rect x="-38" y="-32" width="76" height="15" rx="3" className="fill-slate-900 dark:fill-black stroke-slate-700" strokeWidth="0.8" />
                      <text x="0" y="-21" textAnchor="middle" className="text-[8.5px] font-mono font-bold fill-purple-300">
                        SH-1 (140 km)
                      </text>
                      <text x="0" y="24" textAnchor="middle" className="text-[11px] font-mono font-bold fill-slate-900 dark:fill-white">
                        KHARGONE HUB
                      </text>
                      <text x="0" y="38" textAnchor="middle" className="text-[9px] font-mono fill-slate-500 dark:text-zinc-400">
                        ~3 hrs 15 min transit · Nimar Belt
                      </text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* 4 Responsive Corridor Destination Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/[0.06] space-y-1.5 shadow-2xs">
                  <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">PRIMARY FREIGHT ARTERY</span>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                    <Navigation className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">NH-52 Dewas (42 km)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block leading-relaxed">
                    Transit: ~50 min · Dedicated FTL Consignments
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/[0.06] space-y-1.5 shadow-2xs">
                  <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">NORTHERN GRAIN ARTERY</span>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                    <Navigation className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">SH-27 Ujjain (56 km)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block leading-relaxed">
                    Transit: ~70 min · High-Volume Mandi Hub
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/[0.06] space-y-1.5 shadow-2xs">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">MALWA LOCAL ARTERY</span>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">NH-347BG Sanwer (32 km)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block leading-relaxed">
                    Transit: ~40 min · Rural Mandi Distribution
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/[0.06] space-y-1.5 shadow-2xs">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">SOUTHERN NIMAR ARTERY</span>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                    <Navigation className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">SH-1 Khargone (140 km)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block leading-relaxed">
                    Transit: ~195 min · Nimar Agricultural Belt
                  </span>
                </div>
              </div>

              {/* Geographic Logistics Notice */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                  <span className="text-slate-700 dark:text-zinc-300">
                    Regional Mandis: Dewas, Sanwer, Ujjain, Khargone
                  </span>
                </div>
                <span className="text-zinc-500 text-[11px]">
                  Illustrative Regional Route Network — Transit distances &amp; times based on MP state highway logistics corridors.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION E — ROLE-SPECIFIC WORKSPACES
            ========================================================================= */}
        <section id="workspaces" className="scroll-mt-24 sm:scroll-mt-28 py-20 sm:py-28 lg:py-32 bg-slate-50/70 dark:bg-[#0B0F17] border-b border-slate-200/80 dark:border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-mono font-bold tracking-widest text-amber-600 dark:text-amber-500 uppercase block">
                ISOLATED OPERATIONAL ROLES
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Six Dedicated Workspaces.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Role-based access control enforces data boundaries between external rural commercial partners and internal plant operations. Click any workspace to evaluate directly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Role 1: Dealer */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      PUBLIC ONBOARDING
                    </span>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Dealer Workspace</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Mandi feed store owners book 50kg bag orders, view 20T/25T truck meters, submit RTGS bank slips, track highway dispatches, and upload shortage claims.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleFill('dealer');
                    document.querySelector('#evaluation')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer font-semibold pt-2 border-t border-slate-100 dark:border-white/5"
                >
                  <span>Launch Role Evaluation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Role 2: Distributor */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-xs hover:border-blue-500/50 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      INSTITUTIONAL PARTNER
                    </span>
                    <Building className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Distributor Hub</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Regional stockists manage ₹10,00,000 credit wallet balance, view double-entry credit/debit transaction ledger, allocate stock to sub-dealers, and claim credit notes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleFill('distributor');
                    document.querySelector('#evaluation')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer font-semibold pt-2 border-t border-slate-100 dark:border-white/5"
                >
                  <span>Launch Role Evaluation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Role 3: Sales Agent */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-xs hover:border-amber-500/50 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      FIELD RECRUITMENT
                    </span>
                    <Activity className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Field Sales Agent</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Field officers log GPS-stamped dealer visits, book on-behalf orders in remote mandis, follow up on pending payments, and track territory targets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleFill('sales_agent');
                    document.querySelector('#evaluation')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer font-semibold pt-2 border-t border-slate-100 dark:border-white/5"
                >
                  <span>Launch Role Evaluation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Role 4: Accounts Desk */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-xs hover:border-teal-500/50 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      CONTROLLED INTERNAL
                    </span>
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Accounts Verification Desk</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Financial verification officer inspects bank UTRs against bank statements, approves 100% advance payments, and unlocks factory loading queues.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleFill('accounts');
                    document.querySelector('#evaluation')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-mono text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1.5 cursor-pointer font-semibold pt-2 border-t border-slate-100 dark:border-white/5"
                >
                  <span>Launch Role Evaluation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Role 5: Loading Operator */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-xs hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      PLANT TERMINAL
                    </span>
                    <Scale className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Weighbridge Bay Terminal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Plant operators record chassis tare weight, track bag loading increments, record gross weight, verify ±100 kg variance, and affix tamper seals.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleFill('loading_operator');
                    document.querySelector('#evaluation')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer font-semibold pt-2 border-t border-slate-100 dark:border-white/5"
                >
                  <span>Launch Role Evaluation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Role 6: Central Admin */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-xs hover:border-slate-400/50 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                      EXECUTIVE ACCESS
                    </span>
                    <Shield className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Central Admin Command</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Executive oversight over mill operations, real-time "Needs Attention" exceptions desk, user approval, fleet registry, claims review, and audit trail.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleFill('admin');
                    document.querySelector('#evaluation')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-mono text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1.5 cursor-pointer font-semibold pt-2 border-t border-slate-100 dark:border-white/5"
                >
                  <span>Launch Role Evaluation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION F — OPERATIONAL CONTROLS & METROLOGY
            ========================================================================= */}
        <section id="metrology" className="scroll-mt-24 sm:scroll-mt-28 py-20 sm:py-28 lg:py-32 border-b border-slate-200/80 dark:border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-mono font-bold tracking-widest text-amber-600 dark:text-amber-500 uppercase block">
                METROLOGY &amp; STATUTORY COMPLIANCE
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Verifiable Operational Controls.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Industrial bulk operations require concrete legal and metrological protections. Every BFEL FLOW dispatch is bound to physical weighbridge verification.
              </p>
            </div>

            {/* Weighbridge Counter Component Demonstration */}
            <WeighbridgeCounter
              tareWeightKg={9420}
              grossWeightKg={29450}
              expectedNetKg={20000}
              bayName="Manglia Plant Bay 01 · Legal for Trade (W&M Approved)"
              sealNumber="SEAL-IND-8841"
              status="valid"
            />
          </div>
        </section>

        {/* =========================================================================
            SECTION G — EVALUATION DEMO WORKSPACES & CLOSING CTA
            Seamless testing environment with complete Playwright test compatibility.
            ========================================================================= */}
        <section id="evaluation" className="scroll-mt-24 sm:scroll-mt-28 py-20 sm:py-28 lg:py-32 bg-slate-50/70 dark:bg-[#0B0F17] border-b border-slate-200/80 dark:border-white/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold tracking-widest text-amber-600 dark:text-amber-500 uppercase block">
                DEVELOPER &amp; CLIENT EVALUATION ENVIRONMENT
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Evaluation Demo Workspaces
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal">
                Test the authorized workspaces using pre-configured seed evaluation accounts. Click any role below to populate credentials and enter the operational console.
              </p>
            </div>

            {/* Form Card Container */}
            <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-white/10 shadow-lg space-y-6">
              {/* Error Banner */}
              {evalError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{evalError}</span>
                </div>
              )}

              {/* Quick Role Fill Buttons (Preserves Playwright Test Compatibility) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span className="uppercase tracking-wider font-semibold">Evaluation Demo Workspaces</span>
                  <span>Select seed role:</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleRoleFill('dealer')}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer text-center truncate transition-colors"
                  >
                    Dealer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleFill('sales_agent')}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-amber-500 text-amber-600 dark:text-amber-400 font-semibold cursor-pointer text-center truncate transition-colors"
                  >
                    Sales Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleFill('distributor')}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer text-center truncate transition-colors"
                  >
                    Distributor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleFill('accounts')}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-teal-500 text-teal-600 dark:text-teal-400 font-semibold cursor-pointer text-center truncate transition-colors"
                  >
                    Accounts
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleFill('loading_operator')}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer text-center truncate transition-colors"
                  >
                    Bay Operator
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleFill('admin')}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-400 text-slate-800 dark:text-white font-semibold cursor-pointer text-center truncate transition-colors"
                  >
                    Central Admin
                  </button>
                </div>
              </div>

              {/* Login Form Submission */}
              <form onSubmit={handleEvaluationLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                    Email or Mobile Number <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={evalIdentifier}
                    onChange={(e) => setEvalIdentifier(e.target.value)}
                    placeholder="e.g. ramesh.patel@patelagro.in"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none transition-colors text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">
                      Account Password <span className="text-amber-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => navigateTo('/forgot-password')}
                      className="text-[11px] text-amber-600 dark:text-amber-500 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={evalPassword}
                    onChange={(e) => setEvalPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none transition-colors text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-full shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying...' : 'Sign In to Workspace'}</span>
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigateTo('/login')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium underline cursor-pointer"
                >
                  Prefer dedicated login screen or OTP authentication? Open Full Login Page →
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          ENTERPRISE FOOTER
          ========================================================================= */}
      <footer className="bg-white dark:bg-[#040608] border-t border-slate-200/80 dark:border-white/10 py-16 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-extrabold flex items-center justify-center text-xs">
                B
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                  Bharat Feeds &amp; Extractions Ltd
                </span>
                <span className="text-[11px] text-slate-500">
                  Industrial Cattle Feed Manufacturing · Manglia Industrial Area, Indore (M.P.)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
              <span>ISO 9001:2015</span>
              <span>·</span>
              <span>W&amp;M Certified Scales</span>
              <span>·</span>
              <span>GSTIN: 23AABCB4412L1Z8</span>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 font-mono text-[11px]">
            <span>&copy; {new Date().getFullYear()} Bharat Feeds &amp; Extractions Ltd. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => navigateTo('/login')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/signup')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Partner Onboarding
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
