import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserPlus, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

export const PublicSignupModal: React.FC = () => {
  const { requestSignup, closeModal, showToast } = useApp();

  const [requestedRole, setRequestedRole] = useState<'dealer' | 'sales_agent'>('dealer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dealershipName, setDealershipName] = useState('');
  const [territory, setTerritory] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !dealershipName || !territory) {
      showToast('Please fill all mandatory dealership registration fields', 'error');
      return;
    }

    requestSignup({
      name,
      phone,
      email,
      requestedRole,
      dealershipName,
      territory,
    });

    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
              Partner Network Onboarding
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Dealership &amp; Agent Registration
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-xs">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Application Received
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Your partnership application is currently marked as{' '}
                <strong className="text-amber-600 font-semibold">Pending Admin Approval</strong>. BFEL Operations will verify your credentials and dispatch your onboarding activation SMS.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Return to Platform
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Role Selection */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Onboarding Track
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestedRole('dealer')}
                    className={`py-2 px-2 text-center rounded-lg border font-bold text-xs transition-all cursor-pointer ${
                      requestedRole === 'dealer'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Authorized Dealer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestedRole('sales_agent')}
                    className={`py-2 px-2 text-center rounded-lg border font-bold text-xs transition-all cursor-pointer ${
                      requestedRole === 'sales_agent'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Field Sales Agent
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98260 41290"
                    className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@agro.in"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Agency / Dealership Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={dealershipName}
                  onChange={(e) => setDealershipName(e.target.value)}
                  placeholder="e.g. Patel Agro Agency"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  District / Territory <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  placeholder="e.g. Dewas &amp; Ujjain Belt, MP"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              {/* Policy note */}
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Internal Provisioning Policy</span>
                </div>
                <p>
                  Admin and Accounts staff accounts are provisioned internally by BFEL Corporate Office and cannot be created via public registration.
                </p>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2 font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-md cursor-pointer transition-colors"
              >
                <span>Submit Application for Approval</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
