import React, { useState } from 'react';
import { useApp, formatINR, bagsToMT } from '../../context/AppContext';
import { Order } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import {
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  MessageSquare,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface DispatchWorkspaceViewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
  defaultStatus?: string;
}

export const DispatchWorkspaceView: React.FC<DispatchWorkspaceViewProps> = ({
  onNavigateToTab,
  defaultStatus = 'ready',
}) => {
  const { orders, dispatchOrder, openModal, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<string>(defaultStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const readyOrders = orders.filter((o) => o.status === 'loading_completed');
  const dispatchedOrders = orders.filter((o) => o.status === 'dispatched');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ready' && o.status !== 'loading_completed') return false;
    if (activeTab === 'dispatched' && o.status !== 'dispatched') return false;
    if (activeTab === 'delivered' && o.status !== 'delivered') return false;
    if (activeTab === 'all' && o.status !== 'loading_completed' && o.status !== 'dispatched' && o.status !== 'delivered') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchVehicle = o.assignedVehicle && o.assignedVehicle.toLowerCase().includes(q);
      const matchOrder = o.id.toLowerCase().includes(q);
      const matchDealer = o.dealerAgency.toLowerCase().includes(q);
      const matchLr = o.lrNumber && o.lrNumber.toLowerCase().includes(q);
      if (!matchVehicle && !matchOrder && !matchDealer && !matchLr) return false;
    }

    return true;
  });

  const handleMarkDispatched = (orderId: string) => {
    dispatchOrder(orderId);
    openModal('whatsapp_alert', { orderId });
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Plant Logistics', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Dispatch Workspace' },
        ]}
        title="Dispatch &amp; Security Gate Pass Desk"
        subtitle="Final weighbridge verification, security seal audit, LR challan issuance and vehicle gate exit clearance."
        badge={{ text: `${readyOrders.length} Ready for Gate Out`, variant: readyOrders.length > 0 ? 'amber' : 'slate' }}
      />

      {/* Tabs and Search */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {[
            { id: 'ready', label: `Ready for Gate Exit (${readyOrders.length})` },
            { id: 'dispatched', label: `Dispatched Today (${dispatchedOrders.length})` },
            { id: 'delivered', label: `Delivered (${deliveredOrders.length})` },
            { id: 'all', label: 'All Dispatches' },
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

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search LR, Vehicle, Order ID..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">LR Number</th>
                <th className="py-3 px-4">Order Reference</th>
                <th className="py-3 px-4">Vehicle &amp; Bay</th>
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">Destination Mandi</th>
                <th className="py-3 px-4">Bags &amp; Weight</th>
                <th className="py-3 px-4">Seal Number</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No shipments in this dispatch queue.</p>
                    <p className="text-xs mt-1">Trucks completed at the loading bay will appear here for gate clearance.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {o.lrNumber || 'LR-IND-PENDING'}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {o.id}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-amber-500" />
                        <span>{o.assignedVehicle || 'MP09AB1234'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{o.assignedBay || 'Bay 3'}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      {o.assignedDriver || 'Rakesh Yadav'}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{o.dealerAgency}</div>
                      <div className="text-[10px] text-slate-400">{o.destination}</div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white">{o.totalBags} bags</div>
                      <div className="text-[10px] text-slate-400">{bagsToMT(o.totalBags)} MT</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {o.sealNumber || 'SEAL-BFEL-8841'}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={o.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {o.status === 'loading_completed' ? (
                          <button
                            type="button"
                            onClick={() => handleMarkDispatched(o.id)}
                            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-xs transition-colors"
                          >
                            Mark Dispatched →
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openModal('whatsapp_alert', { orderId: o.id })}
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp Alert</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openModal('gate_pass', { orderId: o.id })}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] cursor-pointer"
                        >
                          Gate Pass
                        </button>

                        <button
                          type="button"
                          onClick={() => openModal('lr_challan', { orderId: o.id })}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] cursor-pointer"
                        >
                          LR Challan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
