import React, { useState } from 'react';
import { useApp, formatINR, bagsToMT } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import {
  Search,
  Filter,
  PlusCircle,
  Truck,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface OrdersManagementViewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
}

export const OrdersManagementView: React.FC<OrdersManagementViewProps> = ({ onNavigateToTab }) => {
  const { orders, openModal } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [truckFilter, setTruckFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchAgency = o.dealerAgency.toLowerCase().includes(q);
      const matchDealer = o.dealerName.toLowerCase().includes(q);
      const matchVehicle = o.assignedVehicle && o.assignedVehicle.toLowerCase().includes(q);
      const matchLr = o.lrNumber && o.lrNumber.toLowerCase().includes(q);
      if (!matchId && !matchAgency && !matchDealer && !matchVehicle && !matchLr) return false;
    }

    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending_payment' && o.status !== 'order_placed' && o.status !== 'payment_submitted') return false;
      if (statusFilter === 'payment_verified' && o.status !== 'payment_verified') return false;
      if (statusFilter === 'loading' && (o.status !== 'loading' && o.status !== 'loading_planned' && o.status !== 'loading_completed')) return false;
      if (statusFilter === 'dispatched' && (o.status !== 'dispatched' && o.status !== 'delivered')) return false;
    }

    // Truck Filter
    if (truckFilter !== 'all') {
      if (o.truckCapacity !== truckFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Operations', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Orders Flow' },
        ]}
        title="Order Management Desk"
        subtitle="End-to-end cattle feed consignment pipeline from dealer booking to factory gate dispatch."
        badge={{ text: `${orders.length} Active Orders`, variant: 'blue' }}
        primaryAction={{
          label: '+ Place Feed Order',
          icon: PlusCircle,
          onClick: () => onNavigateToTab ? onNavigateToTab('place_order') : openModal('dealer_order_capture'),
          variant: 'primary',
        }}
      />

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order ID, Dealership Agency, Vehicle Number, LR..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>

        {/* Status Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Stages ({orders.length})</option>
            <option value="pending_payment">Payment Pending / Under Review</option>
            <option value="payment_verified">Payment Verified &amp; Cleared</option>
            <option value="loading">Loading Bay Active / Complete</option>
            <option value="dispatched">Dispatched &amp; Delivered</option>
          </select>

          <select
            value={truckFilter}
            onChange={(e) => setTruckFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Truck Sizes</option>
            <option value="20_MT">20 MT (400 Bags)</option>
            <option value="25_MT">25 MT (500 Bags)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID &amp; Date</th>
                <th className="py-3 px-4">Dealership Consignee</th>
                <th className="py-3 px-4">Feed Product</th>
                <th className="py-3 px-4">Bags / Weight</th>
                <th className="py-3 px-4">Order Value</th>
                <th className="py-3 px-4">Assigned Vehicle</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No orders matching criteria</p>
                    <p className="text-xs mt-1">Try clearing filters or search term.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                        {o.id}
                      </div>
                      <div className="text-[10px] text-slate-400">{o.date}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{o.dealerAgency}</div>
                      <div className="text-[10px] text-slate-400">{o.destination}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {o.items[0]?.productName || 'BFEL Dudh Dhara 50kg'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {o.items.length > 1 ? `+${o.items.length - 1} other product` : 'Single formulation'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white">{o.totalBags} bags</div>
                      <div className="text-[10px] text-slate-400">{bagsToMT(o.totalBags)} MT · {o.truckCapacity}</div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-extrabold text-slate-900 dark:text-white">{formatINR(o.netTotal)}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        {o.status === 'payment_verified' || o.advancePaid > 0 ? '✓ Paid in Full' : 'Pending UTR'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {o.assignedVehicle ? (
                        <>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{o.assignedVehicle}</div>
                          <div className="text-[10px] text-slate-400">{o.assignedBay || 'Bay 3'}</div>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={o.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(o);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right-Side Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOpenPayment={(orderId) => {
          setSelectedOrder(null);
          onNavigateToTab?.('payments', { orderId });
        }}
        onOpenLoading={(orderId) => {
          setSelectedOrder(null);
          onNavigateToTab?.('loading', { orderId });
        }}
        onOpenDispatch={(orderId) => {
          setSelectedOrder(null);
          onNavigateToTab?.('dispatch', { orderId });
        }}
        onViewAudit={(orderId) => {
          setSelectedOrder(null);
          onNavigateToTab?.('audit', { reference: orderId });
        }}
      />
    </div>
  );
};
