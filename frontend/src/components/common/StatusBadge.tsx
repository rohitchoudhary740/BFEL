import React from 'react';
import { OrderStatus, PaymentStatus, ClaimStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | ClaimStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const formatText = (s: string) => {
    return s
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getColorConfig = (s: string) => {
    switch (s) {
      case 'verified':
      case 'loading_completed':
      case 'dispatched':
      case 'delivered':
      case 'approved':
        return {
          dot: 'bg-emerald-500',
          text: 'text-emerald-700 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
        };
      case 'loading':
      case 'dispatch_ready':
      case 'loading_planned':
        return {
          dot: 'bg-blue-500 animate-pulse',
          text: 'text-blue-700 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50',
        };
      case 'pending_verification':
      case 'payment_submitted':
      case 'order_placed':
      case 'under_review':
      case 'submitted':
        return {
          dot: 'bg-amber-500',
          text: 'text-amber-700 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
        };
      case 'rejected':
      case 'cancelled':
        return {
          dot: 'bg-rose-500',
          text: 'text-rose-700 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50',
        };
      default:
        return {
          dot: 'bg-slate-400',
          text: 'text-slate-600 dark:text-slate-400',
          bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const config = getColorConfig(status);
  const textClass = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-medium ${config.bg} ${config.text} ${textClass} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{formatText(status)}</span>
    </span>
  );
};
