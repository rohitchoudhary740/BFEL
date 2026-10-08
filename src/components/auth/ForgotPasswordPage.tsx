import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, KeyRound, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword, navigateTo } = useAuth();

  const [step, setStep] = useState<'input_identifier' | 'verify_otp' | 'set_new_password' | 'success'>('input_identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSendVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your registered email or mobile number.');
      return;
    }
    setError(null);
    setStep('verify_otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '749210' && otp !== '123456') {
      setError('Invalid verification code. (Use 749210 or 123456 for demo)');
      return;
    }
    setError(null);
    setStep('set_new_password');
  };

  const handleSetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const res = resetPassword(identifier, newPassword);
    if (res.success) {
      setError(null);
      setStep('success');
    } else {
      setError(res.error || 'Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col justify-between font-sans">
      <div className="max-w-md mx-auto w-full my-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('/login')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
          <span className="text-xs font-mono text-amber-500">Credential Recovery</span>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'input_identifier' && (
            <form onSubmit={handleSendVerification} className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-500">
                  <KeyRound className="w-4 h-4" />
                  <span className="font-mono text-xs uppercase font-bold">Account Recovery</span>
                </div>
                <h1 className="text-xl font-bold text-white">Reset your password</h1>
                <p className="text-xs text-slate-400">
                  Enter your registered email address or 10-digit mobile number to receive a security recovery code.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Email or Mobile Number
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. ramesh.patel@patelagro.in or 9826041290"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Send Verification Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'verify_otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-white">Verify Recovery Code</h1>
                <p className="text-xs text-slate-400">
                  We sent a 6-digit code to <strong className="text-white">{identifier}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-widest text-lg font-mono font-extrabold py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-700 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="text-[11px] font-mono text-slate-500 text-center">
                Demo Hint: Enter <span className="text-amber-400 font-bold">749210</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Verify Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'set_new_password' && (
            <form onSubmit={handleSetNewPassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-white">Set new password</h1>
                <p className="text-xs text-slate-400">
                  Choose a new strong password for your BFEL Flow account.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Update Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Password Updated Successfully</h2>
                <p className="text-xs text-slate-400">
                  Your new credentials are now active across the BFEL Flow platform.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('/login')}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-md transition-all"
              >
                Sign In with New Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
