import React, { useState } from 'react';
import { useApp, formatINR, bagsToMT } from '../../context/AppContext';
import { Order } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { OrderTimeline } from '../common/OrderTimeline';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface DeliveryTrackingViewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
  onOpenOrder?: (orderId: string) => void;
}

export const DeliveryTrackingView: React.FC<DeliveryTrackingViewProps> = ({
  onNavigateToTab,
  onOpenOrder,
}) => {
  const { orders } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Active transit shipments
  const activeShipments = orders.filter(
    (o) => o.status === 'dispatched' || o.status === 'loading_completed' || o.status === 'delivered'
  );

  const filtered = activeShipments.filter((o) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchVehicle = o.assignedVehicle && o.assignedVehicle.toLowerCase().includes(q);
      const matchOrder = o.id.toLowerCase().includes(q);
      const matchDealer = o.dealerAgency.toLowerCase().includes(q);
      const matchDest = o.destination.toLowerCase().includes(q);
      if (!matchVehicle && !matchOrder && !matchDealer && !matchDest) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Plant Logistics', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Delivery Tracking' },
        ]}
        title="Consignment Delivery &amp; Transit Tracking"
        subtitle="Real-time transit telemetry, truck gate departures, ETA tracking and destination godown delivery confirmation."
        badge={{ text: `${activeShipments.length} Active Shipments`, variant: 'blue' }}
      />

      {/* Search */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs flex items-center justify-between text-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Consignment Vehicle, Order ID, Destination..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>
      </div>

      {/* Shipments Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((order) => (
          <div
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-amber-500 transition-all cursor-pointer space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                    {order.id}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span>{order.destination}</span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {order.assignedVehicle || 'MP09AB1234'}
                </span>
                <span className="text-[10px] text-slate-400">LR: {order.lrNumber || 'LR-IND-9428'}</span>
              </div>
            </div>

            {/* Consignee & Load info */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consignee</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{order.dealerAgency}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Feed Consignment</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  {order.totalBags} bags ({bagsToMT(order.totalBags)} MT)
                </span>
              </div>
            </div>

            {/* Visual Timeline Bar */}
            <div className="pt-2">
              <OrderTimeline status={order.status} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-500 font-mono">
                Driver: {order.assignedDriver || 'Rakesh Yadav'}
              </span>
              <span className="text-amber-500 font-bold hover:underline">
                View Full Timeline &amp; Seal Details →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">{selectedOrder.id}</span>
                <div className="text-[11px] text-slate-500">{selectedOrder.destination} · {selectedOrder.dealerAgency}</div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>Vehicle: <strong className="text-slate-800 dark:text-slate-200">{selectedOrder.assignedVehicle || 'MP09AB1234'}</strong></div>
                <div>Capacity: <strong className="text-slate-800 dark:text-slate-200">{selectedOrder.truckCapacity}</strong></div>
                <div>LR Number: <strong className="text-blue-600">{selectedOrder.lrNumber || 'LR-IND-9428'}</strong></div>
                <div>Security Seal: <strong className="text-emerald-600">{selectedOrder.sealNumber || 'SEAL-BFEL-8841'}</strong></div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                Shipment Transit Lifecycle
              </span>
              <OrderTimeline status={selectedOrder.status} />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
              >
                Close
              </button>
              {onOpenOrder && (
                <button
                  onClick={() => {
                    const id = selectedOrder.id;
                    setSelectedOrder(null);
                    onOpenOrder(id);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold cursor-pointer"
                >
                  Open Order Dossier
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
