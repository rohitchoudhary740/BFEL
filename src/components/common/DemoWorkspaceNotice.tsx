import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Sparkles, X, Info, ShieldCheck, ChevronDown } from 'lucide-react';

export const DemoWorkspaceNotice: React.FC = () => {
  const { demoRoleInfoMessage, dismissDemoMessage, demoSwitchRole, currentUser } = useAuth();
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <>
      {/* Active Demo Role Banner */}
      {demoRoleInfoMessage && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{demoRoleInfoMessage}</span>
            <button
              onClick={() => setShowExplanation(true)}
              className="underline text-[11px] font-bold cursor-pointer shrink-0 ml-1"
            >
              Why this exists
            </button>
          </div>
          <button
            onClick={dismissDemoMessage}
            className="p-1 hover:bg-amber-600 rounded cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Explanatory Modal on Demo Switching */}
      {showExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Prototype Role Switching Architecture
                </h3>
              </div>
              <button
                onClick={() => setShowExplanation(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              In production, BFEL Flow users log in via <strong>Email+Password</strong> or <strong>Mobile+OTP</strong>. The backend verifies credentials, checks account status (rejecting unverified registrations), issues a JWT session, and automatically binds the user to their authorized dashboard.
            </p>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
              <strong>Evaluation / Interview Note:</strong>
              <p>
                The top <em>Demo Role Switcher</em> is provided solely so evaluators and hiring managers can quickly inspect all 6 role interfaces without having to log in and out repeatedly.
              </p>
            </div>

            <button
              onClick={() => setShowExplanation(false)}
              className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold rounded-lg cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
