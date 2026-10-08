import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, ArrowRight, Lock } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  const { currentUser, navigateTo, getRoleDashboardRoute, logout } = useAuth();

  const handleReturn = () => {
    if (currentUser && currentUser.status === 'active') {
      const dest = getRoleDashboardRoute(currentUser.role);
      navigateTo(dest);
    } else {
      navigateTo('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col justify-between font-sans">
      <div className="max-w-md mx-auto w-full my-auto space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-700/80 text-rose-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold">
            Security Authorization Boundary
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Access Restricted
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            You don't have permission to access this workspace.
          </p>
        </div>

        {/* User Context Card */}
        {currentUser && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-left space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-500">Authenticated user:</span>
              <span className="font-bold text-white">{currentUser.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Your role:</span>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-800 text-amber-400 uppercase">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Required permission:</span>
              <span className="text-slate-300 font-mono text-[11px]">
                Authorized Workspace Credentials
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed border-t border-slate-800/80">
              BFEL Flow enforces strict role-based access control (RBAC). Your assigned operational role does not permit navigation to this URL path.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleReturn}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <span>Return to Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-slate-200 py-1 cursor-pointer"
          >
            Sign out of this session
          </button>
        </div>
      </div>
    </div>
  );
};
