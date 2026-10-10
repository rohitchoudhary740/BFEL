import React, { useId } from 'react';
import { Scale, CheckCircle2, AlertTriangle, Activity, ShieldCheck } from 'lucide-react';

export type WeighbridgeState = 'idle' | 'measuring' | 'valid' | 'warning' | 'error';

export interface WeighbridgeCounterProps {
  tareWeightKg?: number;
  grossWeightKg?: number;
  expectedNetKg?: number;
  bayName?: string;
  indicatorModel?: string;
  status?: WeighbridgeState;
  toleranceLimitKg?: number;
  className?: string;
  sealNumber?: string;
}

/**
 * WeighbridgeCounter
 * 
 * Industrial digital Avery weighbridge presentation component.
 * Displays tare, gross, and net weight with tabular numerals and
 * enforces the strict BFEL ±100 kg variance tolerance rule.
 * 
 * Strictly presentational: reflects values provided by the plant terminal
 * and never performs unverified weighing or overrides backend state.
 */
export const WeighbridgeCounter: React.FC<WeighbridgeCounterProps> = ({
  tareWeightKg = 0,
  grossWeightKg = 0,
  expectedNetKg = 20000,
  bayName = 'Weighbridge Bay 01 (Manglia Plant)',
  indicatorModel = 'Avery Weigh-Tronix E1205',
  status = 'valid',
  toleranceLimitKg = 100,
  className = '',
  sealNumber,
}) => {
  const componentId = useId();

  // Calculations
  const hasTare = tareWeightKg > 0;
  const hasGross = grossWeightKg > 0;
  const netWeightKg = hasGross && hasTare ? Math.max(0, grossWeightKg - tareWeightKg) : 0;
  const varianceKg = (netWeightKg > 0 && expectedNetKg > 0) ? netWeightKg - expectedNetKg : 0;
  const absVarianceKg = Math.abs(varianceKg);
  const isOutOfTolerance = netWeightKg > 0 && expectedNetKg > 0 && absVarianceKg > toleranceLimitKg;

  // Determine effective operational status
  const effectiveStatus: WeighbridgeState = isOutOfTolerance
    ? 'error'
    : status === 'error'
    ? 'error'
    : status === 'measuring'
    ? 'measuring'
    : netWeightKg > 0 && !isOutOfTolerance
    ? 'valid'
    : status;

  // Status Styling
  const statusTheme = {
    idle: {
      badgeBg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      label: 'Scale Standby',
      ledColor: 'text-slate-400',
    },
    measuring: {
      badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse',
      label: 'Acquiring Stable Weight',
      ledColor: 'text-sky-400',
    },
    valid: {
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      label: 'Scale Stable · In Tolerance',
      ledColor: 'text-emerald-400',
    },
    warning: {
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      label: 'Tolerance Notice',
      ledColor: 'text-amber-400',
    },
    error: {
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      label: 'Variance Exceeds ±100kg Limit',
      ledColor: 'text-rose-400',
    },
  }[effectiveStatus];

  return (
    <div
      aria-labelledby={`${componentId}-heading`}
      className={`
        rounded-xl p-4 sm:p-6
        bg-[#06080C] text-slate-100
        border border-[#1B2636]
        shadow-2xl relative overflow-hidden
        ${className}
      `}
    >
      {/* Background Subtle Technical Grid Accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"
      />

      {/* 1. Scale Header Terminal Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1B2636]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 id={`${componentId}-heading`} className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {bayName}
            </h4>
            <div className="text-[11px] text-slate-400 font-mono">
              Indicator: <span className="text-slate-300 font-semibold">{indicatorModel}</span> · Legal for Trade (W&M Approved)
            </div>
          </div>
        </div>

        {/* Live Scale Status Chip */}
        <div className={`self-start sm:self-center px-3 py-1 rounded-md border text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1.5 ${statusTheme.badgeBg}`}>
          {effectiveStatus === 'measuring' ? (
            <Activity className="w-3.5 h-3.5 animate-spin" />
          ) : effectiveStatus === 'valid' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : effectiveStatus === 'error' ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : null}
          <span>{statusTheme.label}</span>
        </div>
      </div>

      {/* 2. Primary Avery Digital Indicator Readout (Large LED Screen) */}
      <div className="relative z-10 my-4 p-4 sm:p-5 rounded-lg bg-[#0B1017] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">
            Certified Net Cargo Mass
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl sm:text-4xl lg:text-5xl font-mono font-extrabold tabular-nums tracking-tight ${statusTheme.ledColor}`}>
              {netWeightKg > 0 ? netWeightKg.toLocaleString() : '— — — —'}
            </span>
            <span className="text-sm sm:text-base font-mono text-slate-400 uppercase font-semibold">
              kg
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Target Allocation: <strong className="text-slate-200">{expectedNetKg.toLocaleString()} kg</strong> ({Math.round(expectedNetKg / 50)} bags)
          </div>
        </div>

        {/* Scale Tolerance Variance Chip */}
        <div className="flex flex-col items-start md:items-end justify-center pt-2 md:pt-0 border-t md:border-t-0 border-[#1B2636]">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">
            Tolerance Variance (±{toleranceLimitKg} kg limit)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl sm:text-2xl font-mono font-bold tabular-nums ${isOutOfTolerance ? 'text-rose-400' : 'text-emerald-400'}`}>
              {netWeightKg > 0 ? (varianceKg > 0 ? `+${varianceKg}` : `${varianceKg}`) : '0'}
            </span>
            <span className="text-xs font-mono text-slate-400">kg</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            {isOutOfTolerance ? (
              <span className="text-rose-400 font-semibold">Exceeds ±{toleranceLimitKg}kg limit</span>
            ) : netWeightKg > 0 ? (
              <span className="text-emerald-400 font-medium">Within legal calibration tolerance</span>
            ) : (
              <span>Pending dual-scale record</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Three-Scale Component Breakdown */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Scale 1: Tare Weight */}
        <div className="p-3 rounded-lg bg-[#0E1520] border border-[#1B2636]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              1. Tare Weight (Empty)
            </span>
            <span className="w-2 h-2 rounded-full bg-slate-500" />
          </div>
          <div className="text-lg font-mono font-bold tabular-nums text-slate-200">
            {hasTare ? tareWeightKg.toLocaleString() : 'Pending'}
            {hasTare && <span className="text-xs text-slate-400 font-normal"> kg</span>}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Recorded prior to loading bay entry
          </div>
        </div>

        {/* Scale 2: Gross Weight */}
        <div className="p-3 rounded-lg bg-[#0E1520] border border-[#1B2636]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              2. Gross Weight (Loaded)
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-lg font-mono font-bold tabular-nums text-slate-200">
            {hasGross ? grossWeightKg.toLocaleString() : 'Pending'}
            {hasGross && <span className="text-xs text-slate-400 font-normal"> kg</span>}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Recorded post-loading exit
          </div>
        </div>

        {/* Scale 3: Net Payload */}
        <div className="p-3 rounded-lg bg-[#0E1520] border border-[#1B2636]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              3. Certified Net Payload
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-lg font-mono font-bold tabular-nums text-slate-200">
            {netWeightKg > 0 ? netWeightKg.toLocaleString() : 'Pending'}
            {netWeightKg > 0 && <span className="text-xs text-slate-400 font-normal"> kg</span>}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Gross - Tare calculation
          </div>
        </div>
      </div>

      {/* 4. Security Seal Lock Status */}
      {sealNumber && (
        <div className="relative z-10 mt-3.5 px-3 py-2 rounded-lg bg-[#0E1520] border border-[#1B2636] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tamper-Evident Security Seal Applied:</span>
          </div>
          <span className="font-bold text-amber-400 tracking-wider">
            {sealNumber}
          </span>
        </div>
      )}

      {/* 5. Out of Tolerance Action Warning */}
      {isOutOfTolerance && (
        <div className="relative z-10 mt-3.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="leading-snug">
            <strong>Security release blocked:</strong> Weighbridge net variance ({absVarianceKg} kg) exceeds authorized ±{toleranceLimitKg} kg tolerance threshold. Bag recount required before security gate pass generation.
          </div>
        </div>
      )}
    </div>
  );
};
