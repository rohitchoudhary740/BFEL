import React, { useState } from 'react';
import { useApp, formatINR, formatLakhs, bagsToMT } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { PageHeader } from '../common/PageHeader';
import { PlaceFeedOrderWizard } from '../admin/PlaceFeedOrderWizard';
import { OrderDetailDrawer } from '../admin/OrderDetailDrawer';
import { OperationalMap } from '../../design-system/OperationalMap';
import { Order } from '../../types';
import {
  MapPin,
  Users,
  ShoppingCart,
  Calendar,
  PlusCircle,
  Camera,
  CheckCircle2,
  Clock,
  WifiOff,
  RefreshCw,
  Search,
  Building,
  Phone,
  BarChart3,
  CreditCard,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

interface SalesAgentDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const SalesAgentDashboard: React.FC<SalesAgentDashboardProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentUser,
    visits,
    orders,
    payments,
    openModal,
    showToast,
    isOfflineMode,
    setIsOfflineMode,
    pendingSyncCount,
    syncOfflineQueue,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const totalSalesValue = orders.reduce((sum, o) => sum + o.netTotal, 0);

  const assignedDealers = [
    { id: 'dl-1', agency: 'Patel Agro Agency', town: 'Dewas Mandi Yard', contact: 'Ramesh Patel', phone: '+91 98260 41290', balance: '₹0 (Clear)', stock: '64 bags', lastVisit: 'Today 09:15 AM' },
    { id: 'dl-2', agency: 'Nimar Kisan Kendra', town: 'Khargone Main Depot', contact: 'Kishore Mandloi', phone: '+91 94250 88219', balance: '₹0 (Clear)', stock: '120 bags', lastVisit: 'Yesterday' },
    { id: 'dl-3', agency: 'Malwa Pashu Aahar', town: 'Sanwer By-pass', contact: 'Omprakash Joshi', phone: '+91 98930 77140', balance: '₹84,000 due', stock: '28 bags', lastVisit: '2 days ago' },
    { id: 'dl-4', agency: 'Choudhary Kisan Kendra', town: 'Ujjain Rural', contact: 'Gopal Choudhary', phone: '+91 94250 99120', balance: '₹0 (Clear)', stock: '18 bags', lastVisit: '3 days ago' },
  ];

  // 1. CREATE ORDER WORKSPACE
  if (activeTab === 'create_order' || activeTab === 'place_order') {
    return (
      <PlaceFeedOrderWizard
        onNavigateToTab={setActiveTab}
        onOrderCompleted={() => setActiveTab('overview')}
      />
    );
  }

  // 2. MY DEALERS WORKSPACE
  if (activeTab === 'dealers') {
    const filteredDealers = assignedDealers.filter(
      (d) =>
        d.agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.town.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Sales Force', onClick: () => setActiveTab('overview') },
            { label: 'My Assigned Dealerships' },
          ]}
          title="Field Territory Dealership Directory"
          subtitle="Authorized rural dealerships, observed godown stock levels, and field order booking."
          action={
            <button
              onClick={() => openModal('dealer_visit')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs"
            >
              <MapPin className="w-4 h-4" />
              <span>+ Check In at Dealer</span>
            </button>
          }
        />

        {/* Territory Dealership Geographic Map (Phase 3.2) */}
        <OperationalMap
          role="sales_agent"
          title="Assigned Territory Dealership Map"
          subtitle="Field territory coverage across Dewas, Khargone, Sanwer, and Ujjain mandi yards."
          height="380px"
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-3">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search dealership, proprietor, town..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <span className="font-mono text-xs text-slate-400">
              {filteredDealers.length} assigned dealerships
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 text-xs">
            {filteredDealers.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{d.agency}</h4>
                    <div className="text-[11px] text-slate-500 mt-0.5">{d.town} · Contact: {d.contact}</div>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                    {d.stock} in godown
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400">Account Balance</span>
                    <p className="font-semibold text-slate-900 dark:text-white">{d.balance}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Last GPS Field Visit</span>
                    <p className="font-mono text-emerald-600 font-semibold">{d.lastVisit}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openModal('dealer_visit')}
                    className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-center cursor-pointer"
                  >
                    Check In
                  </button>
                  <button
                    onClick={() => setActiveTab('create_order')}
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-center cursor-pointer"
                  >
                    + Book 20 MT Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. DEALER VISITS WORKSPACE
  if (activeTab === 'visits') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Sales Force', onClick: () => setActiveTab('overview') },
            { label: 'Dealer Field Visits' },
          ]}
          title="GPS Field Visits &amp; Godown Audits Ledger"
          subtitle="Real-time geo-tagged dealer visits, physical stock counts, and retailer observations."
          action={
            <button
              onClick={() => openModal('dealer_visit')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs"
            >
              <MapPin className="w-4 h-4" />
              <span>+ Record New Field Visit</span>
            </button>
          }
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-3">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Field Visit Ledger ({visits.length})
            </h3>
            <span className="font-mono text-xs text-slate-400">Malwa Operational Territory</span>
          </div>

          <div className="p-4 space-y-3">
            {visits.map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{v.dealerAgency}</h4>
                    <span className="text-slate-500 font-sans text-[11px]">{v.dealerContact}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> GPS Tagged &amp; Verified
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{v.visitTime}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 font-sans block text-[10px]">Physical Stock Count</span>
                    <strong className="text-slate-900 dark:text-white">{v.currentStockBags} Bags in Godown</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans block text-[10px]">Coordinates</span>
                    <strong className="text-slate-700 dark:text-slate-300">{v.gpsCoordinates}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans block text-[10px]">Sync Status</span>
                    <strong className={v.isSynced ? 'text-emerald-600' : 'text-amber-600'}>
                      {v.isSynced ? 'Synced to Plant DMS' : 'Queued offline'}
                    </strong>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {v.notes}
                </p>

                {/* Field Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400">Agent: {currentUser.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openModal('dealer_visit')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded text-[11px] cursor-pointer"
                    >
                      Record Visit
                    </button>
                    <button
                      onClick={() => showToast(`Godown audited: ${v.currentStockBags} bags verified at ${v.dealerAgency}.`, 'info')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded text-[11px] cursor-pointer"
                    >
                      Check Stock
                    </button>
                    <button
                      onClick={() => {
                        showToast(`WhatsApp payment reminder generated for ${v.dealerAgency}.`, 'success');
                        openModal('whatsapp_alert', { orderId: 'BFEL-2026-8488' });
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold rounded text-[11px] cursor-pointer"
                    >
                      Payment Reminder
                    </button>
                    <button
                      onClick={() => setActiveTab('create_order')}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px] cursor-pointer shadow-xs"
                    >
                      Create Order →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. ORDER FOLLOW-UPS WORKSPACE
  if (activeTab === 'followups') {
    const followupOrders = orders.filter((o) => o.status === 'order_placed' || o.status === 'payment_submitted');

    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Sales Force', onClick: () => setActiveTab('overview') },
            { label: 'Order Follow-ups' },
          ]}
          title="Active Order Follow-ups &amp; Payment Nudges"
          subtitle="Track orders pending advance payment submission or plant loading clearances."
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-3">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Orders Requiring Follow-up ({followupOrders.length})
            </h3>
            <span className="text-xs text-amber-600 font-semibold font-mono">
              Action Required
            </span>
          </div>

          <div className="p-4 space-y-3">
            {followupOrders.map((o) => (
              <div
                key={o.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{o.id}</span>
                    <StatusBadge status={o.status} size="sm" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{o.dealerAgency}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">Placed on {o.date}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 font-sans block text-[10px]">Product</span>
                    <strong className="text-slate-800 dark:text-slate-200">{o.items[0]?.productName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans block text-[10px]">Load Size</span>
                    <strong>{o.totalBags} bags ({o.totalWeightMT} MT)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans block text-[10px]">Advance Due</span>
                    <strong className="text-amber-600">{formatINR(o.advancePayable)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans block text-[10px]">Destination</span>
                    <strong className="text-slate-700 dark:text-slate-300 font-sans">{o.destination}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      showToast(`WhatsApp payment reminder link copied for ${o.dealerAgency}.`, 'success');
                      openModal('whatsapp_alert', { orderId: o.id });
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Nudge</span>
                  </button>
                  <button
                    onClick={() => setSelectedOrder(o)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Inspect Order
                  </button>
                </div>
              </div>
            ))}
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

  // 5. COLLECTIONS WORKSPACE
  if (activeTab === 'collections') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Sales Force', onClick: () => setActiveTab('overview') },
            { label: 'Collections Ledger' },
          ]}
          title="Territory Payment Collections &amp; UTR Register"
          subtitle="Reconciled advance payments received from territory dealers and verified at Central Plant."
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Territory Remittances ({payments.length})
            </h3>
            <span className="font-mono text-xs text-slate-400">100% Banking Channel</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Payment ID</th>
                  <th className="py-2.5 px-3">Dealer Agency</th>
                  <th className="py-2.5 px-3">Order Ref</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Bank UTR</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{p.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{p.dealerAgency}</td>
                    <td className="py-2.5 px-3 font-mono">{p.orderId}</td>
                    <td className="py-2.5 px-3 font-mono">{p.mode}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{p.utr}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{formatINR(p.amount)}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={p.status} size="sm" />
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

  // 6. TERRITORY ACTIVITY WORKSPACE
  if (activeTab === 'territory') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Sales Force', onClick: () => setActiveTab('overview') },
            { label: 'Territory Activity' },
          ]}
          title="Malwa Region Territory Performance &amp; Quota"
          subtitle="Monthly sales targets, town-by-town consignment output, and active factory incentive schemes."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              Town-by-Town Dispatch Volume (MT)
            </h3>
            <div className="space-y-3">
              {[
                { town: 'Dewas Mandi & Rural Belt', mt: 140, target: 160, percent: 87 },
                { town: 'Sanwer Industrial Area', mt: 80, target: 100, percent: 80 },
                { town: 'Indore Rural & Outskirts', mt: 120, target: 150, percent: 80 },
                { town: 'Khargone Nimar Hub', mt: 60, target: 90, percent: 66 },
              ].map((t, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-800 dark:text-slate-200">{t.town}</span>
                    <span className="font-mono text-slate-500">{t.mt} / {t.target} MT ({t.percent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${t.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
            <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[10px]">
              Active Plant Volume Schemes
            </span>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700/60 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Volume Slab: 400+ Bags</span>
                <span className="text-emerald-600 font-mono">₹30/bag off</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Applicable on all 20 MT &amp; 25 MT dedicated truck loads. Automatically deducted at order review.
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700/60 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Cash Advance Discount</span>
                <span className="text-emerald-600 font-mono">₹15/bag rebate</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Credited to dealer ledger upon same-day RTGS verification before 1:00 PM loading window.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT: SALES OVERVIEW HUB
  return (
    <div className="space-y-6">
      {/* Territory Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] uppercase tracking-wider border border-amber-300 dark:border-amber-800">
              Field Sales Force · Malwa Belt
            </span>
            <span className="text-xs text-slate-500 font-mono">Agent: AGT-MAL-02</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {currentUser.name}
          </h1>
          <p className="text-xs text-slate-500">
            {(currentUser as any).organization || currentUser.entityName || 'BFEL Field Sales - Malwa Region'} · Covering: Indore Rural, Dewas, Sanwer, Ujjain Outskirts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Offline indicator & sync trigger */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                isOfflineMode
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {isOfflineMode && <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOfflineMode ? 'Offline Mode' : 'Online Mode'}</span>
            </button>

            {isOfflineMode && (
              <button
                onClick={syncOfflineQueue}
                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1 cursor-pointer animate-pulse"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync Now ({pendingSyncCount})</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setActiveTab('create_order')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-md cursor-pointer text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Order</span>
          </button>
          <button
            onClick={() => openModal('dealer_visit')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md cursor-pointer text-xs"
          >
            <MapPin className="w-4 h-4" />
            <span>Check In at Dealer</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('visits')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Today's Field Visits"
            value={visits.length}
            subtext="2 Dewas · 1 Sanwer"
            indicatorColor="emerald"
            actionButton={{
              label: 'Visits →',
              onClick: () => setActiveTab('visits'),
            }}
          />
        </div>
        <div
          onClick={() => setActiveTab('dealers')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Orders Booked Today"
            value={orders.length}
            subtext="400 MT booked"
            indicatorColor="blue"
          />
        </div>
        <div
          onClick={() => setActiveTab('territory')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Territory Sales Value"
            value={formatLakhs(totalSalesValue)}
            subtext="Oct Target: ₹45.00L"
            indicatorColor="amber"
          />
        </div>
        <div
          onClick={() => setActiveTab('collections')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Dealer Collections"
            value="₹18.24L"
            subtext="Verified at Plant"
            indicatorColor="slate"
          />
        </div>
      </div>

      {/* Visits & Territory Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Visits Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                GPS Dealer Visits Ledger
              </h3>
              <button
                onClick={() => openModal('dealer_visit')}
                className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                + Record New Visit
              </button>
            </div>

            <div className="space-y-3">
              {visits.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">{v.dealerAgency}</h4>
                      <div className="text-[11px] text-slate-500">{v.dealerContact}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> GPS Verified
                      </span>
                      <div className="font-mono text-[10px] text-slate-400">{v.visitTime}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-400">Physical Stock Count</span>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {v.currentStockBags} Bags in Godown
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">GPS Coordinates</span>
                      <p className="font-mono text-slate-700 dark:text-slate-300">
                        {v.gpsCoordinates}
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {v.notes}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400">
                      Sync status: {v.isSynced ? 'Synced with Central Plant' : 'Queued in offline cache'}
                    </span>
                    <button
                      onClick={() => setActiveTab('create_order')}
                      className="text-amber-600 dark:text-amber-400 font-bold text-[11px] hover:underline cursor-pointer"
                    >
                      Book 20 MT / 25 MT Order →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dealers Directory & Schemes (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Malwa Authorized Dealers
              </h3>
              <button
                onClick={() => setActiveTab('dealers')}
                className="text-xs text-amber-500 font-bold hover:underline"
              >
                View All →
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {assignedDealers.slice(0, 3).map((d, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{d.agency}</h4>
                      <span className="text-slate-400 text-[11px]">{d.town} · {d.contact}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-amber-600">{d.stock}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Balance: {d.balance}</span>
                    <button
                      onClick={() => setActiveTab('create_order')}
                      className="text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                      + Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Schemes Panel */}
          <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[10px]">
              Active Plant Volume Schemes
            </span>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700/60 space-y-1">
              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Volume Slab: 400+ Bags</span>
                <span className="text-emerald-600 font-mono">₹30/bag off</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Applicable on all 20 MT &amp; 25 MT dedicated truck loads. Automatically deducted at order review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
