import { useState, useEffect } from 'react';
import type { Transition, Variants } from 'motion/react';

/**
 * BFEL FLOW — Shared Motion Utilities
 * 
 * High-performance, restrained physics transitions.
 * Hardware-accelerated and strictly respects prefers-reduced-motion.
 */

// Enterprise Spring Physics Configurations
export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

export const SPRING_SMOOTH: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 28,
  mass: 1.0,
};

export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 24,
  mass: 1.2,
};

// Standard Timing Transitions
export const TRANSITION_FAST: Transition = {
  duration: 0.15,
  ease: [0.4, 0, 0.2, 1],
};

export const TRANSITION_BASE: Transition = {
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1],
};

export const TRANSITION_SMOOTH: Transition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1],
};

// Reusable Motion Variants
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: TRANSITION_BASE 
  },
  exit: { 
    opacity: 0, 
    transition: TRANSITION_FAST 
  },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: SPRING_SMOOTH 
  },
  exit: { 
    opacity: 0, 
    y: -8, 
    transition: TRANSITION_FAST 
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const cardInteractiveVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.01,
    transition: SPRING_SNAPPY,
  },
  tap: { 
    scale: 0.99,
    transition: { duration: 0.05 },
  },
};

/**
 * Hook to detect user motion preference
 * Ensures full WCAG compliance for users sensitive to motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
