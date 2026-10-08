import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  indicatorColor?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  trend,
  indicatorColor = 'slate',
  actionButton,
}) => {
  const getBorderColor = () => {
    switch (indicatorColor) {
      case 'emerald':
        return 'border-l-emerald-500';
      case 'amber':
        return 'border-l-amber-500';
      case 'blue':
        return 'border-l-blue-600';
      case 'rose':
        return 'border-l-rose-500';
      default:
        return 'border-l-slate-400';
    }
  };

  return (
    <div className={`p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs border-l-4 ${getBorderColor()} flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {label}
          </span>
          {trend && (
            <span
              className={`text-[11px] font-mono font-medium ${
                trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
        <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
          {value}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        {subtext && (
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            {subtext}
          </span>
        )}
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-[11px] hover:underline cursor-pointer"
          >
            {actionButton.label}
          </button>
        )}
      </div>
    </div>
  );
};
