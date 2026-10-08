import React, { useState } from 'react';
import { useApp, formatINR, formatLakhs, bagsToMT } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { OrdersManagementView } from './OrdersManagementView';
import { PaymentDeskView } from './PaymentDeskView';
import { TruckLoadingPlannerView } from './TruckLoadingPlannerView';
import { LoadingTerminalView } from './LoadingTerminalView';
import { DispatchWorkspaceView } from './DispatchWorkspaceView';
import { DeliveryTrackingView } from './DeliveryTrackingView';
import { ClaimsDeskView } from './ClaimsDeskView';
import { FleetMasterView } from './FleetMasterView';
import { UserManagementView } from './UserManagementView';
import { ProductCatalogView } from './ProductCatalogView';
import { DealerOverviewPreview } from './DealerOverviewPreview';
import { AuditTrailView } from './AuditTrailView';
import { NeedsAttentionView } from './NeedsAttentionView';
import { PlaceFeedOrderWizard } from './PlaceFeedOrderWizard';
import { ReportsView } from './ReportsView';
import {
  ShieldAlert,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  FileCheck,
  CreditCard,
  Layers,
  History,
  UserCheck,
  Eye,
  Users,
  PlusCircle,
  Package,
  MapPin,
  FileText,
  AlertCircle,
  Building,
} from 'lucide-react';

interface AdminCommandCenterProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AdminCommandCenter: React.FC<AdminCommandCenterProps> = ({ activeTab, setActiveTab }) => {
  const {
    orders,
    payments,
    vehicles,
    claims,
    pendingSignups,
    openModal,
  } = useApp();

  const pendingPayments = payments.filter((p) => p.status === 'pending_verification');
  const loadingActiveOrders = orders.filter((o) => o.status === 'loading' || o.status === 'loading_planned');
  const dispatchedOrders = orders.filter((o) => o.status === 'dispatched' || o.status === 'delivered');
  const pendingClaims = claims.filter((c) => c.status === 'under_review' || c.status === 'submitted');
  const onboardingUsers = pendingSignups.filter((s) => s.status === 'pending');

  // Route to the dedicated workspace if not on command_center
  switch (activeTab) {
    case 'needs_attention':
      return <NeedsAttentionView onNavigateToTab={setActiveTab} />;
    case 'orders':
      return <OrdersManagementView onNavigateToTab={setActiveTab} />;
    case 'place_order':
      return <PlaceFeedOrderWizard onNavigateToTab={setActiveTab} onOrderCompleted={() => setActiveTab('orders')} />;
    case 'payment_desk':
    case 'payments':
      return <PaymentDeskView onNavigateToTab={setActiveTab} />;
    case 'loading':
      return <TruckLoadingPlannerView onNavigateToTab={setActiveTab} onOpenOrder={() => setActiveTab('orders')} />;
    case 'terminal':
      return <LoadingTerminalView onNavigateToTab={setActiveTab} />;
    case 'dispatches':
    case 'dispatch':
      return <DispatchWorkspaceView onNavigateToTab={setActiveTab} />;
    case 'tracking':
      return <DeliveryTrackingView onNavigateToTab={setActiveTab} onOpenOrder={() => setActiveTab('orders')} />;
    case 'claims':
      return <ClaimsDeskView onNavigateToTab={setActiveTab} />;
    case 'fleet':
    case 'vehicles':
      return <FleetMasterView onNavigateToTab={setActiveTab} onOpenOrder={() => setActiveTab('orders')} />;
    case 'users':
    case 'signups':
      return <UserManagementView />;
    case 'products':
    case 'catalog':
    case 'allocations':
      return <ProductCatalogView onNavigateToTab={setActiveTab} />;
    case 'reports':
      return <ReportsView onNavigateToTab={setActiveTab} />;
    case 'dealers':
    case 'dealer_overview':
      return <DealerOverviewPreview onNavigateToTab={setActiveTab} onOpenOrder={() => setActiveTab('orders')} />;
    case 'audit':
    case 'audit_log':
      return <AuditTrailView onNavigateToTab={setActiveTab} />;
    case 'command_center':
    case 'overview':
    default:
      // Render the main command center below
      break;
  }

