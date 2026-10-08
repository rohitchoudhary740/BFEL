import React, { useState } from 'react';
import { useApp, formatINR } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { PaymentDetailDrawer } from './PaymentDetailDrawer';
import { ClaimDetailDrawer } from './ClaimDetailDrawer';
import { VehicleDetailDrawer } from './VehicleDetailDrawer';
import { UserDetailDrawer } from './UserDetailDrawer';
import {
  CreditCard,
  Truck,
  AlertCircle,
  Users,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { PaymentRecord, Claim, Vehicle, PendingSignup } from '../../types';

interface NeedsAttentionViewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
}

export const NeedsAttentionView: React.FC<NeedsAttentionViewProps> = ({ onNavigateToTab }) => {
  const { payments, vehicles, orders, claims, pendingSignups } = useApp();

  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedSignup, setSelectedSignup] = useState<PendingSignup | null>(null);

  const pendingPayments = payments.filter((p) => p.status === 'pending_verification');
  const waitingTrucks = vehicles.filter((v) => v.status === 'queued' || v.status === 'available');
  const pendingClaims = claims.filter((c) => c.status === 'under_review' || c.status === 'submitted');
  const onboardingSignups = pendingSignups.filter((s) => s.status === 'pending');

  const totalActionable =
    pendingPayments.length +
    waitingTrucks.length +
    pendingClaims.length +
    onboardingSignups.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Operations', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Needs Attention' },
        ]}
        title="Plant Operations Action Center"
        subtitle="Critical cross-departmental bottlenecks requiring immediate management authorization or clearance."
        badge={{
          text: `${totalActionable} Actionable Items`,
          variant: totalActionable > 0 ? 'amber' : 'emerald',
        }}
      />

      {/* KPI Action Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
        <div
          onClick={() => onNavigateToTab?.('payments')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-amber-500 transition-colors cursor-pointer space-y-1"
        >
          <div className="flex justify-between items-center text-slate-500">
            <span className="font-medium">Payment Verifications</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {pendingPayments.length}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">Blocking bay loading</span>
        </div>

        <div
          onClick={() => onNavigateToTab?.('loading')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-500 transition-colors cursor-pointer space-y-1"
        >
          <div className="flex justify-between items-center text-slate-500">
            <span className="font-medium">Trucks in Staging</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {waitingTrucks.length}
          </div>
          <span className="text-[11px] text-blue-600 font-medium">Awaiting bay assign</span>
        </div>

        <div
          onClick={() => onNavigateToTab?.('claims')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-rose-500 transition-colors cursor-pointer space-y-1"
        >
          <div className="flex justify-between items-center text-slate-500">
            <span className="font-medium">Shortage Claims</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {pendingClaims.length}
          </div>
          <span className="text-[11px] text-rose-600 font-medium">Credit Note required</span>
        </div>

        <div
          onClick={() => onNavigateToTab?.('users')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-emerald-500 transition-colors cursor-pointer space-y-1"
        >
          <div className="flex justify-between items-center text-slate-500">
            <span className="font-medium">Pending Onboarding</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {onboardingSignups.length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Dealer / Agent vetting</span>
        </div>
      </div>

      {/* Structured Operational Action Center Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Direct Action Queue ({totalActionable})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operational items ordered by severity and turnaround SLA.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Auto-refreshed from factory DMS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Category</th>
                <th className="py-2.5 px-3.5">Problem / Details</th>
                <th className="py-2.5 px-3.5">Age / SLA</th>
                <th className="py-2.5 px-3.5">Owner Desk</th>
                <th className="py-2.5 px-3.5">Priority</th>
                <th className="py-2.5 px-3.5 text-right">Direct Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* 1. Payment Verification Items */}
              {pendingPayments.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                      <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                      Payment Verification
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {p.dealerAgency} · {formatINR(p.amount)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Order: {p.orderId} · Bank UTR: {p.utr} ({p.mode})
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      Waiting {18 + idx * 7} min
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                    Accounts Desk
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      Critical
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      onClick={() => setSelectedPayment(p)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}

              {/* 2. Staging Trucks Waiting */}
              {waitingTrucks.map((v, idx) => (
                <tr key={v.registrationNumber} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                      <Truck className="w-3.5 h-3.5 text-blue-500" />
                      Staging Truck
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {v.registrationNumber} ({v.capacity.replace('_', ' ')})
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans">
                      Driver: {v.driverName} ({v.driverPhone}) · Ready for tare tare scale
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      Waiting {25 + idx * 12} min
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                    Loading Bay Supervisor
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      High
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      onClick={() => setSelectedVehicle(v)}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                    >
                      Assign Bay
                    </button>
                  </td>
                </tr>
              ))}

              {/* 3. Shortage Claims */}
              {pendingClaims.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      Shortage Claim
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {c.dealerAgency} · Shortage: {c.shortageQuantityBags} Bags ({c.shortageWeightKg} kg)
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Claim ID: {c.id} · Ref Order: {c.orderId}
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      Logged {c.submittedDate}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                    Claims Desk
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                      Action Required
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      onClick={() => setSelectedClaim(c)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                    >
                      Audit Claim
                    </button>
                  </td>
                </tr>
              ))}

              {/* 4. Onboarding Users */}
              {onboardingSignups.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      User Onboarding
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {s.name} ({s.dealershipName})
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans">
                      Requested Role: {s.requestedRole.toUpperCase()} · Territory: {s.territory}
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      Applied {s.appliedDate}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                    Central Admin
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Review
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      onClick={() => setSelectedSignup(s)}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connected Detail Drawers */}
      {selectedPayment && (
        <PaymentDetailDrawer
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {selectedClaim && (
        <ClaimDetailDrawer
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
        />
      )}

      {selectedVehicle && (
        <VehicleDetailDrawer
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}

      {selectedSignup && (
        <UserDetailDrawer
          signup={selectedSignup}
          onClose={() => setSelectedSignup(null)}
        />
      )}
    </div>
  );
};
