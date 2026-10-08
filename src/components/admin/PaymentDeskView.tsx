import React, { useState } from 'react';
import { useApp, formatINR } from '../../context/AppContext';
import { PaymentRecord, PaymentStatus } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { MetricCard } from '../common/MetricCard';
import { PaymentDetailDrawer } from './PaymentDetailDrawer';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileText,
  Filter,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface PaymentDeskViewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
  defaultStatus?: string;
}

export const PaymentDeskView: React.FC<PaymentDeskViewProps> = ({
  onNavigateToTab,
  defaultStatus = 'all',
}) => {
  const { payments } = useApp();
  const [activeTab, setActiveTab] = useState<string>(defaultStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const pendingPayments = payments.filter((p) => p.status === 'pending_verification');
  const verifiedPayments = payments.filter((p) => p.status === 'verified');
  const rejectedPayments = payments.filter((p) => p.status === 'rejected');

  const pendingValue = pendingPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const verifiedValue = verifiedPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const filteredPayments = payments.filter((p) => {
    // Tab filter
    if (activeTab === 'pending' && p.status !== 'pending_verification') return false;
    if (activeTab === 'verified' && p.status !== 'verified') return false;
    if (activeTab === 'rejected' && p.status !== 'rejected') return false;

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchId = p.id.toLowerCase().includes(q);
      const matchOrder = p.orderId.toLowerCase().includes(q);
      const matchUtr = p.utr.toLowerCase().includes(q);
      const matchAgency = p.dealerAgency.toLowerCase().includes(q);
      const matchDealer = p.dealerName.toLowerCase().includes(q);
      if (!matchId && !matchOrder && !matchUtr && !matchAgency && !matchDealer) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Finance', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Payment Verification' },
        ]}
        title="Advance Payment Verification Desk"
        subtitle="Review and verify RTGS/NEFT payment remittances before plant gate pass & loading clearance."
        badge={{ text: `${pendingPayments.length} Pending Review`, variant: pendingPayments.length > 0 ? 'amber' : 'slate' }}
      />

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Pending Verification"
          value={pendingPayments.length}
          subtext={`Value: ${formatINR(pendingValue)}`}
          indicatorColor={pendingPayments.length > 0 ? 'amber' : 'slate'}
        />
        <MetricCard
          label="Verified Remittances"
          value={verifiedPayments.length}
          subtext={`Total Cleared: ${formatINR(verifiedValue)}`}
          indicatorColor="emerald"
        />
        <MetricCard
          label="Rejected Submissions"
          value={rejectedPayments.length}
          subtext="Returned to dealers"
          indicatorColor={rejectedPayments.length > 0 ? 'rose' : 'slate'}
        />
        <MetricCard
          label="Total Remittance Volume"
          value={formatINR(pendingValue + verifiedValue)}
          subtext="Processed in ledger"
          indicatorColor="blue"
        />
      </div>

      {/* Tabs and Search Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Segmented Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {[
            { id: 'all', label: `All (${payments.length})` },
            { id: 'pending', label: `Pending (${pendingPayments.length})` },
            { id: 'verified', label: `Verified (${verifiedPayments.length})` },
            { id: 'rejected', label: `Rejected (${rejectedPayments.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search UTR, Order ID, Dealer..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Payment ID &amp; Date</th>
                <th className="py-3 px-4">Order Reference</th>
                <th className="py-3 px-4">Dealership Consignee</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Mode &amp; Bank UTR</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No pending payment verifications</p>
                    <p className="text-xs mt-1">All submitted payments have been reviewed.</p>
                    {activeTab !== 'verified' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('verified')}
                        className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                      >
                        View verified payments
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPayment(p)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                        {p.id}
                      </div>
                      <div className="text-[10px] text-slate-400">{p.submittedAt}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {p.orderId}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{p.dealerAgency}</div>
                      <div className="text-[10px] text-slate-400">{p.dealerName}</div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {formatINR(p.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400">Advance remittance</div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-800 dark:text-slate-200 uppercase">{p.utr}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{p.mode} · SBI RTGS</div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      {p.status === 'pending_verification' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayment(p);
                          }}
                          className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] cursor-pointer shadow-xs transition-colors"
                        >
                          Verify →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayment(p);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] cursor-pointer transition-colors"
                        >
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right-Side Payment Detail Drawer */}
      <PaymentDetailDrawer
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
};