  return (
    <div className="space-y-6">
      {/* Operations Command Center Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono text-[10px] uppercase tracking-wider border border-amber-500/30">
              CENTRAL OPERATIONS COMMAND
            </span>
            <span className="text-emerald-400 font-mono text-xs">● All Plant Terminals Active</span>
          </div>
          <h1 className="text-xl font-extrabold text-white mt-1">
            Plant Logistics &amp; Distribution Headquarters
          </h1>
          <p className="text-xs text-slate-400">
            Operations Director: Rajeshwar Sharma · Manglia Plant, Indore (M.P.)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('place_order')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Dispatch Order</span>
          </button>
        </div>
      </div>

      {/* Real-time Operations Clickable Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('orders')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Orders Today"
            value={orders.length}
            subtext="20 MT & 25 MT Trucks"
            indicatorColor="blue"
            actionButton={{
              label: 'View Orders →',
              onClick: () => setActiveTab('orders'),
            }}
          />
        </div>

        <div
          onClick={() => setActiveTab('payments')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Payment Desk Pending"
            value={pendingPayments.length}
            subtext="Requires verification"
            indicatorColor={pendingPayments.length > 0 ? 'amber' : 'slate'}
            actionButton={{
              label: 'Verify Desk →',
              onClick: () => setActiveTab('payments'),
            }}
          />
        </div>

        <div
          onClick={() => setActiveTab('loading')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Loading Active"
            value={loadingActiveOrders.length}
            subtext="Bay 1 & Bay 3 active"
            indicatorColor="emerald"
            actionButton={{
              label: 'Truck Planner →',
              onClick: () => setActiveTab('loading'),
            }}
          />
        </div>

        <div
          onClick={() => setActiveTab('dispatch')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Dispatches Cleared"
            value={dispatchedOrders.length}
            subtext="With LR & Gate Pass"
            indicatorColor="slate"
            actionButton={{
              label: 'Dispatch Log →',
              onClick: () => setActiveTab('dispatch'),
            }}
          />
        </div>

        <div
          onClick={() => setActiveTab('claims')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <MetricCard
            label="Claims Pending Review"
            value={pendingClaims.length}
            subtext="Shortage reports"
            indicatorColor={pendingClaims.length > 0 ? 'rose' : 'slate'}
            actionButton={{
              label: 'Claims Desk →',
              onClick: () => setActiveTab('claims'),
            }}
          />
        </div>
      </div>

      {/* Critical "Needs Attention" Panel — Operations Priority Alert Matrix */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Operations Priority Alert Matrix
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('needs_attention')}
            className="text-amber-500 font-bold hover:underline text-xs flex items-center gap-1 cursor-pointer"
          >
            <span>Open Priority Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {/* Item 1: Payment Verification */}
          <div
            onClick={() => setActiveTab('payments')}
            className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 hover:border-amber-500 hover:shadow-xs cursor-pointer transition-all"
          >
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase block tracking-wider">
              Payment Verification
            </span>
            <div className="text-xl font-mono font-black text-amber-900 dark:text-amber-200 my-0.5">
              {pendingPayments.length} Pending
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Click to verify in desk →</span>
          </div>

          {/* Item 2: Truck Queue */}
          <div
            onClick={() => setActiveTab('loading')}
            className="p-3.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 hover:border-blue-500 hover:shadow-xs cursor-pointer transition-all"
          >
            <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase block tracking-wider">
              Plant Truck Queue
            </span>
            <div className="text-xl font-mono font-black text-blue-900 dark:text-blue-200 my-0.5">
              {vehicles.filter((v) => v.status === 'queued' || v.status === 'available').length} Waiting
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">View Truck Planner →</span>
          </div>

          {/* Item 3: Loading Active */}
          <div
            onClick={() => setActiveTab('terminal')}
            className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 hover:border-emerald-500 hover:shadow-xs cursor-pointer transition-all"
          >
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block tracking-wider">
              Bay 3 Active Load
            </span>
            <div className="text-xl font-mono font-black text-emerald-900 dark:text-emerald-200 my-0.5">
              372 / 400 Bags
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Open Operator Terminal →</span>
          </div>

          {/* Item 4: Claims */}
          <div
            onClick={() => setActiveTab('claims')}
            className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30 hover:border-rose-500 hover:shadow-xs cursor-pointer transition-all"
          >
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase block tracking-wider">
              Shortage Claims
            </span>
            <div className="text-xl font-mono font-black text-rose-900 dark:text-rose-200 my-0.5">
              {pendingClaims.length} Actionable
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Review &amp; Credit Note →</span>
          </div>

          {/* Item 5: Partner Signups */}
          <div
            onClick={() => setActiveTab('users')}
            className="p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-500 hover:shadow-xs cursor-pointer transition-all"
          >
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block tracking-wider">
              Pending Signups
            </span>
            <div className="text-xl font-mono font-black text-slate-900 dark:text-white my-0.5">
              {onboardingUsers.length} Onboarding
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">Review applications →</span>
          </div>
        </div>
      </div>

      {/* Quick Launchpad to All Workspaces */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 text-left transition-colors cursor-pointer space-y-1 shadow-2xs"
        >
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>Orders Flow</span>
          </div>
          <p className="text-[11px] text-slate-400">All dealer consignments</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('loading')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 text-left transition-colors cursor-pointer space-y-1 shadow-2xs"
        >
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Truck className="w-4 h-4 text-amber-500" />
            <span>Truck Planner</span>
          </div>
          <p className="text-[11px] text-slate-400">Bay loading queue</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dispatch')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 text-left transition-colors cursor-pointer space-y-1 shadow-2xs"
        >
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>Dispatch &amp; LR</span>
          </div>
          <p className="text-[11px] text-slate-400">Gate pass clearance</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 text-left transition-colors cursor-pointer space-y-1 shadow-2xs"
        >
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <History className="w-4 h-4 text-slate-400" />
            <span>Audit Trail</span>
          </div>
          <p className="text-[11px] text-slate-400">Immutable audit logs</p>
        </button>
      </div>

      {/* Embedded Live Orders Table Preview */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Active Plant Consignments
            </h3>
            <p className="text-[11px] text-slate-500">Live operational status across finance, loading bays, and gate dispatch.</p>
          </div>
          <button
            onClick={() => setActiveTab('orders')}
            className="text-amber-500 font-bold hover:underline"
          >
            Open Full Orders Desk ({orders.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Consignee</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Bags / Weight</th>
                <th className="py-2.5 px-3">Truck</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{o.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{o.dealerAgency}</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{o.items[0]?.productName || 'BFEL Dudh Dhara 50kg'}</td>
                  <td className="py-2.5 px-3 font-mono">{o.totalBags} bags ({bagsToMT(o.totalBags)} MT)</td>
                  <td className="py-2.5 px-3 font-mono">{o.assignedVehicle || 'MP09AB1234'}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={o.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
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
    </div>
  );
};
