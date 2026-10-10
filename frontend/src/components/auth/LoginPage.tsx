import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRight,
  Shield,
  KeyRound,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  Check,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface LoginPageProps {
  defaultMethod?: 'password' | 'otp';
}

export const LoginPage: React.FC<LoginPageProps> = ({ defaultMethod = 'password' }) => {
  const {
    loginWithCredentials,
    requestOtp,
    loginWithOtp,
    navigateTo,
    usersList,
  } = useAuth();

  const [method, setMethod] = useState<'password' | 'otp'>(defaultMethod);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpStep, setOtpStep] = useState<'input_phone' | 'input_code'>('input_phone');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedHint, setSimulatedHint] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer for OTP
  React.useEffect(() => {
    let interval: any = null;
    if (otpStep === 'input_code' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, timerSeconds]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your registered email or mobile number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWithCredentials(identifier, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestOtp(otpPhone);
      if (res.success) {
        setOtpStep('input_code');
        setTimerSeconds(30);
        setSimulatedHint(res.simulatedCode);
      } else {
        setErrorMessage(res.error || 'Could not send verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWithOtp(otpPhone, otpCode);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill helper for evaluator ease
  const handleQuickDemoFill = (role: string) => {
    const u = usersList.find((usr) => usr.role === role && usr.status === 'active');
    if (u) {
      setIdentifier(u.email);
      setPassword('Password123');
      setMethod('password');
      setErrorMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* LEFT COLUMN: Login Card & Form (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
          {/* Top Brand Lockup */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-500 font-extrabold flex items-center justify-center text-sm shadow-xs border border-amber-500/30">
                B
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white leading-none">
                  BFEL <span className="text-amber-500 font-bold">FLOW</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight font-medium">
                  Cattle Feed Distribution &amp; Operations Platform
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-mono text-[11px]">Indore Plant Active</span>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Form Card Container */}
          <div className="my-auto py-8 max-w-md w-full mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Sign in to your workspace
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your credentials to access your authorized operational workspace.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">{errorMessage}</div>
              </div>
            )}

            {/* Method Segmented Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMethod('password');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-md transition-all cursor-pointer ${
                  method === 'password'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethod('otp');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-md transition-all cursor-pointer ${
                  method === 'otp'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                OTP Login
              </button>
            </div>

            {/* Password Login Form */}
            {method === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Email or Mobile Number <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. ramesh.patel@patelagro.in or 9826041290"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-amber-500 focus:outline-none transition-colors text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">
                      Password <span className="text-amber-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => navigateTo('/forgot-password')}
                      className="text-[11px] text-amber-600 dark:text-amber-500 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-amber-500 focus:outline-none transition-colors text-xs"
                  />
                </div>

                {/* Remember device checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 text-xs">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>Remember device for 30 days</span>
                  </label>
                </div>

                {/* Primary & Secondary CTAs */}
                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('/signup')}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer transition-all text-center text-xs"
                  >
                    Request Access
                  </button>
                </div>
              </form>
            ) : (
              /* OTP Login Form */
              <div className="space-y-4 text-xs">
                {otpStep === 'input_phone' ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Registered 10-Digit Mobile Number
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-600 dark:text-slate-400">
                          +91
                        </span>
                        <input
                          type="tel"
                          autoFocus
                          required
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value)}
                          placeholder="e.g. 9826041290"
                          className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-amber-500 focus:outline-none font-mono text-xs"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        We will send a 6-digit verification code via SMS to this number.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 text-xs"
                      >
                        <span>Send 6-Digit OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('/signup')}
                        className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer transition-all text-center text-xs"
                      >
                        Request Access
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">OTP sent to:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">+91 {otpPhone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpStep('input_phone')}
                        className="text-[11px] text-amber-600 dark:text-amber-500 hover:underline cursor-pointer"
                      >
                        Change Number
                      </button>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Enter 6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        autoFocus
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="• • • • • •"
                        className="w-full text-center tracking-widest text-xl font-mono font-extrabold py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    {simulatedHint && (
                      <div className="text-[11px] font-mono text-slate-500 text-center">
                        Demo Hint: Verification code is <span className="text-amber-400 font-bold">{simulatedHint}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {timerSeconds > 0 ? (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-500" />
                            Resend code in {timerSeconds}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTimerSeconds(30);
                              requestOtp(otpPhone);
                            }}
                            className="text-amber-500 font-semibold hover:underline cursor-pointer"
                          >
                            Resend Code
                          </button>
                        )}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify &amp; Enter Workspace</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Quick Demo Accounts Selection */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <span className="uppercase tracking-wider">Evaluation Demo Workspaces</span>
                <span>Click to auto-fill:</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('dealer')}
                  className="px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer text-center truncate"
                >
                  Dealer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('sales_agent')}
                  className="px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-amber-600 dark:text-amber-400 font-medium cursor-pointer text-center truncate"
                >
                  Sales Agent
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('distributor')}
                  className="px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-blue-600 dark:text-blue-400 font-medium cursor-pointer text-center truncate"
                >
                  Distributor
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('accounts')}
                  className="px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-teal-500 text-teal-600 dark:text-teal-400 font-medium cursor-pointer text-center truncate"
                >
                  Accounts
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('loading_operator')}
                  className="px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer text-center truncate"
                >
                  Bay Operator
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('admin')}
                  className="px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-500 text-slate-800 dark:text-white font-medium cursor-pointer text-center truncate"
                >
                  Central Admin
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Security Info */}
          <div className="pt-4 text-xs text-slate-500 font-mono flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80">
            <span>Bharat Feeds &amp; Extractions Ltd</span>
            <span>Security Protected</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Information Panel (5 cols on lg) - Clickable to return to Home Screen */}
        <div
          onClick={() => {
            navigateTo('/');
            if (typeof window !== 'undefined' && window.location.hash) {
              window.location.hash = '';
            }
          }}
          className="lg:col-span-5 bg-slate-100/70 dark:bg-slate-950 p-6 sm:p-10 lg:p-12 flex flex-col justify-between border-slate-200 dark:border-slate-800 cursor-pointer relative group/rightpanel hover:bg-slate-100 dark:hover:bg-slate-900/90 transition-all select-none"
          title="Click to return to home screen"
        >
          {/* Top Return to Home Button & Affordance */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-slate-800/70 mb-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateTo('/');
                if (typeof window !== 'undefined' && window.location.hash) {
                  window.location.hash = '';
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 hover:shadow-sm transition-all cursor-pointer group"
              title="Return to BFEL FLOW Home Screen"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              <Home className="w-3.5 h-3.5 text-amber-500" />
              <span>Back to Home Screen</span>
            </button>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <span>Click panel to return home</span>
              <ArrowRight className="w-3 h-3 text-amber-500 group-hover/rightpanel:translate-x-0.5 transition-transform" />
            </span>
          </div>

          <div className="space-y-8 my-auto max-w-sm mx-auto">
            {/* Tagline & Operational Flow Statement */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-500 font-bold block">
                BFEL CONNECTED OPERATIONS
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                One connected flow from order booking to payment verification, loading, dispatch and claims.
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Operating at the Indore Plant with live digital weighbridge integration, 100% advance RTGS verification, and real-time dealer dispatch notices.
              </p>
            </div>

            {/* 4 Concise Trust Points */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Role-based access</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Isolated workspaces with operational permissions for dealers, distributors, agents, accounts and plant operators.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Payment verification</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Accounts desk matches bank UTR credits and approves factory loading orders prior to bay dispatch.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Weighbridge-controlled loading</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Avery scale indicator checks tare, gross, and net weight with ±100 kg tolerance enforcement and security seals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Complete dispatch traceability</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Gate passes, Lorry Receipts (LRs), real-time WhatsApp alerts and photo-verified shortage claim settlements.
                  </p>
                </div>
              </div>
            </div>

            {/* Indian B2B logistics specifications badge */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1 shadow-xs">
              <div className="text-slate-800 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Manufacturing &amp; Packing Standard</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                50 kg HDPE Bags · Dedicated 20 MT (400 bags) &amp; 25 MT (500 bags) consignments · Manglia Plant, Indore (M.P.).
              </p>
            </div>
          </div>

          <div className="pt-4 text-[10px] text-slate-500 dark:text-slate-500 font-mono flex items-center justify-between border-t border-slate-200 dark:border-slate-900">
            <span>BFEL Flow · Operational ERP for Cattle Feed Manufacturing</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 group-hover/rightpanel:underline">
              <span>Return Home</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
