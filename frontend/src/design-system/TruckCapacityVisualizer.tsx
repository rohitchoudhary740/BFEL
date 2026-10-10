import React, { useId, useState } from 'react';
import { TruckCapacityType } from '../types';
import { TRUCK_LIMITS, bagsToKg, bagsToMT } from '../context/AppContext';
import { Truck, AlertTriangle, CheckCircle2, ShieldAlert, Scale, Box, Info } from 'lucide-react';

export interface TruckCapacityVisualizerProps {
  capacityType?: TruckCapacityType;
  currentBags: number;
  label?: string;
  className?: string;
  showAxleLayout?: boolean;
  showDisclaimers?: boolean;
  interactiveControls?: boolean;
  onBagsChange?: (bags: number) => void;
  onCapacityTypeChange?: (type: TruckCapacityType) => void;
}

/**
 * BFEL FLOW — Precision Industrial Truck Cargo Cutaway Visualization
 * 
 * Commercial heavy freight multi-axle carrier (Tata Signa / BharatBenz 2823R profile)
 * enforcing strict legal axle constraints:
 * - 20 MT Standard: Max 400 bags (20,000 kg payload) on tandem rear bogie
 * - 25 MT Heavy Haul: Max 500 bags (25,000 kg payload) on tridem rear bogie
 * - Universal Packaging: Standard 50 kg HDPE cattle feed bags across 10 pallet rows (R1 to R10)
 */
