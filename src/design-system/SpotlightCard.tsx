import React, { useRef, useState, useCallback } from 'react';

export type SpotlightVariant = 'amber' | 'cyan' | 'lime' | 'neutral';

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SpotlightVariant;
  radius?: number;
  borderGlow?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

const VARIANT_CONFIGS: Record<SpotlightVariant, {
  lightColor: string;
  borderColor: string;
  focusRing: string;
}> = {
  amber: {
    lightColor: 'rgba(245, 158, 11, 0.07)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    focusRing: 'focus-visible:ring-amber-500',
  },
  cyan: {
    lightColor: 'rgba(56, 189, 248, 0.07)',
    borderColor: 'rgba(56, 189, 248, 0.45)',
    focusRing: 'focus-visible:ring-cyan-500',
  },
  lime: {
    lightColor: 'rgba(222, 243, 106, 0.07)',
    borderColor: 'rgba(222, 243, 106, 0.45)',
    focusRing: 'focus-visible:ring-lime-400',
  },
  neutral: {
    lightColor: 'rgba(248, 250, 252, 0.05)',
    borderColor: 'rgba(148, 163, 184, 0.35)',
    focusRing: 'focus-visible:ring-slate-400',
  },
};

/**
 * SpotlightCard
 * 
 * High-performance enterprise card with cursor-tracking ambient radial light
 * and restrained border highlight. Uses direct CSS custom properties to avoid
 * unnecessary React component re-renders on mousemove.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  variant = 'amber',
  radius = 320,
  borderGlow = true,
  interactive = false,
  className = '',
  style,
  children,
  onClick,
  onKeyDown,
  ...restProps
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Directly mutate CSS custom properties on container DOM node
  // Completely bypasses React state updates on mouse movement for 60fps performance
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--spotlight-x', `${x}px`);
    cardRef.current.style.setProperty('--spotlight-y', `${y}px`);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
    onKeyDown?.(e);
  }, [interactive, onClick, onKeyDown]);

  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.amber;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      className={`
        relative rounded-xl overflow-hidden
        bg-white dark:bg-[#0B1017]
        border border-slate-200 dark:border-[#1B2636]
        text-slate-900 dark:text-slate-100
        transition-all duration-200
        ${interactive ? `cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 ${config.focusRing}` : ''}
        ${className}
      `}
      style={{
        ...style,
        // Default coordinates offscreen
        ['--spotlight-x' as string]: '-999px',
        ['--spotlight-y' as string]: '-999px',
        ['--spotlight-radius' as string]: `${radius}px`,
        ['--spotlight-color' as string]: config.lightColor,
        ['--spotlight-border' as string]: config.borderColor,
      }}
      {...restProps}
    >
      {/* 1. Subtle Radial Light Following Pointer (Desktop Fine Pointer Only) */}
      <div
        aria-hidden="true"
        className={`
          pointer-events-none absolute inset-0 z-0
          transition-opacity duration-300 ease-out
          hidden sm:block
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          background: `radial-gradient(var(--spotlight-radius) circle at var(--spotlight-x) var(--spotlight-y), var(--spotlight-color), transparent 75%)`,
        }}
      />

      {/* 2. Precision Border Illumination Layer */}
      {borderGlow && (
        <div
          aria-hidden="true"
          className={`
            pointer-events-none absolute -inset-px rounded-xl z-0
            transition-opacity duration-300 ease-out
            hidden sm:block
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            background: `radial-gradient(160px circle at var(--spotlight-x) var(--spotlight-y), var(--spotlight-border), transparent 85%)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
      )}

      {/* 3. Card Content (Relative z-10 for text clarity at all angles) */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
