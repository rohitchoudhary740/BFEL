import React from 'react';
import { OrderStatus } from '../../types';
import { Check, Clock, AlertTriangle, Truck } from 'lucide-react';

interface OrderTimelineProps {
  status: OrderStatus;
  isPaymentRejected?: boolean;
}

interface Step {
  key: OrderStatus;
  label: string;
}

const STEPS: Step[] = [
  { key: 'order_placed', label: 'Order Placed' },
  { key: 'payment_submitted', label: 'Payment Submitted' },
  { key: 'payment_verified', label: 'Payment Verified' },
  { key: 'loading_planned', label: 'Loading Planned' },
  { key: 'loading', label: 'Loading' },
  { key: 'loading_completed', label: 'Loading Completed' },
  { key: 'dispatch_ready', label: 'Dispatch Ready' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
];

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, isPaymentRejected = false }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="w-full py-3">
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center min-w-[700px] justify-between relative">
          {/* Connector line */}
          <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />

          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isPending = idx > currentIndex;
            const isBlocked = isCurrent && isPaymentRejected && step.key === 'payment_submitted';

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10 text-center px-1">
                {/* Node icon */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isBlocked
                      ? 'bg-rose-500 text-white ring-4 ring-rose-100 dark:ring-rose-950'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                      : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-400'
                  }`}
                >
                  {isBlocked ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : isCurrent ? (
                    step.key === 'dispatched' ? (
                      <Truck className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                    )
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Node text */}
                <span
                  className={`mt-2 text-[11px] font-medium leading-tight max-w-[80px] ${
                    isBlocked
                      ? 'text-rose-600 dark:text-rose-400 font-semibold'
                      : isCurrent
                      ? 'text-blue-700 dark:text-blue-400 font-bold'
                      : isCompleted
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </span>

                {isCurrent && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
