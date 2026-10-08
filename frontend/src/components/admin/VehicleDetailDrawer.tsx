import React from 'react';
import { Vehicle } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Truck,
  User,
  Phone,
  ShieldCheck,
  Calendar,
  Layers,
  History,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface VehicleDetailDrawerProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onOpenOrder?: (orderId: string) => void;
}

export const VehicleDetailDrawer: React.FC<VehicleDetailDrawerProps> = ({
  vehicle,
  onClose,
  onOpenOrder,
}) => {
  const { orders } = useApp();

  if (!vehicle) return null;

  const currentOrder = orders.find((o) => o.assignedVehicle === vehicle.registrationNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                {vehicle.registrationNumber}
              </span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {vehicle.capacity.replace('_', ' ')}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Fleet Registration: <strong className="font-mono text-slate-700 dark:text-slate-300">{vehicle.registrationNumber}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Driver & Assignment Details */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>Dedicated Driver &amp; Contact</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 text-[10px] block">Driver Full Name:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{vehicle.driverName}</span>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{vehicle.driverPhone}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Current Bay Assignment:</span>
                <span className="font-bold text-slate-900 dark:text-white">{vehicle.currentBay || 'Bay 3 (Manglia)'}</span>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  ● Status: {vehicle.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Current Active Trip Assignment */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Current Consignment Assignment</span>
            </h3>
            {currentOrder ? (
              <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{currentOrder.id}</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{currentOrder.totalBags} bags</span>
                </div>
                <div className="text-[11px] text-slate-500">Destination: {currentOrder.destination}</div>
                <div className="text-[11px] text-slate-500">Consignee: {currentOrder.dealerAgency}</div>
                {onOpenOrder && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOrder(currentOrder.id);
                    }}
                    className="text-amber-500 font-bold hover:underline text-[11px] block mt-1 cursor-pointer"
                  >
                    Open Order Dossier →
                  </button>
                )}
              </div>
            ) : (
              <div className="text-slate-400 italic">No order currently assigned. Truck available in queue.</div>
            )}
          </div>

          {/* Trip History Log */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-500" />
              <span>Vehicle Loading &amp; Dispatch History</span>
            </h3>
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">LR-IND-2026-9428</div>
                  <div className="text-[10px] text-slate-400">Dewas Mandi Yard · 400 Bags (20 MT)</div>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">DELIVERED</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">LR-IND-2026-9412</div>
                  <div className="text-[10px] text-slate-400">Ujjain Rural Depot · 400 Bags (20 MT)</div>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">DELIVERED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
