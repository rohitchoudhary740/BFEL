import React, { useState } from 'react';
import { useApp, formatINR, formatLakhs } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { PageHeader } from '../common/PageHeader';
import { PaymentDetailDrawer } from '../admin/PaymentDetailDrawer';
import { PaymentRecord } from '../../types';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ArrowRight,
  FileText,
  Search,
  Building,
  Scale,
  History,
  AlertTriangle,
  RefreshCw,
  Download,
} from 'lucide-react';

interface AccountsDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const AccountsDashboard: React.FC<AccountsDashboardProps> = ({
  activeTab = 'overview',
  setActiveTab,
}) => {
  const { payments, auditLogs, openModal, showToast } = useApp();

  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const pendingPayments = payments.filter((p) => p.status === 'pending_verification');
  const verifiedPayments = payments.filter((p) => p.status === 'verified');
  const rejectedPayments = payments.filter((p) => p.status === 'rejected');

  const pendingValue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const verifiedTodayValue = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

  const currentTab = activeTab;

  // 1. PAYMENT VERIFICATION DESK WORKSPACE
  if (currentTab === 'payments') {
    const tableFiltered = payments
      .filter((p) => {
        if (filter === 'pending') return p.status === 'pending_verification';
        if (filter === 'verified') return p.status === 'verified';
        if (filter === 'rejected') return p.status === 'rejected';
        return true;
      })
      .filter((p) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          p.utr.toLowerCase().includes(q) ||
          p.dealerAgency.toLowerCase().includes(q) ||
          p.orderId.toLowerCase().includes(q)
        );
      });

    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Accounts Desk', onClick: () => setActiveTab?.('overview') },
            { label: 'Payment Verification Desk' },
          ]}
          title="Central Payment Verification &amp; Release Desk"
          subtitle="Match RTGS / NEFT bank credits, inspect payment slips, and release orders to plant loading bays."
          action={
            pendingPayments.length > 0 ? (
              <button
                onClick={() => setSelectedPayment(pendingPayments[0])}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md transition-all"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Verify Next Pending ({pendingPayments.length})</span>
              </button>
            ) : undefined
          }
        />

        {/* Filter & Metric Strip */}
        <div className="flex flex-wrap gap-2 text-xs border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Remittances ({payments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
              filter === 'pending'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
            }`}
          >
            Pending Verification ({pendingPayments.length})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
              filter === 'verified'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            Verified Today ({verifiedPayments.length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
              filter === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
            }`}
          >
            Rejected ({rejectedPayments.length})
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-3">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search UTR, Dealer, Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <span className="font-mono text-xs text-slate-400">
              {tableFiltered.length} records matching
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Order Ref</th>
                  <th className="py-2.5 px-3">Dealer Agency</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Bank UTR</th>
                  <th className="py-2.5 px-3">Bank Name</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tableFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          No pending payment verifications
                        </h4>
                        <p className="text-xs text-slate-500">
                          All submitted payments have been reviewed.
                        </p>
                        {filter !== 'verified' && (
                          <button
                            type="button"
                            onClick={() => setFilter('verified')}
                            className="mt-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            View verified payments
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  tableFiltered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{p.orderId}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{p.dealerAgency}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{p.mode}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {p.utr}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{p.bankName}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{p.submittedAt}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className={`px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                            p.status === 'pending_verification'
                              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {p.status === 'pending_verification' ? 'Review & Verify →' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedPayment && (
          <PaymentDetailDrawer
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
          />
        )}
      </div>
    );
  }

  // 2. BANK RECONCILIATION WORKSPACE
  if (currentTab === 'reconciliation') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Accounts Desk', onClick: () => setActiveTab?.('overview') },
            { label: 'Bank Statement Reconciliation' },
          ]}
          title="Bank Statement Automated Reconciliation"
          subtitle="State Bank of India (Indore Commercial Branch, A/C: 38491028419) real-time feed."
          action={
            <button
              onClick={() => showToast('Statement matched! 100% records reconciled with SBI Indore Commercial account.', 'success')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Fetch Live Statement</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-xs">Total Reconciled Credits</span>
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">₹34,80,000</div>
            <span className="text-[10px] text-emerald-600">6 transactions verified</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-xs">Unmatched Inward Credits</span>
            <div className="text-xl font-mono font-bold text-emerald-600 mt-1">₹0.00</div>
            <span className="text-[10px] text-slate-500">Zero pending discrepancy</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-xs">Reconciliation Score</span>
            <div className="text-xl font-mono font-bold text-blue-600 mt-1">99.4%</div>
            <span className="text-[10px] text-slate-500">Mandi standard audit compliant</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
            Daily Bank Statement Feed (SBI Commercial)
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="p-3">Value Date</th>
                <th className="p-3">Bank UTR / Narration</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Credit (₹)</th>
                <th className="p-3">ERP Order Match</th>
                <th className="p-3">Match Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="p-3 font-mono text-slate-500">2026-10-02</td>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {p.utr} / {p.bankName}
                  </td>
                  <td className="p-3 font-mono">{p.mode}</td>
                  <td className="p-3 font-mono font-bold text-emerald-600">{formatINR(p.amount)}</td>
                  <td className="p-3 font-mono font-bold text-blue-600">{p.orderId}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      MATCHED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 3. VERIFIED PAYMENTS WORKSPACE
  if (currentTab === 'verified') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Accounts Desk', onClick: () => setActiveTab?.('overview') },
            { label: 'Verified Payments' },
          ]}
          title="Verified Remittances &amp; Loading Clearances Log"
          subtitle="Payments approved by Finance and released to Plant Loading Bays."
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Dealer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Bank UTR</th>
                <th className="p-3">Verified By</th>
                <th className="p-3">Cleared To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {verifiedPayments.map((p) => (
                <tr key={p.id}>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{p.orderId}</td>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{p.dealerAgency}</td>
                  <td className="p-3 font-mono font-bold text-emerald-600">{formatINR(p.amount)}</td>
                  <td className="p-3 font-mono font-bold">{p.utr}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{p.verifiedBy || 'Sunita Jain (Accounts)'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-blue-100 text-blue-800">
                      Plant Bay Clearance Granted
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 4. REJECTED PAYMENTS WORKSPACE
  if (currentTab === 'rejected') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Accounts Desk', onClick: () => setActiveTab?.('overview') },
            { label: 'Rejected Payments' },
          ]}
          title="Rejected Remittances &amp; Bounced UTRs"
          subtitle="Payments failing bank verification or amount mismatch, requiring dealer re-submission."
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Dealer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Bank UTR</th>
                <th className="p-3">Rejection Reason</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rejectedPayments.map((p) => (
                <tr key={p.id}>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{p.orderId}</td>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{p.dealerAgency}</td>
                  <td className="p-3 font-mono font-bold text-rose-600">{formatINR(p.amount)}</td>
                  <td className="p-3 font-mono font-bold">{p.utr}</td>
                  <td className="p-3 text-rose-700 dark:text-rose-300 font-medium">
                    {p.rejectionReason || 'UTR not found in bank statement'}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => showToast(`Resubmission request sent to ${p.dealerAgency}.`, 'info')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold cursor-pointer"
                    >
                      Alert Dealer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. AUDIT TRAIL WORKSPACE
  if (currentTab === 'audit' || currentTab === 'audit_log') {
    const finAudits = auditLogs.filter(
      (a) => a.entity === 'Payment' || a.entity === 'Auth' || a.action.toLowerCase().includes('payment')
    );

    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Accounts Desk', onClick: () => setActiveTab?.('overview') },
            { label: 'Financial Audit Trail' },
          ]}
          title="Immutable Financial Audit Trail"
          subtitle="Cryptographically timestamped ledger of payment submissions, verifications, credit notes, and wallet releases."
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {finAudits.map((a) => (
                <tr key={a.id}>
                  <td className="p-3 font-mono text-slate-500">{a.timestamp}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{a.user}</td>
                  <td className="p-3 font-bold text-emerald-600">{a.action}</td>
                  <td className="p-3 font-mono">{a.reference}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{a.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // DEFAULT: ACCOUNTS OVERVIEW
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold text-[10px] uppercase tracking-wider border border-teal-300 dark:border-teal-800">
              Central Plant Finance Desk
            </span>
            <span className="text-xs text-slate-500 font-mono">Officer: Sunita Jain</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Payment Verification &amp; Plant Clearances
          </h1>
          <p className="text-xs text-slate-500">
            Real-time RTGS / NEFT / IMPS reconciliation for loading terminal release.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingPayments.length > 0 && (
            <button
              onClick={() => setSelectedPayment(pendingPayments[0])}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md cursor-pointer transition-all"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Verify Next Pending ({pendingPayments.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab?.('payments')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Pending Verification Value"
            value={formatINR(pendingValue)}
            subtext={`${pendingPayments.length} transactions in queue`}
            indicatorColor="amber"
            actionButton={{
              label: 'Verify Desk →',
              onClick: () => setActiveTab?.('payments'),
            }}
          />
        </div>
        <div
          onClick={() => setActiveTab?.('verified')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Verified Today"
            value={formatINR(verifiedTodayValue)}
            subtext={`${verifiedPayments.length} order(s) released to bay`}
            indicatorColor="emerald"
          />
        </div>
        <div
          onClick={() => setActiveTab?.('rejected')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Rejected Today"
            value={rejectedPayments.length}
            subtext="UTR mismatch or bounced"
            indicatorColor="rose"
          />
        </div>
        <div
          onClick={() => setActiveTab?.('reconciliation')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Bank Reconciliation"
            value="99.4%"
            subtext="SBI Indore Statement Matched"
            indicatorColor="blue"
          />
        </div>
      </div>

      {/* Pending Queue Highlight Desk */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-3">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Pending Remittances Queue ({pendingPayments.length})
            </h3>
          </div>
          <button
            onClick={() => setActiveTab?.('payments')}
            className="text-amber-500 font-bold hover:underline text-xs"
          >
            Open Full Desk →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Order Ref</th>
                <th className="py-2.5 px-3">Dealer Agency</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Bank UTR</th>
                <th className="py-2.5 px-3">Submitted</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{p.orderId}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{p.dealerAgency}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{formatINR(p.amount)}</td>
                  <td className="py-2.5 px-3 font-mono">{p.mode}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{p.utr}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{p.submittedAt}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedPayment(p)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs cursor-pointer shadow-xs"
                    >
                      Review &amp; Verify →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPayment && (
        <PaymentDetailDrawer
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};
