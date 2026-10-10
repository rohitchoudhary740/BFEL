import React, { useState } from 'react';
import { useApp, formatINR, formatLakhs, bagsToMT } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { OrderTimeline } from '../common/OrderTimeline';
import { PlaceFeedOrderWizard } from '../admin/PlaceFeedOrderWizard';
import { DeliveryTrackingView } from '../admin/DeliveryTrackingView';
import { OperationalMap } from '../../design-system/OperationalMap';
import {
  PlusCircle,
  Truck,
  CreditCard,
  AlertCircle,
  Package,
  Calendar,
  ChevronRight,
  FileText,
  RotateCcw,
  ShieldCheck,
  Building,
  CheckCircle,
} from 'lucide-react';

interface DealerDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DealerDashboard: React.FC<DealerDashboardProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentUser,
    orders,
    payments,
    claims,
    products,
    openModal,
  } = useApp();

  const [selectedOrderForTimeline, setSelectedOrderForTimeline] = useState<string>(orders[0]?.id || 'BFEL-2026-8491');

  // Filter orders for this dealer (or show all in prototype)
  const dealerOrders = orders;
  const activeOrdersCount = dealerOrders.filter((o) => o.status !== 'delivered').length;
  const inTransitOrders = dealerOrders.filter((o) => o.status === 'dispatched');

  const pendingPaymentOrders = dealerOrders.filter((o) => o.status === 'order_placed' || o.status === 'payment_submitted');
  const totalPendingAmount = pendingPaymentOrders.reduce((sum, o) => sum + (o.advancePayable - o.advancePaid), 0);

  const currentSelectedOrder = dealerOrders.find((o) => o.id === selectedOrderForTimeline) || dealerOrders[0];

  if (activeTab === 'place_order') {
    return (
      <PlaceFeedOrderWizard
        onNavigateToTab={setActiveTab}
        onOrderCompleted={() => setActiveTab('orders')}
      />
    );
  }

  if (activeTab === 'tracking') {
    return (
      <DeliveryTrackingView
        onNavigateToTab={setActiveTab}
        onOpenOrder={() => setActiveTab('orders')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Dealer Info */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
              Authorized Tier-1 Dealer
            </span>
            <span className="text-xs text-slate-500 font-mono">ID: DL-IND-049</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {currentUser.entityName}
          </h1>
          <p className="text-xs text-slate-500">
            Proprietor: {currentUser.name} · {currentUser.location} · Contact: {currentUser.phone}
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal('dealer_order_capture')}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-md cursor-pointer transition-all text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Place Feed Order</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Available Balance"
          value="₹4,20,000"
          subtext="Wallet credit ready"
          indicatorColor="emerald"
        />
        <MetricCard
          label="Pending Advance Payment"
          value={formatINR(totalPendingAmount)}
          subtext={`${pendingPaymentOrders.length} order(s) pending`}
          indicatorColor="amber"
          actionButton={
            totalPendingAmount > 0
              ? {
                  label: 'Pay Now',
                  onClick: () =>
                    openModal('dealer_payment', {
                      orderId: pendingPaymentOrders[0]?.id,
                      amount: pendingPaymentOrders[0]?.advancePayable,
                    }),
                }
              : undefined
          }
        />
        <MetricCard
          label="Active Plant Orders"
          value={activeOrdersCount}
          subtext="In loading & queue"
          indicatorColor="blue"
        />
        <MetricCard
          label="In Transit (Trucks)"
          value={inTransitOrders.length}
          subtext="En route to Dewas"
          indicatorColor="slate"
        />
      </div>

      {/* Main Tabbed Sections */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Active Order Lifecycle Spotlight */}
          {currentSelectedOrder && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Live Delivery Tracker
                    </span>
                    <StatusBadge status={currentSelectedOrder.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    Order {currentSelectedOrder.id} · {currentSelectedOrder.items[0]?.productName}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {currentSelectedOrder.status === 'order_placed' && (
                    <button
                      onClick={() =>
                        openModal('dealer_payment', {
                          orderId: currentSelectedOrder.id,
                          amount: currentSelectedOrder.advancePayable,
                        })
                      }
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                    >
                      Submit Advance Payment
                    </button>
                  )}

                  {currentSelectedOrder.gatePassId && (
                    <button
                      onClick={() => openModal('gate_pass', { orderId: currentSelectedOrder.id })}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Gate Pass</span>
                    </button>
                  )}

                  {currentSelectedOrder.lrNumber && (
                    <button
                      onClick={() => openModal('lr_challan', { orderId: currentSelectedOrder.id })}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>LR / Challan</span>
                    </button>
                  )}

                  {currentSelectedOrder.status === 'dispatched' && (
                    <button
                      onClick={() => openModal('whatsapp_alert', { orderId: currentSelectedOrder.id })}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <span>WhatsApp Alert</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Order Info Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px]">Load &amp; Truck</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {currentSelectedOrder.totalBags} Bags ({currentSelectedOrder.totalWeightMT} MT)
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Assigned Vehicle</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {currentSelectedOrder.assignedVehicle || 'Assigned on payment'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Driver Contact</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentSelectedOrder.assignedDriver || 'Manglia Terminal Pool'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Total Order Value</span>
                  <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatINR(currentSelectedOrder.netTotal)}
                  </p>
                </div>
              </div>

              {/* Visual Order Timeline */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Plant Operations Timeline
                </span>
                <OrderTimeline status={currentSelectedOrder.status} />
              </div>

              {/* Geographic Consignment Route Schematic (Phase 3.2) */}
              <div className="pt-2">
                <OperationalMap
                  role="dealer"
                  title="Consignment Transit Route (Manglia Mill to Dewas Godown)"
                  subtitle="Authoritative highway logistics corridor between BFEL Indore Plant and registered mandi godown."
                  selectedMarkerId="shipment-dewas-transit"
                  showLayersControl={false}
                  showViewToggle={false}
                  allowSearch={false}
                  height="340px"
                />
              </div>
            </div>
          )}

          {/* Recent Orders Table */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Orders Ledger
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
              >
                View All Orders
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Truck</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dealerOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrderForTimeline(o.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                        selectedOrderForTimeline === o.id ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {o.id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{o.date.split(' ')[0]}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {o.items[0]?.productName}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {o.totalBags} bags ({o.totalWeightMT} MT)
                      </td>
                      <td className="py-2.5 px-3 font-mono">{o.assignedVehicle || o.truckCapacity}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">{formatINR(o.netTotal)}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={o.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {o.status === 'delivered' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('dealer_claim', { orderId: o.id, expectedBags: o.totalBags });
                            }}
                            className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                          >
                            Report Shortage
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderForTimeline(o.id);
                            }}
                            className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                          >
                            Track
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              All Orders &amp; Dispatches
            </h2>
            <button
              onClick={() => openModal('dealer_order_capture')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Order</span>
            </button>
          </div>

          <div className="space-y-4">
            {dealerOrders.map((o) => (
              <div
                key={o.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {o.id}
                    </span>
                    <StatusBadge status={o.status} size="sm" />
                    <span className="text-slate-400 text-xs">· Placed on {o.date}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {o.status === 'order_placed' && (
                      <button
                        onClick={() =>
                          openModal('dealer_payment', {
                            orderId: o.id,
                            amount: o.advancePayable,
                          })
                        }
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded cursor-pointer"
                      >
                        Submit Advance Payment
                      </button>
                    )}
                    {o.gatePassId && (
                      <button
                        onClick={() => openModal('gate_pass', { orderId: o.id })}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        View Gate Pass
                      </button>
                    )}
                    {o.lrNumber && (
                      <button
                        onClick={() => openModal('lr_challan', { orderId: o.id })}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        View LR
                      </button>
                    )}
                    {o.status === 'delivered' && (
                      <button
                        onClick={() =>
                          openModal('dealer_claim', { orderId: o.id, expectedBags: o.totalBags })
                        }
                        className="text-rose-600 hover:underline font-semibold"
                      >
                        Report Shortage
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Product</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {o.items[0]?.productName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Bag Count &amp; Weight</span>
                    <p className="font-mono font-bold">
                      {o.totalBags} Bags ({o.totalWeightMT} MT)
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Truck Capacity</span>
                    <p className="font-medium">{o.truckCapacity.replace('_', ' ')} Dedicated</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Net Invoice Value</span>
                    <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatINR(o.netTotal)}
                    </p>
                  </div>
                </div>

                {/* Embedded Timeline */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <OrderTimeline status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Advance Payments &amp; UTR Submissions
            </h2>
            <button
              onClick={() => openModal('dealer_payment', { amount: 556000 })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Submit Payment UTR</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Payment ID</th>
                  <th className="p-3">Order Ref</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Bank UTR</th>
                  <th className="p-3">Remitting Bank</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Submitted At</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{p.id}</td>
                    <td className="p-3 font-mono">{p.orderId}</td>
                    <td className="p-3 font-mono font-semibold">{p.mode}</td>
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {p.utr}
                    </td>
                    <td className="p-3 text-slate-500">{p.bankName}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(p.amount)}
                    </td>
                    <td className="p-3 text-slate-400">{p.submittedAt}</td>
                    <td className="p-3">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Claims Tab */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Shortage &amp; Quality Claims Desk
            </h2>
            <button
              onClick={() => openModal('dealer_claim', { orderId: 'BFEL-2026-8485', expectedBags: 400 })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Report Shortage</span>
            </button>
          </div>

          <div className="space-y-3">
            {claims.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {c.id}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                    <span className="text-slate-400">· Order: {c.orderId}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">{c.submittedDate}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                  <div>
                    <span className="text-slate-400 text-[10px]">Nature</span>
                    <p className="font-bold uppercase text-rose-700 dark:text-rose-300">
                      {c.claimType.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Expected vs Received</span>
                    <p className="font-mono font-bold">
                      {c.expectedQuantityBags} exp / {c.receivedQuantityBags} rec
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Shortage Bags &amp; Wt</span>
                    <p className="font-mono font-bold text-rose-600">
                      {c.shortageQuantityBags} Bags ({c.shortageWeightKg} kg)
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Credit Note Status</span>
                    <p className="font-mono font-bold text-emerald-600">
                      {c.creditNoteId ? `${c.creditNoteId} (${formatINR(c.creditNoteAmount || 0)})` : 'Under Plant Audit'}
                    </p>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Catalog Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            BFEL Cattle Feed Product Catalog &amp; Rate Master
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                      {p.category} · {p.sku}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {p.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-white">
                      {formatINR(p.pricePerBag)}
                    </div>
                    <span className="text-[10px] text-slate-400">per 50 kg HDPE Bag</span>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{p.description}</p>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Crude Protein</span>
                    <strong className="text-slate-900 dark:text-white">{p.proteinPercent}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Crude Fat</span>
                    <strong className="text-slate-900 dark:text-white">{p.fatPercent}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Plant Stock</span>
                    <strong className="text-emerald-600">{p.stockAvailableBags} bags</strong>
                  </div>
                </div>

                <button
                  onClick={() => openModal('dealer_order_capture')}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Order 20 MT / 25 MT Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
