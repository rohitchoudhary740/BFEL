import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const SalesAgentSignupPage: React.FC = () => {
  const { registerSalesAgent, navigateTo } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [region, setRegion] = useState('Malwa Region');
  const [city, setCity] = useState('Indore');
  const [reportingManager, setReportingManager] = useState('Rajeshwar Sharma');
  const [password, setPassword] = useState('Password123');
  const [confirmPassword, setConfirmPassword] = useState('Password123');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedData, setSubmittedData] = useState<{
    applicationId: string;
    submittedDate: string;
    name: string;
    region: string;
  } | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required.';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) newErrors.phone = 'Enter a valid 10-digit mobile number.';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required.';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const res = registerSalesAgent({
      name: fullName,
      phone,
      email,
      employeeId,
      region,
      city,
      reportingManager,
      password,
    });

    setSubmittedData({
      applicationId: res.applicationId,
      submittedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      name: fullName,
      region,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col justify-between font-sans">
      <div className="max-w-2xl mx-auto w-full my-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('/signup')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Role Selection</span>
          </button>
          <span className="text-xs font-mono text-amber-500">Field Sales Force Track</span>
        </div>

        {submittedData ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Registration Submitted
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Sales agent registration submitted
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Your field sales agent account will be activated after BFEL administration vetting.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-md mx-auto text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Application ID:</span>
                <span className="font-bold text-white">{submittedData.applicationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Agent Name:</span>
                <span className="text-slate-300 font-sans">{submittedData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Territory:</span>
                <span className="text-slate-300 font-sans">{submittedData.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted Date:</span>
                <span className="text-slate-400">{submittedData.submittedDate}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-900">
                <span className="text-slate-500">Current Status:</span>
                <span className="text-amber-400 font-bold">Pending Admin Approval</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigateTo('/login')}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-md transition-all"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-10 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono mb-1">
                <Users className="w-4 h-4" />
                <span>SALES AGENT REGISTRATION</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Create your sales agent account
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Field representatives require manager assignment and operational approval.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Full Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Vikram Chauhan"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                  {errors.fullName && <p className="text-rose-400 text-[11px] mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Mobile Number <span className="text-amber-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9425088219"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  {errors.phone && <p className="text-rose-400 text-[11px] mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Address <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vikram.chauhan@bfel.in"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                  {errors.email && <p className="text-rose-400 text-[11px] mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Employee / Reference ID
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. BFEL-EMP-842"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Region</label>
                  <input
                    type="text"
                    required
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Reporting Manager
                  </label>
                  <input
                    type="text"
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Password <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                  {errors.password && <p className="text-rose-400 text-[11px] mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Confirm Password <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                  {errors.confirmPassword && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigateTo('/login')}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
                >
                  <span>Submit for Approval</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