export const TruckCapacityVisualizer: React.FC<TruckCapacityVisualizerProps> = ({
  capacityType = '20_MT',
  currentBags = 0,
  label = 'Truck Capacity Utilization',
  className = '',
  showAxleLayout = true,
  showDisclaimers = true,
  interactiveControls = false,
  onBagsChange,
  onCapacityTypeChange,
}) => {
  const visualizerId = useId();
  const [hoveredBay, setHoveredBay] = useState<number | null>(null);

  // Safely sanitize bag count (prevent NaN, negative, non-finite values)
  const rawBags = typeof currentBags === 'number' && !isNaN(currentBags)
    ? Math.max(0, Math.floor(currentBags))
    : 0;

  const limits = TRUCK_LIMITS[capacityType] || TRUCK_LIMITS['20_MT'];
  const maxBags = limits.maxBags; // 400 or 500
  const maxMT = limits.maxMT;     // 20 or 25
  const currentKg = bagsToKg(rawBags);
  const currentMT = bagsToMT(rawBags);

  const percentage = Math.round((rawBags / maxBags) * 100);
  const clampedPercentage = Math.min(100, percentage);
  const isOptimal = rawBags === maxBags;
  const isOverloaded = rawBags > maxBags;
  const remainingBags = Math.max(0, maxBags - rawBags);
  const remainingKg = remainingBags * 50;
  const excessBags = Math.max(0, rawBags - maxBags);

  // 10 pallet rows total (each bay holds 40 bags for 20 MT, or 50 bags for 25 MT)
  const bagsPerBay = maxBags / 10;

  // Status tokens
  const statusColor = isOverloaded
    ? 'text-rose-600 dark:text-rose-400'
    : isOptimal
    ? 'text-emerald-600 dark:text-emerald-400'
    : percentage > 85
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-sky-600 dark:text-sky-400';

  const barColor = isOverloaded
    ? 'bg-rose-500'
    : isOptimal
    ? 'bg-emerald-500'
    : percentage > 85
    ? 'bg-amber-500'
    : 'bg-sky-500';

  const badgeBg = isOverloaded
    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400'
    : isOptimal
    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
    : 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300';

  return (
    <div
      aria-labelledby={`${visualizerId}-label`}
      className={`
        w-full overflow-hidden rounded-3xl p-5 sm:p-7
        bg-white dark:bg-[#0B0E17]
        border border-slate-200/80 dark:border-white/[0.08]
        text-slate-900 dark:text-slate-100
        shadow-xl transition-all duration-200 space-y-6
        ${className}
      `}
    >
      {/* 1. Header Information Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400 shadow-xs shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 id={`${visualizerId}-label`} className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-200">
                {label}
              </h4>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/[0.08]">
                {capacityType === '20_MT' ? '20 MT STANDARD' : '25 MT HEAVY'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              {capacityType === '20_MT' ? '20 MT Multi-Axle Chassis (Max 400 Bags)' : '25 MT Multi-Axle Chassis (Max 500 Bags)'} · Standard 50kg HDPE Bags
            </div>
          </div>
        </div>

        {/* State Badge */}
        <div className={`self-start sm:self-center px-3.5 py-1 rounded-full border text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1.5 ${badgeBg}`}>
          {isOverloaded ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-500" />
              <span>Overload Alert (+{excessBags} bags)</span>
            </>
          ) : isOptimal ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span>Full Truckload (FTL)</span>
            </>
          ) : (
            <span>{percentage}% Allocated</span>
          )}
        </div>
      </div>

      {/* 2. Interactive Controls (When enabled by props) */}
      {interactiveControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#070B10] rounded-xl border border-slate-200 dark:border-[#1B2636] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Chassis:</span>
            <button
              type="button"
              onClick={() => onCapacityTypeChange?.('20_MT')}
              className={`px-2.5 py-1 rounded-md font-mono font-bold cursor-pointer transition-colors ${
                capacityType === '20_MT'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-[#111823] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1B2636]'
              }`}
            >
              20 MT (400)
            </button>
            <button
              type="button"
              onClick={() => onCapacityTypeChange?.('25_MT')}
              className={`px-2.5 py-1 rounded-md font-mono font-bold cursor-pointer transition-colors ${
                capacityType === '25_MT'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-[#111823] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1B2636]'
              }`}
            >
              25 MT (500)
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onBagsChange?.(0)}
              className="px-2 py-1 rounded bg-white dark:bg-[#111823] border border-slate-200 dark:border-[#1B2636] text-[11px] font-mono text-slate-500 hover:text-amber-500 cursor-pointer"
            >
              0 (Empty)
            </button>
            <button
              type="button"
              onClick={() => onBagsChange?.(capacityType === '20_MT' ? 280 : 350)}
              className="px-2 py-1 rounded bg-white dark:bg-[#111823] border border-slate-200 dark:border-[#1B2636] text-[11px] font-mono text-slate-500 hover:text-amber-500 cursor-pointer"
            >
              Partial
            </button>
            <button
              type="button"
              onClick={() => onBagsChange?.(capacityType === '20_MT' ? 380 : 480)}
              className="px-2 py-1 rounded bg-white dark:bg-[#111823] border border-slate-200 dark:border-[#1B2636] text-[11px] font-mono text-slate-500 hover:text-amber-500 cursor-pointer"
            >
              Near Full
            </button>
            <button
              type="button"
              onClick={() => onBagsChange?.(maxBags)}
              className="px-2 py-1 rounded bg-white dark:bg-[#111823] border border-slate-200 dark:border-[#1B2636] text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-500 cursor-pointer"
            >
              100% Full
            </button>
            <button
              type="button"
              onClick={() => onBagsChange?.(maxBags + 1)}
              className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold cursor-pointer"
            >
              +1 Overload
            </button>
          </div>
        </div>
      )}

      {/* 3. Primary Metrics Reading (Tabular Numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
            Bags Allocated
          </span>
          <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
            <span className={statusColor}>{rawBags}</span>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-normal"> / {maxBags}</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-1 block">
            {bagsPerBay} bags / pallet row
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
            Tonnage (MT)
          </span>
          <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
            <span>{currentMT.toFixed(2)}</span>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-normal"> / {maxMT} MT</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-1 block">
            {clampedPercentage}% legal gross
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
            Total Mass (kg)
          </span>
          <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
            <span>{currentKg.toLocaleString()}</span>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-normal"> kg</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-1 block">
            {(maxBags * 50).toLocaleString()} kg legal limit
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
            Available Space
          </span>
          <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {isOverloaded ? (
              <span className="text-rose-500">0</span>
            ) : (
              <span className="text-emerald-500">{remainingBags}</span>
            )}
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-normal"> bags remaining</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-1 block">
            {remainingKg.toLocaleString()} kg headroom
          </span>
        </div>
      </div>

      {/* 4. HIGH-PRECISION INDUSTRIAL TRUCK CUTAWAY ELEVATION */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400 px-1">
          <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
            <Box className="w-3.5 h-3.5 text-orange-400" />
            <span>Industrial Trailer Cutaway Elevation</span>
          </span>
          <span>
            {hoveredBay !== null ? (
              <strong className="text-orange-400 font-mono">
                Bay R{hoveredBay + 1}: {Math.min(bagsPerBay, Math.max(0, rawBags - hoveredBay * bagsPerBay))} / {bagsPerBay} bags ({(Math.min(bagsPerBay, Math.max(0, rawBags - hoveredBay * bagsPerBay)) * 50).toLocaleString()} kg)
              </strong>
            ) : (
              <span className="text-slate-400 dark:text-zinc-500">Hover pallet bay for stow metrics</span>
            )}
          </span>
        </div>

        {/* Responsive Vector Illustration Canvas */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-[#07090F] border border-slate-200/80 dark:border-white/[0.06] p-2 sm:p-5 flex items-center justify-center">
          <svg
            viewBox="0 0 960 300"
            className="w-full h-auto select-none"
            style={{ maxHeight: '440px', minHeight: '190px' }}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Linear Gradients for Authentic Bag Stacks */}
              <linearGradient id="bagGradientFilled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="60%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <linearGradient id="bagGradientOptimal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="60%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="bagGradientOverload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="60%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#BE123C" />
              </linearGradient>
              <linearGradient id="cabBodyGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="45%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#090D16" />
              </linearGradient>
              <linearGradient id="windshieldGlass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#0284C7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0369A1" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="wheelRim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="50%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Ribbed Industrial Deck Floor Pattern */}
              <pattern id="emptyDeckPattern" width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M 0 12 L 12 0 M 0 0 L 12 12" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-slate-300 dark:text-slate-800" />
              </pattern>
            </defs>

            {/* Background Ground Roadway Line */}
            <line x1="20" y1="265" x2="940" y2="265" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" className="text-slate-300 dark:text-slate-800" />

            {/* --- 1. TRACTOR CAB UNIT (#truckCab) --- */}
            <g id="truckCab" className="transition-all">
              {/* Heavy Cabin Main Body (Tata Signa / BharatBenz commercial hauler profile) */}
              <path
                d="M 755 98 L 868 98 L 905 145 L 916 186 L 916 238 L 755 238 Z"
                fill="url(#cabBodyGradient)"
                stroke="#475569"
                strokeWidth="1.8"
              />

              {/* Aerodynamic High-Roof Fairing */}
              <path
                d="M 755 72 Q 835 72 865 98 L 755 98 Z"
                className="fill-amber-500 stroke-amber-600"
                strokeWidth="1.5"
              />
              {/* Roof Marker Lamps */}
              <circle cx="830" cy="80" r="2.5" className="fill-amber-300" />
              <circle cx="848" cy="88" r="2.5" className="fill-amber-300" />

              {/* Tinted Commercial Windshield */}
              <path
                d="M 852 104 L 896 146 L 830 146 L 830 104 Z"
                fill="url(#windshieldGlass)"
                stroke="#38BDF8"
                strokeWidth="1.2"
              />
              {/* Windshield Reflection Streak */}
              <line x1="860" y1="108" x2="840" y2="142" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />

              {/* Driver Door Window with Sun Visor */}
              <rect
                x="766"
                y="106"
                width="56"
                height="35"
                rx="3"
                className="fill-sky-900/30 stroke-sky-500/50"
                strokeWidth="1"
              />
              <line x1="792" y1="106" x2="792" y2="141" stroke="#334155" strokeWidth="1" />

              {/* Door Handle & Cab Character Lines */}
              <rect x="768" y="152" width="12" height="3" rx="1" className="fill-slate-400" />
              <line x1="755" y1="148" x2="830" y2="148" stroke="#334155" strokeWidth="1" />
              <line x1="822" y1="106" x2="822" y2="185" stroke="#334155" strokeWidth="1" />

              {/* Rear-view Mirror Arm & Mirror */}
              <path d="M 865 110 L 872 108 L 872 136 L 865 134 Z" className="fill-slate-900 stroke-slate-500" strokeWidth="1" />

              {/* Vertical Stainless Exhaust Stack */}
              <rect x="746" y="52" width="7" height="155" rx="2" className="fill-slate-400 dark:fill-slate-500 stroke-slate-600" strokeWidth="0.8" />
              <rect x="744" y="85" width="11" height="55" rx="2" className="fill-slate-600 dark:fill-slate-700" opacity="0.6" />

              {/* Dual-Tier Front Radiator Grille */}
              <rect x="906" y="150" width="8" height="34" rx="2" className="fill-slate-950 stroke-slate-600" strokeWidth="1" />
              <line x1="907" y1="158" x2="913" y2="158" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="907" y1="166" x2="913" y2="166" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="907" y1="174" x2="913" y2="174" stroke="#CBD5E1" strokeWidth="1.5" />
              {/* Fleet Crest */}
              <circle cx="910" cy="162" r="3" className="fill-amber-500" />

              {/* Projector Headlight Assembly */}
              <rect x="908" y="195" width="8" height="16" rx="2" className="fill-amber-400 stroke-amber-500 shadow-md" />
              <rect x="908" y="214" width="8" height="6" rx="1" className="fill-amber-600" />

              {/* Heavy Steel Front Bumper */}
              <path d="M 894 225 L 922 225 L 918 244 L 888 244 Z" className="fill-slate-800 dark:fill-[#0F172A] stroke-slate-600" strokeWidth="1.2" />
              {/* License Plate Indicator */}
              <rect x="898" y="232" width="16" height="6" rx="1" className="fill-yellow-400 stroke-slate-900" strokeWidth="0.5" />

              {/* Front Steer Axle Wheel & Tire */}
              <g id="frontSteerWheel">
                {/* Steer Axle Mudguard Arch */}
                <path d="M 822 245 A 28 28 0 0 1 878 245" fill="none" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
                {/* Tire Outer */}
                <circle cx="850" cy="245" r="23" className="fill-slate-950 stroke-slate-600" strokeWidth="3" />
                {/* Tire Tread Detailing */}
                <circle cx="850" cy="245" r="21" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                {/* Steel Rim */}
                <circle cx="850" cy="245" r="13" fill="url(#wheelRim)" stroke="#94A3B8" strokeWidth="1.5" />
                {/* 10 Lug Bolts */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i * Math.PI) / 4;
                  return (
                    <circle
                      key={i}
                      cx={850 + Math.cos(angle) * 8.5}
                      cy={245 + Math.sin(angle) * 8.5}
                      r="1"
                      className="fill-slate-900"
                    />
                  );
                })}
                {/* Hub Cap with Fleet Gold Accent */}
                <circle cx="850" cy="245" r="4.5" className="fill-amber-500 stroke-amber-700" strokeWidth="1" />
              </g>

              {/* Cab Entry Assist Step */}
              <rect x="800" y="236" width="18" height="3" rx="1" className="fill-slate-400" />
            </g>

            {/* --- 2. TRAILER CHASSIS & SUBFRAME (#trailerFrame) --- */}
            <g id="trailerFrame">
              {/* Fifth-Wheel Turntable Kingpin Coupling */}
              <rect x="735" y="210" width="22" height="15" rx="2" className="fill-slate-700 stroke-slate-500" strokeWidth="1" />

              {/* Heavy-Duty Structural Steel I-Beam Chassis Rail */}
              <rect x="42" y="226" width="715" height="12" rx="2" className="fill-slate-900 dark:fill-[#0A1017] stroke-slate-600 dark:stroke-slate-700" strokeWidth="1.2" />

              {/* Landing Gear Stabilizers */}
              <rect x="672" y="228" width="8" height="24" rx="1" className="fill-slate-600" />
              <rect x="668" y="250" width="16" height="4" rx="1" className="fill-slate-700" />

              {/* Compressed Air Brake Tanks */}
              <rect x="520" y="230" width="55" height="8" rx="4" className="fill-slate-700 stroke-slate-500" strokeWidth="0.8" />
              <rect x="440" y="230" width="55" height="8" rx="4" className="fill-slate-700 stroke-slate-500" strokeWidth="0.8" />

              {/* Lateral Underrun Protection Guard Rail with Reflective Hazard Stripes */}
              <rect x="330" y="234" width="90" height="5" rx="1" className="fill-amber-500" />
              <path d="M 345 234 L 350 239 M 365 234 L 370 239 M 385 234 L 390 239 M 405 234 L 410 239" stroke="#000" strokeWidth="2" />

              {/* Rear Tandem Bogie Wheels (Wheel 1 & Wheel 2 for 20 MT) */}
              {/* Rear Wheel 1 (cx=150) */}
              <g id="rearWheel1">
                <circle cx="150" cy="245" r="23" className="fill-slate-950 stroke-slate-600" strokeWidth="3" />
                <circle cx="150" cy="245" r="21" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="150" cy="245" r="13" fill="url(#wheelRim)" stroke="#94A3B8" strokeWidth="1.5" />
                <circle cx="150" cy="245" r="4.5" className="fill-amber-500 stroke-amber-700" strokeWidth="1" />
              </g>

              {/* Rear Wheel 2 (cx=212) */}
              <g id="rearWheel2">
                <circle cx="212" cy="245" r="23" className="fill-slate-950 stroke-slate-600" strokeWidth="3" />
                <circle cx="212" cy="245" r="21" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="212" cy="245" r="13" fill="url(#wheelRim)" stroke="#94A3B8" strokeWidth="1.5" />
                <circle cx="212" cy="245" r="4.5" className="fill-amber-500 stroke-amber-700" strokeWidth="1" />
              </g>

              {/* Rear Wheel 3 (For 25 MT Heavy Haul Tridem Axle, cx=274) */}
              {capacityType === '25_MT' && (
                <g id="rearWheel3">
                  <circle cx="274" cy="245" r="23" className="fill-slate-950 stroke-slate-600" strokeWidth="3" />
                  <circle cx="274" cy="245" r="21" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="274" cy="245" r="13" fill="url(#wheelRim)" stroke="#94A3B8" strokeWidth="1.5" />
                  <circle cx="274" cy="245" r="4.5" className="fill-amber-500 stroke-amber-700" strokeWidth="1" />
                </g>
              )}

              {/* Heavy Tandem/Tridem Mudguard Arch & Mud Flap */}
              <path
                d={capacityType === '25_MT' ? 'M 120 245 A 28 28 0 0 1 304 245' : 'M 120 245 A 28 28 0 0 1 242 245'}
                fill="none"
                stroke="#475569"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <rect x="116" y="240" width="5" height="18" rx="1" className="fill-slate-900" />

              {/* Rear Underrun Bumper & LED Taillights */}
              <rect x="36" y="222" width="7" height="24" rx="1" className="fill-slate-800 stroke-slate-600" strokeWidth="1" />
              <circle cx="39" cy="226" r="2" className="fill-rose-500" />
              <circle cx="39" cy="234" r="2" className="fill-amber-400" />
            </g>

            {/* --- 3. CUTAWAY CARGO COMPARTMENT & 10 PALLET STOWS --- */}
            {/* Outer Trailer Cargo Box Frame */}
            <rect
              x="42"
              y="60"
              width="712"
              height="166"
              rx="6"
              className={`fill-white/90 dark:fill-[#080E16]/95 transition-all ${
                isOverloaded
                  ? 'stroke-rose-500 stroke-[2.5px]'
                  : isOptimal
                  ? 'stroke-emerald-500 stroke-[2px]'
                  : 'stroke-slate-300 dark:stroke-[#1B2636] stroke-[1.5px]'
              }`}
            />

            {/* Trailer Structural Bulkheads & Roof Rail */}
            <rect x="38" y="56" width="720" height="6" rx="2" className="fill-slate-700 dark:fill-slate-800" />
            <line x1="42" y1="220" x2="754" y2="220" stroke="currentColor" strokeWidth="2" className="text-slate-400 dark:text-slate-700" />

            {/* 10 Vertical Pallet Bays (R1 at rear to R10 at front) */}
            {Array.from({ length: 10 }).map((_, idx) => {
              const bayX = 48 + idx * 69;
              const bayWidth = 65;
              const bayHeight = 150;
              const bayY = 66;

              // Bag count in this specific bay
              const bagsInThisBay = Math.min(bagsPerBay, Math.max(0, rawBags - idx * bagsPerBay));
              const bayFillRatio = bagsInThisBay / bagsPerBay;
              const filledHeight = Math.max(0, (bayHeight - 16) * bayFillRatio);
              const isBayHovered = hoveredBay === idx;

              const stackGradient = isOverloaded
                ? 'url(#bagGradientOverload)'
                : isOptimal
                ? 'url(#bagGradientOptimal)'
                : 'url(#bagGradientFilled)';

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredBay(idx)}
                  onMouseLeave={() => setHoveredBay(null)}
                  className="cursor-pointer transition-all"
                >
                  {/* Empty Bay Slot Background */}
                  <rect
                    x={bayX}
                    y={bayY}
                    width={bayWidth}
                    height={bayHeight}
                    rx="3"
                    fill="url(#emptyDeckPattern)"
                    className={`transition-colors ${
                      isBayHovered
                        ? 'stroke-amber-500 stroke-[1.5px]'
                        : 'stroke-slate-200 dark:stroke-[#1B2636]/60 stroke-[0.75px]'
                    }`}
                  />

                  {/* Wooden Pallet Base at Deck Floor */}
                  <g id={`palletBase-${idx}`}>
                    <rect
                      x={bayX + 2}
                      y={bayY + bayHeight - 12}
                      width={bayWidth - 4}
                      height={9}
                      rx="1"
                      className="fill-amber-950/70 dark:fill-amber-900/60 stroke-amber-800/60"
                      strokeWidth="0.75"
                    />
                    {/* Forklift Runner Pockets */}
                    <rect x={bayX + 12} y={bayY + bayHeight - 7} width={10} height={4} rx="0.5" className="fill-slate-900/80" />
                    <rect x={bayX + bayWidth - 22} y={bayY + bayHeight - 7} width={10} height={4} rx="0.5" className="fill-slate-900/80" />
                  </g>

                  {/* Filled Woven HDPE Cattle Feed Bag Stacks */}
                  {bagsInThisBay > 0 && (
                    <g>
                      {/* Main Pallet Bag Mass */}
                      <rect
                        x={bayX + 2}
                        y={bayY + bayHeight - 12 - filledHeight}
                        width={bayWidth - 4}
                        height={filledHeight}
                        rx="3"
                        fill={stackGradient}
                        className="transition-all duration-300"
                        opacity={isBayHovered ? 1 : 0.94}
                      />

                      {/* Stacked Woven HDPE Bag Rows (Horizontal Dividers + Center Seams) */}
                      {Array.from({ length: Math.min(8, Math.ceil(bagsInThisBay / 5)) }).map((_, layerIdx) => {
                        const layerCount = Math.min(8, Math.ceil(bagsInThisBay / 5));
                        const layerY = bayY + bayHeight - 12 - (layerIdx + 1) * (filledHeight / layerCount);
                        return (
                          <g key={layerIdx}>
                            {/* Layer Horizontal Divider */}
                            <line
                              x1={bayX + 3}
                              y1={layerY}
                              x2={bayX + bayWidth - 3}
                              y2={layerY}
                              stroke="rgba(0, 0, 0, 0.35)"
                              strokeWidth="1.2"
                            />
                            {/* Individual Bag Pillow Contours */}
                            <line
                              x1={bayX + (bayWidth / 2)}
                              y1={layerY}
                              x2={bayX + (bayWidth / 2)}
                              y2={layerY + (filledHeight / layerCount)}
                              stroke="rgba(0, 0, 0, 0.25)"
                              strokeWidth="1"
                              strokeDasharray="2 1"
                            />
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* Bay Tag (R1 to R10) — CRITICAL FOR PLAYWRIGHT SPEC */}
                  <rect
                    x={bayX + 14}
                    y={bayY + 6}
                    width={37}
                    height={16}
                    rx="3"
                    className="fill-slate-900/85 dark:fill-black/85 stroke-slate-700/60"
                    strokeWidth="0.8"
                  />
                  <text
                    x={bayX + 32}
                    y={bayY + 18}
                    textAnchor="middle"
                    className="fill-slate-200 text-[10px] font-mono font-bold select-none"
                  >
                    R{idx + 1}
                  </text>

                  {/* Real-Time Bag Count Badge inside Bay Floor */}
                  <text
                    x={bayX + 32}
                    y={bayY + bayHeight - 16}
                    textAnchor="middle"
                    className={`text-[9px] font-mono font-bold select-none ${
                      bagsInThisBay > 0 ? 'fill-slate-950 font-black' : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {bagsInThisBay}
                  </text>
                </g>
              );
            })}

            {/* Overload Spillover Warning Banner (#overloadIndicator) — CRITICAL FOR TEST SPEC */}
            {isOverloaded && (
              <g id="overloadIndicator">
                <rect
                  x="42"
                  y="42"
                  width="712"
                  height="16"
                  rx="3"
                  className="fill-rose-500 shadow-lg animate-pulse"
                />
                <text
                  x="398"
                  y="53.5"
                  textAnchor="middle"
                  className="fill-white font-mono font-black text-[9.5px] uppercase tracking-wider select-none"
                >
                  ⚠ OVERLOAD EXCEEDED: +{excessBags} BAGS ({bagsToKg(excessBags).toLocaleString()} KG) — Capacity limit exceeded:
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* 5. Linear Progress Bar & Operational Scale Ticks */}
      <div className="space-y-1.5 pt-1">
        <div
          role="progressbar"
          aria-valuenow={rawBags}
          aria-valuemin={0}
          aria-valuemax={maxBags}
          aria-label="Cattle feed truck capacity progress"
          className="h-3 w-full bg-slate-100 dark:bg-[#111823] rounded-full overflow-hidden border border-slate-200 dark:border-[#1B2636] p-0.5"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${barColor}`}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>

        {/* Calibrated Legal Ticks */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 tabular-nums px-0.5">
          <span>0 MT (0 bags)</span>
          <span>50% Payload</span>
          <span className="font-semibold">{capacityType === '20_MT' ? '20 MT (400 bags FTL)' : '25 MT (500 bags FTL)'}</span>
        </div>
      </div>

      {/* 6. Axle Compartment Allocation Strip */}
      {showAxleLayout && (
        <div className="pt-2 border-t border-slate-200 dark:border-[#1B2636]/60">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
            <span className="font-semibold">Axle Compartment Allocation</span>
            <span>{capacityType === '20_MT' ? '10 Pallet Rows · 40 Bags/Row' : '10 Pallet Rows · 50 Bags/Row'}</span>
          </div>

          {/* 10 Cargo Row Slots */}
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
            {Array.from({ length: 10 }).map((_, idx) => {
              const rowCapacity = maxBags / 10;
              const rowFilled = rawBags >= (idx + 1) * rowCapacity;
              const isPartial = !rowFilled && rawBags > idx * rowCapacity;

              return (
                <div
                  key={idx}
                  title={`Row ${idx + 1}: ${rowFilled ? 'Fully Loaded' : isPartial ? 'Partially Loaded' : 'Empty'}`}
                  className={`
                    h-6 sm:h-7 rounded-sm flex items-center justify-center font-mono text-[9px] transition-all
                    ${rowFilled
                      ? isOverloaded ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400 font-bold' : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-500 dark:text-emerald-400 font-bold'
                      : isPartial
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-500 dark:text-amber-400 font-semibold'
                      : 'bg-slate-100 dark:bg-[#111823] border border-slate-200 dark:border-[#1B2636] text-slate-400'
                    }
                  `}
                >
                  R{idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Warning or Notice Banner — CRITICAL FOR PLAYWRIGHT SPEC */}
      {isOverloaded && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="leading-snug">
            <strong>Capacity limit exceeded:</strong> Order contains {excessBags} bags ({bagsToKg(excessBags).toLocaleString()} kg) over legal road axle weight. Reduce order or split into an additional consignment before submitting.
          </div>
        </div>
      )}

      {/* 8. Legal & Operational Disclaimer */}
      {showDisclaimers && (
        <div className="pt-2 border-t border-slate-200 dark:border-[#1B2636]/60 text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-relaxed flex items-start gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
          <span>
            BFEL FLOW Logistics Rule: Finished cattle feeds are shipped strictly in 50 kg HDPE bags on verified 20 MT / 25 MT transport chassis. Physical loading authorization requires 100% advance RTGS clearance and weighbridge tare balance. Stack visualization represents nominal volumetric capacity, not physical axle mass distribution, center-of-gravity, or mechanical vehicle roadworthiness certification.
          </span>
        </div>
      )}
    </div>
  );
};
