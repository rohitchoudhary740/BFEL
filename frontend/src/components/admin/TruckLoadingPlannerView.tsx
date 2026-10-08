import React, { useState } from 'react';
import { useApp, BAG_WEIGHT_KG, TRUCK_LIMITS, bagsToKg, bagsToMT, formatINR } from '../../context/AppContext';
import { Order, Vehicle } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { TruckCapacityBar } from '../common/TruckCapacityBar';
import {
  Truck,
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Search,
} from 'lucide-react';

interface TruckLoadingPlannerViewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
  onOpenOrder?: (orderId: string) => void;
}

export const TruckLoadingPlannerView: React.FC<TruckLoadingPlannerViewProps> = ({
  onNavigateToTab,
  onOpenOrder,
}) => {
  const { orders, vehicles, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [bayFilter, setBayFilter] = useState<string>('all');

  // Filter orders that are in loading pipeline (payment verified, loading planned, loading, loading completed)
  const loadingOrders = orders.filter((o) => {
    const isRelevantStatus =
      o.status === 'payment_verified' ||
      o.status === 'loading_planned' ||
      o.status === 'loading' ||
      o.status === 'loading_completed';

    if (!isRelevantStatus) return false;

    if (bayFilter !== 'all' && o.assignedBay !== bayFilter) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchVehicle = o.assignedVehicle && o.assignedVehicle.toLowerCase().includes(q);
      const matchOrder = o.id.toLowerCase().includes(q);
      const matchDealer = o.dealerAgency.toLowerCase().includes(q);
      if (!matchVehicle && !matchOrder && !matchDealer) return false;
    }

    return true;
  });

  const activeLoadingCount = orders.filter((o) => o.status === 'loading').length;
  const readyForDispatchCount = orders.filter((o) => o.status === 'loading_completed').length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Plant Operations', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Truck Loading Planner' },
        ]}
        title="Truck Loading Planner"
        subtitle="Plan and control plant loading within BFEL's 50 kg bag and truck capacity rules."
        badge={{ text: `${activeLoadingCount} Bays Loading`, variant: 'emerald' }}
        primaryAction={{
          label: 'Open Bay 3 Terminal',
          icon: Truck,
          onClick: () => onNavigateToTab?.('terminal'),
          variant: 'primary',
        }}
      />

      {/* Rules Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Scale className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="font-bold text-slate-100">BFEL Standard Weighbridge &amp; Capacity Rules:</span>
            <span className="text-slate-400 ml-1.5">
              50 kg/bag · 20 MT Truck = 400 bags (20,000 kg) · 25 MT Truck = 500 bags (25,000 kg). Strict tare/gross weighing.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Bay 1: Active</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">Bay 3: Loading</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">Bay 2 &amp; 4: Idle</span>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Vehicle Number, Order ID, Dealer..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={bayFilter}
            onChange={(e) => setBayFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Loading Bays</option>
            <option value="Bay 1">Bay 1 (Bulk Feed)</option>
            <option value="Bay 3">Bay 3 (Dudh Dhara 50kg)</option>
          </select>
        </div>
      </div>

      {/* Truck Loading Queue Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Dealer / Destination</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Required Bags</th>
                <th className="py-3 px-4">Loaded Bags</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Loading Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loadingOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No trucks currently queued for loading.</p>
                    <p className="text-xs mt-1">Orders with verified advance payments will appear here.</p>
                  </td>
                </tr>
              ) : (
                loadingOrders.map((o) => {
                  const loadedBags = o.loadingProgressBags || (o.status === 'loading_completed' ? o.totalBags : 0);
                  const loadedKg = bagsToKg(loadedBags);
                  const totalKg = bagsToKg(o.totalBags);
                  const isComplete = o.status === 'loading_completed';

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-amber-500" />
                          <span>{o.assignedVehicle || 'MP09AB1234'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {o.assignedBay || 'Bay 3'} · {o.assignedDriver || 'Rakesh Yadav'}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {o.id}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{o.dealerAgency}</div>
                        <div className="text-[10px] text-slate-400">{o.destination}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {o.truckCapacity.replace('_', ' ')}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {o.totalBags} bags
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className={`font-bold ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {loadedBags} / {o.totalBags}
                        </span>
                        <div className="w-24 mt-1">
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min(100, (loadedBags / o.totalBags) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                        <div>{(loadedKg / 1000).toFixed(1)} / {(totalKg / 1000).toFixed(1)} MT</div>
                        <div className="text-[10px] text-slate-400">Tare: {o.tareWeightKg || 12450} kg</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          ✓ Verified
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={o.status} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigateToTab?.('terminal', { orderId: o.id })}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] cursor-pointer shadow-xs transition-colors"
                          >
                            Open Terminal
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenOrder ? onOpenOrder(o.id) : onNavigateToTab?.('orders', { orderId: o.id })}
                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] cursor-pointer"
                          >
                            View Order
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
