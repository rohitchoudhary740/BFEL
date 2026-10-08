import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { X, Phone, KeyRound, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export const OtpLoginModal: React.FC = () => {
  const { closeModal, switchRole, showToast } = useApp();

  const [phone, setPhone] = useState<string>('98260 41290');
  const [roleToLogin, setRoleToLogin] = useState<UserRole>('dealer');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>('749210');
  const [simulatedCode] = useState<string>('749210');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    setOtpSent(true);
    showToast(`Simulated OTP sent: ${simulatedCode}`, 'info');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue === simulatedCode || otpValue === '123456') {
      switchRole(roleToLogin);
      closeModal();
      showToast(`Logged in successfully via OTP as ${roleToLogin.toUpperCase()}`, 'success');
    } else {
      showToast('Invalid OTP entered. (Use 749210 or 123456 for demo)', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
              BFEL Secure Access
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Mobile OTP Sign In
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-xs space-y-4">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Select User Workspace
                </label>
                <select
                  value={roleToLogin}
                  onChange={(e) => setRoleToLogin(e.target.value as UserRole)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                >
                  <option value="dealer">Ramesh Patel (Dealer · Patel Agro Dewas)</option>
                  <option value="sales_agent">Vikram Chauhan (Sales Agent · Malwa)</option>
                  <option value="distributor">Sanjay Maheshwari (Distributor · Indore)</option>
                  <option value="accounts">Sunita Jain (Accounts Staff · Manglia)</option>
                  <option value="loading_operator">Kailash Verma (Loading Operator · Bay 3)</option>
                  <option value="admin">Rajeshwar Sharma (Operations Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Registered Mobile Number
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98260 41290"
                    className="flex-1 px-3 py-1.5 font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500">
                A 6-digit verification code will be dispatched to your authorized mobile number.
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2 font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-md cursor-pointer transition-colors"
              >
                <span>Send 6-Digit OTP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>OTP dispatched to +91 {phone}</span>
                <span className="font-mono font-bold">Demo code: {simulatedCode}</span>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  className="w-full text-center tracking-widest text-lg font-mono font-extrabold py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify &amp; Enter Dashboard</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-[11px] text-slate-400 hover:underline"
                >
                  Change Mobile Number
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
