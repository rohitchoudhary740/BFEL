import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
}) => {
  return (
    <div className="p-8 sm:p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 max-w-lg mx-auto shadow-2xs">
      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-400 mx-auto flex items-center justify-center">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              {action.icon && <action.icon className="w-3.5 h-3.5" />}
              <span>{action.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
