import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { Menu, X, ArrowRight } from 'lucide-react';

export const LandingNavBar: React.FC = () => {
  const { navigateTo, isAuthenticated, currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (hash: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full pt-3 sm:pt-4 px-3 sm:px-6 pointer-events-none">
      <div className="max-w-6xl mx-auto pointer-events-auto">
        <div className="rounded-full bg-white/85 dark:bg-[#07090E]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4 transition-all">
          {/* Brand Lockup */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleNavClick('#hero')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-extrabold flex items-center justify-center text-xs shadow-xs transition-transform group-hover:scale-105">
                B
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                  BFEL <span className="text-amber-500 font-bold">FLOW</span>
                </span>
                <span className="hidden xl:inline-block text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                  Logistics ERP
                </span>
              </div>
            </button>

            {/* Plant Live Status Pill (Hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Indore Plant Active</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => handleNavClick('#workflow')}
              className="px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Operational Workflow
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('#capacity')}
              className="px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Truck Capacity
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('#workspaces')}
              className="px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Workspaces
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('#metrology')}
              className="px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Weighbridge &amp; Controls
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('#evaluation')}
              className="px-3 py-1.5 rounded-full text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-mono transition-colors cursor-pointer"
            >
              Evaluation Console
            </button>
          </nav>

          {/* Action Controls & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  const roleSlug = currentUser?.role === 'sales_agent' ? 'sales' : (currentUser?.role === 'loading_operator' ? 'loading' : currentUser?.role || 'dealer');
                  navigateTo(`/${roleSlug}`);
                }}
                className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-full text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigateTo('/login')}
                  className="py-1.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-500 dark:hover:text-amber-400 cursor-pointer transition-colors"
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('/signup')}
                  className="hidden sm:inline-flex py-2 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold rounded-full text-xs cursor-pointer shadow-xs transition-all items-center gap-1.5"
                >
                  <span>Partner Onboarding</span>
                </button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0B1017]/95 backdrop-blur-xl p-4 space-y-3 shadow-xl animate-fadeIn pointer-events-auto">
            <nav className="flex flex-col space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <button
                type="button"
                onClick={() => handleNavClick('#workflow')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Operational Workflow
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('#capacity')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Truck Capacity
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('#workspaces')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Workspaces
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('#metrology')}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Weighbridge &amp; Controls
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('#evaluation')}
                className="text-left py-2 px-3 rounded-lg text-amber-500 font-mono hover:bg-amber-500/10 cursor-pointer"
              >
                Evaluation Console
              </button>
            </nav>

            <div className="pt-2 border-t border-slate-200 dark:border-[#1B2636] flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('/login');
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-full text-xs cursor-pointer shadow-xs text-center"
              >
                Sign In to Workspace
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('/signup');
                }}
                className="w-full py-2.5 bg-slate-100 dark:bg-[#111823] border border-slate-300 dark:border-[#1B2636] text-slate-900 dark:text-white font-semibold rounded-full text-xs cursor-pointer text-center"
              >
                Partner Registration
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
