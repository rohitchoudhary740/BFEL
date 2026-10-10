import React, { useState } from 'react';
import { User, PendingSignup } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { X, CheckCircle2, AlertOctagon, Building, Phone, Mail, MapPin, Shield, Calendar } from 'lucide-react';

interface UserDetailDrawerProps {
  user?: User | null;
  signup?: PendingSignup | null;
  onClose: () => void;
}

export const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({ user: propUser, signup, onClose }) => {
  const { approveUser, rejectUser, suspendUser, activateUser } = useAuth();
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const user: User | null = propUser || (signup ? {
    id: signup.id,
    name: signup.name,
    email: signup.email,
    phone: signup.phone,
    role: signup.requestedRole,
    status: (signup.status === 'approved' ? 'active' : signup.status) as any,
    organization: signup.dealershipName,
    territory: signup.territory,
    permissions: [],
    createdAt: signup.appliedDate,
    applicationId: signup.id,
  } : null);

  if (!user) return null;

  const handleApprove = () => {
    approveUser(user.id);
    onClose();
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert('Please state a reason for rejecting this application.');
      return;
    }
    rejectUser(user.id, rejectReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col animate-slideLeft">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                User Onboarding Vetting
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                  user.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : user.status === 'pending'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {user.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {user.organization || user.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Identity Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
              Personal &amp; Contact Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Contact Person</span>
                <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Target Role</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 inline-block">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Mobile Number</span>
                <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  +91 {user.phone}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Email</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 break-all">{user.email}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Applied Date</span>
                <p className="font-mono text-slate-600 dark:text-slate-400">{user.createdAt}</p>
              </div>
              {user.applicationId && (
                <div>
                  <span className="text-slate-400 text-[10px] block">Application ID</span>
                  <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {user.applicationId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Business & Location Info */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
              Business Information &amp; Territory
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Entity / Firm Name</span>
                <p className="font-bold text-slate-900 dark:text-white">{user.organization}</p>
              </div>
              {user.gstin && (
                <div>
                  <span className="text-slate-400 text-[10px] block">GSTIN Number</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{user.gstin}</p>
                </div>
              )}
              {user.address && (
                <div>
                  <span className="text-slate-400 text-[10px] block">Premises Address</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{user.address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 text-[10px] block">District &amp; State</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {user.district || user.city || user.territory}, {user.state || 'MP'}
                  </p>
                </div>
                {user.pincode && (
                  <div>
                    <span className="text-slate-400 text-[10px] block">Postal PIN</span>
                    <p className="font-mono text-slate-800 dark:text-slate-200">{user.pincode}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rejection input box if triggered */}
          {isRejecting && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-2.5 animate-fadeIn">
              <label className="block text-xs font-bold text-rose-800 dark:text-rose-200">
                Reason for Application Rejection <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. GSTIN verification failed or territory already saturated."
                className="w-full p-2.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

          {/* Rejection notice if already rejected */}
          {user.status === 'rejected' && user.rejectionReason && (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
              <span className="font-bold block">Rejection Reason on Record:</span>
              <p className="mt-0.5">{user.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
          {user.status === 'pending' ? (
            <>
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 min-h-[44px] text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Account</span>
              </button>
            </>
          ) : user.status === 'active' ? (
            <div className="w-full flex items-center justify-between gap-3">
              <span className="text-emerald-600 font-semibold flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-4 h-4" /> Active Account
              </span>
              <button
                type="button"
                onClick={() => {
                  suspendUser(user.id, 'Administrative suspension');
                  onClose();
                }}
                className="px-4 py-2.5 min-h-[44px] text-xs text-rose-600 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                Suspend Account
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <span className="text-slate-500 font-mono text-xs">Status: {user.status.toUpperCase()}</span>
              <button
                type="button"
                onClick={() => {
                  activateUser(user.id);
                  onClose();
                }}
                className="px-4 py-2.5 min-h-[44px] text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Reactivate Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
