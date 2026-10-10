import React from 'react';

export interface IndustrialLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'amber' | 'cyan' | 'lime' | 'slate';
  label?: string;
  className?: string;
}

/**
 * IndustrialLoader
 * 
 * Restrained enterprise loading indicator with calibrated rotation and pulse.
 * Automatically halts infinite animation when prefers-reduced-motion is enabled.
 */
export const IndustrialLoader: React.FC<IndustrialLoaderProps> = ({
  size = 'md',
  variant = 'amber',
  label,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-[2.5px]',
    lg: 'w-10 h-10 border-3',
  }[size];

  const colorMap = {
    amber: 'border-amber-500/20 border-t-amber-500 text-amber-500',
    cyan: 'border-sky-500/20 border-t-sky-400 text-sky-400',
    lime: 'border-lime-400/20 border-t-lime-400 text-lime-400',
    slate: 'border-slate-500/20 border-t-slate-300 text-slate-300',
  }[variant];

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <div
        role="status"
        aria-label={label || 'Loading...'}
        className={`rounded-full animate-spin motion-reduce:animate-none ${sizeMap} ${colorMap}`}
      />
      {label && (
        <span className="text-xs font-mono tracking-wider uppercase text-slate-400 motion-reduce:animate-none animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};
