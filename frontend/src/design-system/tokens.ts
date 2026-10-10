/**
 * BFEL FLOW — Centralized Design Tokens
 * 
 * Industrial Executive design tokens for Bharat Feeds & Extractions Ltd.
 * Reflects heavy cattle-feed milling, precision logistics, and plant operations.
 */

export const BFEL_COLORS = {
  // Foundational Neutrals
  millBlack: '#06080C',
  darkSteel: '#0B1017',
  siloPanel: '#111823',
  slateHover: '#162232',
  slateActive: '#1E2D42',

  // Light Mode Neutrals
  lightBase: '#F4F6F9',
  lightSurface: '#FFFFFF',
  lightPanel: '#E9EEF4',
  lightHover: '#DEE5EF',

  // Core Brand & Logistics Accents
  harvestGold: '#F59E0B',
  harvestGoldDark: '#D97706',
  harvestGoldLight: '#FEF3C7',
  weighbridgeCyan: '#38BDF8',
  weighbridgeCyanDark: '#0284C7',
  electricLime: '#DEF36A',
  electricLimeDark: '#4D7C0F',

  // Semantic Signals
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#38BDF8',
} as const;

export const BFEL_SPACING = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
} as const;

export const BFEL_RADII = {
  xs: '3px',
  sm: '5px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export const BFEL_TYPOGRAPHY = {
  display: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  body: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', monospace",
} as const;

export const BFEL_TRANSITIONS = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: '350ms cubic-bezier(0.16, 1, 0.3, 1)',
} as const;
