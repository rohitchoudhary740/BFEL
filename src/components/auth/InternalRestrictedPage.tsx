import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';

interface InternalRestrictedPageProps {
  roleType: 'accounts' | 'loading' | 'admin';
}

export const InternalRestrictedPage: React.FC<InternalRestrictedPageProps> = ({ roleType }) => {
  const { navigateTo } = useAuth();

  const getRoleDetails = () => {
    switch (roleType) {
      case 'accounts':
        return {
          title: 'Accounts Desk Access',
          desc: 'Access requires approval from BFEL Central Administration.',
          roleLabel: 'Finance & Accounts Desk',
        };
      case 'loading':
        return {
          title: 'Loading Operator Access',
          desc: 'Access requires approval from BFEL Central Administration.',
          roleLabel: 'Plant Terminal Operations',
        };
      case 'admin':
      default:
        return {
          title: 'Central Admin Access',
          desc: 'Access requires approval from BFEL Central Administration.',
          roleLabel: 'Central Operations Admin',
        };
    }
  };

  const details = getRoleDetails();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col justify-between font-sans">
      <div className="max-w-md mx-auto w-full my-auto space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-800/80 text-rose-400 mx-auto flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold">
            Internal Account Restricted
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {details.title}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {details.desc}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 text-left space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Operational Security Notice</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            If you are an employee of Bharat Feeds &amp; Extractions Ltd stationed at the Manglia plant,
            please contact your IT administrator or plant manager for authorization.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => navigateTo('/login')}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <span>Return to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateTo('/signup')}
            className="text-xs text-slate-400 hover:text-slate-200 py-1"
          >
            Back to Public Onboarding
          </button>
        </div>
      </div>
    </div>
  );
};
