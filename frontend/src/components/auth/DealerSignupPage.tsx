import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const DealerSignupPage: React.FC = () => {
  const { registerDealer, navigateTo } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dealershipName, setDealershipName] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dewas');
  const [district, setDistrict] = useState('Dewas');
  const [state, setState] = useState('Madhya Pradesh');
  const [pincode, setPincode] = useState('455001');
  const [preferredLocation, setPreferredLocation] = useState('Dewas Mandi Yard');
  const [password, setPassword] = useState('Password123');
  const [confirmPassword, setConfirmPassword] = useState('Password123');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedData, setSubmittedData] = useState<{
    applicationId: string;
    submittedDate: string;
    dealershipName: string;
    name: string;
  } | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required.';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) newErrors.phone = 'Enter a valid 10-digit mobile number.';
    if (!dealershipName.trim()) newErrors.dealershipName = 'Dealership or agency name is required.';
    if (!address.trim()) newErrors.address = 'Business address is required.';
    if (!city.trim()) newErrors.city = 'City is required.';
    if (!district.trim()) newErrors.district = 'District is required.';
    if (!pincode.trim() || pincode.length !== 6) newErrors.pincode = 'Enter a valid 6-digit postal code.';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!agreedToTerms) newErrors.terms = 'You must agree to the terms to proceed.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const res = registerDealer({
      name: fullName,
      phone,
      email,
      dealershipName,
      gstin,
      address,
      city,
      district,
      state,
      pincode,
      preferredLocation,
      password,
    });

    setSubmittedData({
      applicationId: res.applicationId,
      submittedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      dealershipName,
      name: fullName,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col justify-between font-sans">
      <div className="max-w-3xl mx-auto w-full my-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('/signup')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Role Selection</span>
          </button>
          <span className="text-xs font-mono text-amber-500">Tier-1 Dealership Track</span>
        </div>

        {/* Completion Pending State */}
        {submittedData ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Application Submitted
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Your dealer account is awaiting BFEL approval.
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Thank you for applying to join the BFEL cattle feed distribution network.
                Our operations desk reviews all dealer KYC and mandi registrations before grant of access.
              </p>
            </div>

            {/* Application Summary Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-md mx-auto text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Application ID:</span>
                <span className="font-bold text-white">{submittedData.applicationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dealership:</span>
                <span className="text-slate-300 font-sans">{submittedData.dealershipName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Proprietor:</span>
                <span className="text-slate-300 font-sans">{submittedData.name}</span>
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

            {/* Next Steps info */}
            <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-800/60 max-w-md mx-auto text-left text-xs text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Next Verification Steps:</span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                1. BFEL administration in Indore will review your dealership documents.
                <br />
                2. You will receive an SMS activation notification upon approval.
                <br />
                3. You can test immediate approval right now using the <strong>Admin User Management</strong> desk.
              </p>
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
          /* Dealer Signup Form */
          <div className="p-6 sm:p-10 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono mb-1">
                <Building2 className="w-4 h-4" />
                <span>DEALER ONBOARDING</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Create your dealer account
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Fill in your registered business information. Applications are vetted by BFEL Operations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Personal Details */}
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
                    placeholder="e.g. Ramesh Patel"
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
                      placeholder="9826041290"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  {errors.phone && <p className="text-rose-400 text-[11px] mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh.patel@patelagro.in"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Dealership / Agency Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dealershipName}
                    onChange={(e) => setDealershipName(e.target.value)}
                    placeholder="e.g. Patel Agro Agency"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                  {errors.dealershipName && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.dealershipName}</p>
                  )}
                </div>
              </div>

              {/* Business Location & GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Business Address <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shop 14-16, Mandi Parisar"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                  {errors.address && <p className="text-rose-400 text-[11px] mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="23AABCP8921M1Z4"
                    className="w-full px-3 py-2 font-mono uppercase rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    City <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    District <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Pincode <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 font-mono rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                  {errors.pincode && <p className="text-rose-400 text-[11px] mt-1">{errors.pincode}</p>}
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Preferred Delivery Location (Unloading Godown)
                  </label>
                  <input
                    type="text"
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    placeholder="e.g. Dewas Mandi Yard, MP"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Security Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Create Password <span className="text-amber-500">*</span>
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

              {/* Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-400">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                  />
                  <span className="text-[11px] leading-tight">
                    I agree to BFEL Flow&apos;s dealer terms, advance payment verification guidelines, and data
                    usage policy.
                  </span>
                </label>
                {errors.terms && <p className="text-rose-400 text-[11px] mt-1">{errors.terms}</p>}
              </div>

              {/* Submit CTA */}
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
                  <span>Create Dealer Account</span>
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
