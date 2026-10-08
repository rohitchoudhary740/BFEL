import React from 'react';
import { useApp, formatINR, formatLakhs, bagsToMT } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import {
  Building,
  PlusCircle,
  ShoppingCart,
  Truck,
  CreditCard,
  AlertCircle,
  ArrowRight,
  Package,
} from 'lucide-react';

interface DealerOverviewPreviewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
  onOpenOrder?: (orderId: string) => void;
}

export const DealerOverviewPreview: React.FC<DealerOverviewPreviewProps> = ({
  onNavigateToTab,
  onOpenOrder,
}) => {
  const { orders, wallet, payments, claims, openModal } = useApp();

  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const inTransitOrders = orders.filter((o) => o.status === 'dispatched');
  const pendingPayments = payments.filter((p) => p.status === 'pending_verification');

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Network', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Dealer Portal Overview' },
        ]}
        title="Patel Agro Agency — Dealer Command View"
        subtitle="Consignee: Ramesh Patel · Dewas Mandi Yard, MP · GSTIN: 23AACCP1048K1Z4"
        badge={{ text: 'Verified Dealer', variant: 'emerald' }}
        primaryAction={{
          label: '+ Place Feed Order',
          icon: PlusCircle,
          onClick: () => onNavigateToTab ? onNavigateToTab('place_order') : openModal('dealer_order_capture'),
          variant: 'primary',
        }}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Available Wallet Credit"
          value={formatINR(wallet.availableBalance)}
          subtext={`Credit Limit: ${formatINR(wallet.creditLimit)}`}
          indicatorColor="emerald"
        />
        <MetricCard
          label="Pending Remittances"
          value={pendingPayments.length}
          subtext="Under accounts review"
          indicatorColor={pendingPayments.length > 0 ? 'amber' : 'slate'}
          actionButton={{
            label: 'View',
            onClick: () => onNavigateToTab?.('payments'),
          }}
        />
        <MetricCard
          label="Active Feed Orders"
          value={activeOrders.length}
          subtext="In factory pipeline"
          indicatorColor="blue"
          actionButton={{
            label: 'Orders',
            onClick: () => onNavigateToTab?.('orders'),
          }}
        />
        <MetricCard
          label="Consignments In Transit"
          value={inTransitOrders.length}
          subtext="En route to Dewas"
          indicatorColor="emerald"
          actionButton={{
            label: 'Track',
            onClick: () => onNavigateToTab?.('tracking'),
          }}
        />
      </div>

      {/* Recent Orders List */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-amber-500" />
            <span>Recent Consignments Placed</span>
          </h3>
          <button
            onClick={() => onNavigateToTab?.('orders')}
            className="text-amber-500 font-bold hover:underline"
          >
            View All ({orders.length}) →
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {orders.slice(0, 4).map((o) => (
            <div
              key={o.id}
              onClick={() => onOpenOrder ? onOpenOrder(o.id) : onNavigateToTab?.('orders', { orderId: o.id })}
              className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg px-2 transition-colors cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{o.id}</span>
                  <StatusBadge status={o.status} size="sm" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {o.items[0]?.productName || 'BFEL Dudh Dhara 50kg'} · {o.totalBags} bags ({bagsToMT(o.totalBags)} MT)
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-extrabold text-slate-900 dark:text-white">{formatINR(o.netTotal)}</div>
                <div className="text-[10px] text-slate-400">{o.destination}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
