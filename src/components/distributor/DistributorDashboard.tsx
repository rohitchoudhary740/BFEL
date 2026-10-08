import React, { useState } from 'react';
import { useApp, formatINR, formatLakhs, bagsToMT } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { PageHeader } from '../common/PageHeader';
import { OrderDetailDrawer } from '../admin/OrderDetailDrawer';
import { PlaceFeedOrderWizard } from '../admin/PlaceFeedOrderWizard';
import { Order } from '../../types';
import {
  Wallet,
  Layers,
  ShoppingCart,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Package,
  CheckCircle,
  PlusCircle,
  Users,
  AlertCircle,
  Search,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface DistributorDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DistributorDashboard: React.FC<DistributorDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, wallet, allocations, orders, claims, openModal, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [depositUtr, setDepositUtr] = useState('');
  const [depositAmount, setDepositAmount] = useState('500000');
  const [showDepositModal, setShowDepositModal] = useState(false);

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.dealerAgency.toLowerCase().includes(q) ||
      o.destination.toLowerCase().includes(q)
    );
  });

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositUtr.trim()) {
      showToast('Please enter bank UTR reference number.', 'error');
      return;
    }
    showToast(`Advance payment remittance of ${formatINR(Number(depositAmount))} submitted for verification.`, 'success');
    setShowDepositModal(false);
    setDepositUtr('');
  };

  // 1. PLACE / CREATE ORDER WORKSPACE
  if (activeTab === 'create_order' || activeTab === 'place_order') {
    return (
      <PlaceFeedOrderWizard
        onNavigateToTab={setActiveTab}
        onOrderCompleted={() => setActiveTab('orders')}
      />
    );
  }

  // 2. CREDIT & WALLET WORKSPACE
  if (activeTab === 'wallet') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Distributor Hub', onClick: () => setActiveTab('overview') },
            { label: 'Credit & Wallet Management' },
          ]}
          title="Digital Distributor Wallet & Revolving Credit Ledger"
          subtitle="Real-time liquid ledger, approved credit line headroom, and advance deposit clearance."
          action={
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md transition-all"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Deposit Advance / Submit UTR</span>
            </button>
          }
        />

        {/* Financial Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <MetricCard
            label="Available Balance"
            value={formatINR(wallet.availableBalance)}
            subtext="Liquid funds ready for orders"
            indicatorColor="emerald"
          />
          <MetricCard
            label="Reserved Funds"
            value={formatINR(wallet.reservedFunds)}
            subtext="Blocked for active trucks"
            indicatorColor="amber"
          />
          <MetricCard
            label="Credit Limit"
            value={formatINR(wallet.creditLimit)}
            subtext="Approved revolving line"
            indicatorColor="blue"
          />
          <MetricCard
            label="Used Credit"
            value={formatINR(wallet.creditLimit - wallet.availableCredit)}
            subtext={`${wallet.creditUtilizationPercent}% utilized`}
            indicatorColor="slate"
          />
          <MetricCard
            label="Available Credit"
            value={formatINR(wallet.availableCredit)}
            subtext="Headroom for new orders"
            indicatorColor="emerald"
          />
        </div>

        {/* Restrained Credit Line Utilization Bar */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">Revolving Credit Line Utilization</span>
              <span className="text-[11px] font-mono text-slate-500">
                ({formatINR(wallet.creditLimit - wallet.availableCredit)} of {formatINR(wallet.creditLimit)})
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-slate-500">Headroom:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatINR(wallet.availableCredit)} available</strong>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                wallet.creditUtilizationPercent > 80
                  ? 'bg-rose-500'
                  : wallet.creditUtilizationPercent > 60
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, wallet.creditUtilizationPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>0% (₹0)</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
              {wallet.creditUtilizationPercent}% Utilized
            </span>
            <span>100% ({formatINR(wallet.creditLimit)})</span>
          </div>
        </div>

        {/* Credit Note / Revolving Terms Notice */}
        <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <strong className="text-blue-900 dark:text-blue-200 block">
                Standard 30-Day Revolving Terms Active
              </strong>
              <span className="text-slate-600 dark:text-slate-400">
                Governed by Madhya Pradesh Mandi Board credit standards. Automatic credit release upon Plant gate clearance.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            Add Working Capital
          </button>
        </div>

        {/* Wallet Transactions Ledger */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-3">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Wallet Transaction &amp; Settlement Ledger
              </h3>
              <p className="text-[11px] text-slate-500">Live debit and credit entries with bank reconciliation stamps.</p>
            </div>
            <span className="font-mono text-xs text-slate-400">
              {wallet.transactions.length} recorded entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Ref ID</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Debit (-₹)</th>
                  <th className="py-2.5 px-3 text-right">Credit (+₹)</th>
                  <th className="py-2.5 px-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {wallet.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{tx.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{tx.reference}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{tx.description}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                        tx.type === 'advance_deposit'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : tx.type === 'credit_note'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-rose-600 font-semibold">
                      {tx.debit > 0 ? `-${formatINR(tx.debit)}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-600 font-semibold">
                      {tx.credit > 0 ? `+${formatINR(tx.credit)}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right font-bold text-slate-900 dark:text-white">
                      {formatINR(tx.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deposit Advance Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Deposit Working Capital / Submit Advance UTR
                </h3>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deposit Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-sm"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Equivalent to ~350-400 bags working capital credit</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Remittance Mode
                  </label>
                  <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs">
                    <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                    <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                    <option value="IMPS">IMPS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bank UTR Reference Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN84910284729"
                    value={depositUtr}
                    onChange={(e) => setDepositUtr(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-sm uppercase"
                    required
                  />
                  <span className="text-[10px] text-slate-400">12 or 16 character bank reference number</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Remitting Bank Name
                  </label>
                  <input
                    type="text"
                    defaultValue="State Bank of India - Commercial Branch Indore"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(false)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                  >
                    Submit UTR for Verification
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. STOCK ALLOCATIONS WORKSPACE
  if (activeTab === 'stock' || activeTab === 'allocations') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Distributor Hub', onClick: () => setActiveTab('overview') },
            { label: 'Stock Allocations' },
          ]}
          title="Factory Product Allocations & Quota Management"
          subtitle="Central plant monthly volume reservations and current inventory drawdown."
          action={
            <button
              onClick={() => showToast('Quota expansion request sent to Central Operations Desk.', 'success')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Request Quota Increase</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allocations.map((a) => {
            const utilization = Math.round((a.reservedBags / a.allocatedBags) * 100);
            return (
              <div
                key={a.productId}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                      Product Allocation Quota
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {a.productName}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    50 kg Bags
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Total Allocated</span>
                    <strong className="text-slate-900 dark:text-white text-sm">{a.allocatedBags} bags</strong>
                    <div className="text-[10px] text-slate-400 font-sans">{bagsToMT(a.allocatedBags)} MT</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Reserved in Trucks</span>
                    <strong className="text-amber-600 text-sm">{a.reservedBags} bags</strong>
                    <div className="text-[10px] text-slate-400 font-sans">{bagsToMT(a.reservedBags)} MT</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Available to Book</span>
                    <strong className="text-emerald-600 text-sm">{a.availableBags} bags</strong>
                    <div className="text-[10px] text-slate-400 font-sans">{bagsToMT(a.availableBags)} MT</div>
                  </div>
                </div>

                {/* Quota Drawdown Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <span>Quota Drawdown</span>
                    <span>{utilization}% consumed</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        utilization > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('create_order')}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Allocate to Dealer Order →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. DISPATCHES & LRS WORKSPACE
  if (activeTab === 'dispatches' || activeTab === 'dispatch') {
    const dispatchedList = orders.filter((o) => o.status === 'dispatched' || o.status === 'delivered');
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Distributor Hub', onClick: () => setActiveTab('overview') },
            { label: 'Dispatches & LRs' },
          ]}
          title="Consignment Dispatches & Lorry Receipts (LR)"
          subtitle="Plant gate pass clearances, weighbridge verified MT weight, and transit tracking."
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Cleared Plant Dispatches ({dispatchedList.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Indore Manglia Plant Gate</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Order Ref</th>
                  <th className="py-2.5 px-3">Consignee Dealer</th>
                  <th className="py-2.5 px-3">LR Number</th>
                  <th className="py-2.5 px-3">Vehicle / Driver</th>
                  <th className="py-2.5 px-3">Bags / Net MT</th>
                  <th className="py-2.5 px-3">Security Seal</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dispatchedList.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{o.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{o.dealerAgency}</div>
                      <div className="text-[10px] text-slate-400">{o.destination}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {o.lrNumber || 'LR-Pending'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{o.assignedVehicle}</div>
                      <div className="text-[10px] text-slate-400">{o.assignedDriver}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {o.totalBags} bags ({o.totalWeightMT} MT)
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {o.sealNumber || 'BFEL-SEAL-89421'}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={o.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openModal('lr_challan', { orderId: o.id })}
                          className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold hover:bg-blue-100 cursor-pointer"
                        >
                          View LR
                        </button>
                        <button
                          onClick={() => openModal('gate_pass', { orderId: o.id })}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-semibold hover:bg-slate-200 cursor-pointer"
                        >
                          Gate Pass
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 5. CLAIMS CENTER WORKSPACE
  if (activeTab === 'claims') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Distributor Hub', onClick: () => setActiveTab('overview') },
            { label: 'Claims Center' },
          ]}
          title="Distributor Claims &amp; Shortage Credit Resolution"
          subtitle="Transit shortages, bag tearing compensation, and wallet credit note settlements."
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-3">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Territory Claims Ledger ({claims.length})
            </h3>
            <span className="font-mono text-xs text-slate-400">Resolution SLA: 24h</span>
          </div>

          <div className="p-4 space-y-3">
            {claims.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{c.id}</span>
                    <StatusBadge status={c.status} size="sm" />
                    <span className="text-slate-500 font-sans">· Consignee: {c.dealerAgency}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">Submitted {c.submittedDate}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] font-sans block">Order Ref</span>
                    <strong className="text-slate-800 dark:text-slate-200">{c.orderId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-sans block">Shortage Reported</span>
                    <strong className="text-rose-600">{c.shortageQuantityBags} Bags ({c.shortageWeightKg} kg)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-sans block">Claim Nature</span>
                    <strong className="text-slate-800 dark:text-slate-200 uppercase">{c.claimType.replace('_', ' ')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-sans block">Credit Note</span>
                    <strong className="text-emerald-600">
                      {c.creditNoteId ? `${c.creditNoteId} (${formatINR(c.creditNoteAmount || 0)})` : 'Pending Plant Clearance'}
                    </strong>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-[11px]">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 6. DEALER NETWORK WORKSPACE
  if (activeTab === 'dealers') {
    const networkDealers = [
      { id: 'dl-1', agency: 'Patel Agro Agency', town: 'Dewas Mandi Yard', contact: 'Ramesh Patel', phone: '+91 98260 41290', balance: '₹0 (Clear)', stock: '64 bags' },
      { id: 'dl-2', agency: 'Nimar Kisan Kendra', town: 'Khargone Main Depot', contact: 'Kishore Mandloi', phone: '+91 94250 88219', balance: '₹0 (Clear)', stock: '120 bags' },
      { id: 'dl-3', agency: 'Malwa Pashu Aahar', town: 'Sanwer By-pass', contact: 'Omprakash Joshi', phone: '+91 98930 77140', balance: '₹84,000 due', stock: '28 bags' },
      { id: 'dl-4', agency: 'Choudhary Kisan Kendra', town: 'Ujjain Rural', contact: 'Gopal Choudhary', phone: '+91 94250 99120', balance: '₹0 (Clear)', stock: '18 bags' },
    ];

    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Distributor Hub', onClick: () => setActiveTab('overview') },
            { label: 'Dealer Network' },
          ]}
          title="Distributor Retail Dealer Network"
          subtitle="Authorized dealer dealerships, godown inventory levels, and direct order capture."
          action={
            <button
              onClick={() => setActiveTab('create_order')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Book Dealer Order</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {networkDealers.map((d) => (
            <div
              key={d.id}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{d.agency}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">{d.town} · Contact: {d.contact} ({d.phone})</div>
                </div>
                <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                  {d.stock} in godown
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400">Payment Balance: <strong className="text-slate-900 dark:text-white">{d.balance}</strong></span>
                <span className="text-emerald-600 font-semibold font-mono">Active Tier-1</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('create_order')}
                  className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg cursor-pointer text-center"
                >
                  + Create 20 MT / 25 MT Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 7. ORDERS WORKSPACE
  if (activeTab === 'orders') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Distributor Hub', onClick: () => setActiveTab('overview') },
            { label: 'All Orders' },
          ]}
          title="Distributor Consignment Orders Ledger"
          subtitle="Consolidated 20 MT & 25 MT factory orders, loading progress, and gate pass release."
          action={
            <button
              onClick={() => setActiveTab('create_order')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create Consignment</span>
            </button>
          }
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-3">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Order ID, Dealer, Destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <span className="font-mono text-xs text-slate-500">
              Showing {filteredOrders.length} orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Dealer Agency</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Bags / MT</th>
                  <th className="py-2.5 px-3">Truck Capacity</th>
                  <th className="py-2.5 px-3">Invoice Value</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{o.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{o.dealerAgency}</div>
                      <div className="text-[10px] text-slate-400">{o.destination}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {o.items[0]?.productName || 'BFEL Dudh Dhara 50kg'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {o.totalBags} bags ({bagsToMT(o.totalBags)} MT)
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      {o.truckCapacity.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(o.netTotal)}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={o.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-semibold text-[11px] cursor-pointer transition-colors"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedOrder && (
          <OrderDetailDrawer
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>
    );
  }

  // DEFAULT: DISTRIBUTOR OVERVIEW HUB
  return (
    <div className="space-y-6">
      {/* Distributor Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-bold text-[10px] uppercase tracking-wider border border-indigo-300 dark:border-indigo-800">
              Master Stockist &amp; Distributor
            </span>
            <span className="text-xs text-slate-500 font-mono">HUB: IND-CENTRAL-01</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {(currentUser as any).organization || currentUser.entityName || 'Malwa Agri Feeds Pvt Ltd'}
          </h1>
          <p className="text-xs text-slate-500">
            Managing Director: {currentUser.name} · Sanwer Road Industrial Area, Indore · Contact: {currentUser.phone}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('create_order')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-md cursor-pointer text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Order</span>
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md cursor-pointer text-xs"
          >
            <Wallet className="w-4 h-4" />
            <span>Manage Wallet</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('wallet')}
          className="cursor-pointer group hover:scale-[1.01] transition-transform"
        >
          <MetricCard
            label="Available Balance"
            value={formatINR(wallet.availableBalance)}
            subtext="Liquid funds"
            indicatorColor="emerald"
            actionButton={{
              label: 'Wallet →',
              onClick: () => setActiveTab('wallet'),
            }}
          />
        </div>
        <div
          onClick={() => setActiveTab('wallet')}
          className="cursor-pointer group hover:scale-[1.01] transition-transform"
        >
          <MetricCard
            label="Reserved Funds"
            value={formatINR(wallet.reservedFunds)}
            subtext="Blocked for active trucks"
            indicatorColor="amber"
          />
        </div>
        <div
          onClick={() => setActiveTab('wallet')}
          className="cursor-pointer group hover:scale-[1.01] transition-transform"
        >
          <MetricCard
            label="Credit Limit"
            value={formatINR(wallet.creditLimit)}
            subtext="Approved revolving limit"
            indicatorColor="blue"
          />
        </div>
        <div
          onClick={() => setActiveTab('wallet')}
          className="cursor-pointer group hover:scale-[1.01] transition-transform"
        >
          <MetricCard
            label="Used Credit"
            value={formatINR(wallet.creditLimit - wallet.availableCredit)}
            subtext={`${wallet.creditUtilizationPercent}% utilized`}
            indicatorColor="slate"
          />
        </div>
        <div
          onClick={() => setActiveTab('wallet')}
          className="cursor-pointer group hover:scale-[1.01] transition-transform"
        >
          <MetricCard
            label="Available Credit"
            value={formatINR(wallet.availableCredit)}
            subtext="Remaining headroom"
            indicatorColor="emerald"
          />
        </div>
      </div>

      {/* Fast Action Launchpads */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => setActiveTab('orders')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 text-left transition-colors cursor-pointer space-y-1 shadow-2xs"
        >
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <ShoppingCart className="w-4 h-4 text-blue-500" />
            <span>Orders Ledger</span>
          </div>
          <p className="text-[11px] text-slate-400">{orders.length} active consignments</p>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 text-left transition-colors cursor-pointer space-y-1 shadow-2xs"
        >
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Stock Allocations</span>
          </div>
          <p className="text-[11px] text-slate-400">4 product formulas</p>
        </button>

        <button
          onClick={() => setActiveTab('dispatches')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 text-left transition-colors cursor-pointer space-y-1 shadow-2xs"
        >
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Truck className="w-4 h-4 text-emerald-500" />
            <span>Dispatches &amp; LRs</span>
          </div>
          <p className="text-[11px] text-slate-400">Plant gate passes</p>
        </button>

        <button
          onClick={() => setActiveTab('dealers')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 text-left transition-colors cursor-pointer space-y-1 shadow-2xs"
        >
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Users className="w-4 h-4 text-amber-500" />
            <span>Dealer Network</span>
          </div>
          <p className="text-[11px] text-slate-400">4 regional dealerships</p>
        </button>
      </div>

      {/* Embedded Live Orders Table Preview */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Recent Consignment Orders
            </h3>
            <p className="text-[11px] text-slate-500">Live operational status across finance, loading bays, and gate dispatch.</p>
          </div>
          <button
            onClick={() => setActiveTab('orders')}
            className="text-amber-500 font-bold hover:underline"
          >
            Open Full Orders Ledger ({orders.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Dealer Agency</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Bags / Weight</th>
                <th className="py-2.5 px-3">Truck</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.slice(0, 4).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{o.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{o.dealerAgency}</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{o.items[0]?.productName || 'BFEL Dudh Dhara 50kg'}</td>
                  <td className="py-2.5 px-3 font-mono">{o.totalBags} bags ({bagsToMT(o.totalBags)} MT)</td>
                  <td className="py-2.5 px-3 font-mono">{o.assignedVehicle || o.truckCapacity}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={o.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-semibold text-[11px] cursor-pointer transition-colors"
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};
