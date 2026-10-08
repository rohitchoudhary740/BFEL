import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Users,
  Wallet,
  UserCheck,
  Truck,
  Shield,
  ArrowRight,
  Lock,
  ArrowLeft,
} from 'lucide-react';

export const SignupRoleSelectionPage: React.FC = () => {
  const { navigateTo } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 sm:p-10 font-sans">
      <div className="max-w-5xl mx-auto w-full space-y-8 my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-900 text-amber-500 font-extrabold flex items-center justify-center text-sm border border-amber-500/30">
              B
            </div>
            <span className="text-base font-bold text-white">
              BFEL <span className="text-amber-500 font-bold">FLOW</span>
            </span>
          </div>

          <button
            onClick={() => navigateTo('/login')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
            Secure Onboarding
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Create your BFEL Flow account
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Choose how you work with BFEL. Each role operates within an isolated workspace with
            role-specific workflows and cryptographic permission controls.
          </p>
        </div>

        {/* Role Cards Matrix */}
        <div className="space-y-6">
          {/* Section 1: Public Registration */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Public Partner Onboarding
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dealer Card */}
              <div
                onClick={() => navigateTo('/signup/dealer')}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/80 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Authorized Dealer
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Place bulk 20 MT &amp; 25 MT feed orders, track RTGS advance payments, weighbridge
                    clearances, truck deliveries and shortage claims.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-400 border-t border-slate-800">
                  <span>Create Dealer Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Sales Agent Card */}
              <div
                onClick={() => navigateTo('/signup/sales-agent')}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/80 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    Field Sales Agent
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Manage territory dealerships, conduct geo-fenced GPS visits, capture godown physical stock
                    audits, field orders and follow-ups.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-amber-400 border-t border-slate-800">
                  <span>Register as Sales Agent</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Request / Invitation */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Request / Invitation
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Distributor Card */}
              <div
                onClick={() => navigateTo('/signup/distributor')}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/80 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-400 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                      Master Distributor
                    </h3>
                    <span className="text-[11px] text-amber-400 font-mono">
                      Requires BFEL approval
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Manage regional dealer order flows, digital wallet credit, product bag allocations,
                    bulk transit dispatches and credit note reconciliation.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-indigo-400 border-t border-slate-800">
                  <span>Request Distributor Access</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Internal Restricted Accounts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-500">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Internal Operational Roles · Access requires approval from BFEL Central Administration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Accounts */}
              <div
                onClick={() => navigateTo('/signup/accounts')}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 opacity-90 hover:opacity-100 cursor-pointer space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded bg-teal-950/60 text-teal-400 flex items-center justify-center text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Accounts Desk</h4>
                <p className="text-[11px] text-slate-400">Finance &amp; UTR payment verification desk.</p>
                <span className="inline-block text-[10px] font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                  Access requires approval from BFEL Central Administration.
                </span>
              </div>

              {/* Loading Operator */}
              <div
                onClick={() => navigateTo('/signup/loading')}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 opacity-90 hover:opacity-100 cursor-pointer space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded bg-blue-950/60 text-blue-400 flex items-center justify-center text-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Loading Operator</h4>
                <p className="text-[11px] text-slate-400">Plant terminal weighbridge &amp; bay loading.</p>
                <span className="inline-block text-[10px] font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                  Access requires approval from BFEL Central Administration.
                </span>
              </div>

              {/* Central Admin */}
              <div
                onClick={() => navigateTo('/signup/admin')}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 opacity-90 hover:opacity-100 cursor-pointer space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded bg-slate-800 text-slate-300 flex items-center justify-center text-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Central Admin</h4>
                <p className="text-[11px] text-slate-400">Operations administration &amp; user vetting.</p>
                <span className="inline-block text-[10px] font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                  Access requires approval from BFEL Central Administration.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Link */}
        <div className="pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
          Already have an authorized BFEL Flow account?{' '}
          <button
            onClick={() => navigateTo('/login')}
            className="text-amber-500 font-bold hover:underline cursor-pointer ml-1"
          >
            Sign in to workspace
          </button>
        </div>
      </div>
    </div>
  );
};
