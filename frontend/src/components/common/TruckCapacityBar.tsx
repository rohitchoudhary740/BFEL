import React from 'react';
import { TruckCapacityType } from '../../types';
import { TRUCK_LIMITS, bagsToKg, bagsToMT } from '../../context/AppContext';

export interface TruckCapacityBarProps {
  capacityType?: TruckCapacityType;
  truckCapacity?: TruckCapacityType;
  currentBags: number;
  className?: string;
  showDetails?: boolean;
}

export const TruckCapacityBar: React.FC<TruckCapacityBarProps> = ({
  capacityType,
  truckCapacity,
  currentBags = 0,
  className = '',
  showDetails = true,
}) => {
  const resolvedCapacity: TruckCapacityType = capacityType || truckCapacity || '20_MT';
  const limits = TRUCK_LIMITS[resolvedCapacity] || TRUCK_LIMITS['20_MT'];
  const maxBags = limits?.maxBags || 400;
  const maxMT = limits?.maxMT || 20;
  
  const validBags = typeof currentBags === 'number' && !isNaN(currentBags) ? currentBags : 0;
  const currentKg = bagsToKg(validBags);
  const currentMT = bagsToMT(validBags);
  const percentage = Math.min(100, Math.round((validBags / maxBags) * 100));
  const isOverloaded = validBags > maxBags;
  const bagsRemaining = Math.max(0, maxBags - validBags);

  const getBarColor = () => {
    if (isOverloaded) return 'bg-rose-500';
    if (percentage === 100) return 'bg-emerald-500';
    if (percentage > 85) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {capacityType === '20_MT' ? '20 MT Standard Load' : '25 MT Heavy Load'}
        </span>
        <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
          <strong className={`font-semibold ${isOverloaded ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {currentBags}
          </strong>{' '}
          / {maxBags} bags
          <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
          <span>{currentMT.toFixed(1)} / {maxMT} MT</span>
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
        <div
          className={`h-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {showDetails && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-mono tabular-nums">{percentage}% Capacity filled</span>
          {isOverloaded ? (
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              Exceeded by {currentBags - maxBags} bags ({bagsToKg(currentBags - maxBags)} kg)!
            </span>
          ) : percentage === 100 ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Optimal full truckload reached
            </span>
          ) : (
            <span>
              <strong className="font-medium text-slate-700 dark:text-slate-300">{bagsRemaining}</strong> bags remaining to full load
            </span>
          )}
        </div>
      )}
    </div>
  );
};
