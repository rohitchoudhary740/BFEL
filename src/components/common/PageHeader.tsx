import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'amber' | 'emerald' | 'blue' | 'slate' | 'rose';
  };
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'emerald';
  };
  secondaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbs,
  title,
  subtitle,
  action,
  badge,
  primaryAction,
  secondaryAction,
  children,
}) => {
  const getBadgeClass = (variant = 'slate') => {
    switch (variant) {
      case 'amber':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'rose':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'slate':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const getPrimaryBtnClass = (variant = 'primary') => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs';
      case 'secondary':
        return 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-xs';
      case 'primary':
      default:
        return 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs';
    }
  };

  return (
    <div className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800">
      {/* Contextual Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {crumb.onClick && !isLast ? (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className={isLast ? 'font-semibold text-slate-900 dark:text-slate-200' : ''}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {badge && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border font-mono ${getBadgeClass(badge.variant)}`}>
                {badge.text}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {action}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-3.5 h-3.5" />}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${getPrimaryBtnClass(primaryAction.variant)}`}
            >
              {primaryAction.icon && <primaryAction.icon className="w-3.5 h-3.5" />}
              <span>{primaryAction.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Child Pills or Sub-header Filters */}
      {children && <div className="pt-1">{children}</div>}
    </div>
  );
};
