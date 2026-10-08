import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Wallet, CheckCircle2, ArrowRight } from 'lucide-react';

export const DistributorRequestPage: React.FC = () => {
  const { requestDistributorAccess, navigateTo } = useAuth();

  const [contactPerson, setContactPerson] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Indore');
  const [state, setState] = useState('Madhya Pradesh');
  const [relationshipCode, setRelationshipCode] = useState('');

  const [submittedData, setSubmittedData] = useState<{
    applicationId: string;
    submittedDate: string;
    companyName: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPerson.trim() || !companyName.trim() || phone.length < 10) {
      alert('Please fill all required business fields.');
      return;
    }

    const res = requestDistributorAccess({
      contactPerson,
      companyName,
      phone,
      email,
      gstin,
      address,
      district,
      state,
      relationshipCode,
    });

    setSubmittedData({
      applicationId: res.applicationId,
      submittedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      companyName,
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
          <span className="text-xs font-mono text-indigo-400">Master Stockist Track</span>
        </div>

        {submittedData ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                Access Request Logged
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Distributor access request pending review
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Distributor credit allocation and warehouse quotas require commercial approval by BFEL Executive Management.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-md mx-auto text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Request ID:</span>
                <span className="font-bold text-white">{submittedData.applicationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Company:</span>
                <span className="text-slate-300 font-sans">{submittedData.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted Date:</span>
                <span className="text-slate-400">{submittedData.submittedDate}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-900">
                <span className="text-slate-500">Status:</span>
                <span className="text-amber-400 font-bold">Pending Review</span>
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
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono mb-1">
                <Wallet className="w-4 h-4" />
                <span>DISTRIBUTOR ONBOARDING REQUEST</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Request distributor access
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Distributor accounts manage revolving digital wallet credit lines and multi-district bag allocations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Contact Person Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Sanjay Maheshwari"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Company / Distributor Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Malwa Agri Feeds Pvt Ltd"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Mobile Number <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9827033412"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sanjay@malwaagrifeeds.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">GSTIN</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="23AABCM4412L1Z9"
                    className="w-full px-3 py-2 font-mono uppercase rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Business / Warehouse Address
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Warehouse Complex, Sanwer Road Industrial Area"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Existing BFEL Relationship / Distributor Code (if any)
                  </label>
                  <input
                    type="text"
                    value={relationshipCode}
                    onChange={(e) => setRelationshipCode(e.target.value)}
                    placeholder="e.g. DIST-IND-01 or Prior Mandi Reference"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
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
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
                >
                  <span>Submit Access Request</span>
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
