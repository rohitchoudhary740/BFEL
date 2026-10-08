import React, { useState, useEffect } from 'react';
import { useApp, formatINR } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  X,
  ShoppingCart,
  CreditCard,
  Truck,
  AlertCircle,
  ArrowRight,
  User as UserIcon,
} from 'lucide-react';

interface GlobalSearchModalProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onNavigateToTab }) => {
  const { orders, payments, vehicles, claims, closeModal, openModal } = useApp();
  const { usersList, currentUser } = useAuth();
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  const q = query.toLowerCase().trim();

  const matchedOrders = q
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.dealerAgency.toLowerCase().includes(q) ||
          o.dealerName.toLowerCase().includes(q) ||
          (o.assignedVehicle && o.assignedVehicle.toLowerCase().includes(q)) ||
          (o.lrNumber && o.lrNumber.toLowerCase().includes(q))
      )
    : orders.slice(0, 3);

  const matchedPayments = q
    ? payments.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.utr.toLowerCase().includes(q) ||
          p.orderId.toLowerCase().includes(q) ||
          p.dealerAgency.toLowerCase().includes(q)
      )
    : payments.slice(0, 2);

  const matchedVehicles = q
    ? vehicles.filter(
        (v) =>
          v.registrationNumber.toLowerCase().includes(q) ||
          v.driverName.toLowerCase().includes(q) ||
          (v.currentOrderId && v.currentOrderId.toLowerCase().includes(q))
      )
    : vehicles.slice(0, 2);

  const matchedClaims = q
    ? claims.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.orderId.toLowerCase().includes(q) ||
          c.dealerAgency.toLowerCase().includes(q)
      )
    : claims.slice(0, 2);

  const matchedUsers = q
    ? usersList.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.organization.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          (u.applicationId && u.applicationId.toLowerCase().includes(q))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-4 pt-16 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col text-xs">
        {/* Search Bar Input */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-950">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Order ID, UTR, Dealership, Vehicle, LR, Claim, User..."
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none text-sm font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 text-xs px-2"
            >
              Clear
            </button>
          )}
          <button
            onClick={closeModal}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Results */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Orders Group */}
          {matchedOrders.length > 0 && (
            <div>
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5" />
                Orders ({matchedOrders.length})
              </span>
              <div className="space-y-1.5">
                {matchedOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      closeModal();
                      openModal('gate_pass', { orderId: o.id });
                    }}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {o.id} · <span className="text-slate-500 font-sans">{o.dealerAgency}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {o.totalBags} bags · Truck: {o.assignedVehicle || o.truckCapacity} · {formatINR(o.netTotal)}
                      </div>
                    </div>
                    <span className="text-blue-600 font-medium flex items-center gap-1 text-[11px]">
                      View Dossier <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments Group */}
          {matchedPayments.length > 0 && (
            <div>
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Payments &amp; Remittances ({matchedPayments.length})
              </span>
              <div className="space-y-1.5">
                {matchedPayments.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      closeModal();
                      openModal('payment_verification', { paymentId: p.id });
                    }}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        UTR: {p.utr} · <span className="text-slate-500 font-sans">{p.dealerAgency}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.mode.toUpperCase()} · {formatINR(p.amount)} · Order: {p.orderId}
                      </div>
                    </div>
                    <span className="text-teal-600 font-medium flex items-center gap-1 text-[11px]">
                      Verify <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicles Group */}
          {matchedVehicles.length > 0 && (
            <div>
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                Fleet Vehicles ({matchedVehicles.length})
              </span>
              <div className="space-y-1.5">
                {matchedVehicles.map((v) => (
                  <div
                    key={v.registrationNumber}
                    onClick={() => {
                      closeModal();
                      openModal('gate_pass', { vehicleNumber: v.registrationNumber });
                    }}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {v.registrationNumber} ({v.capacity.replace('_', ' ')})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Driver: {v.driverName} ({v.driverPhone}) · Status: {v.status}
                      </div>
                    </div>
                    <span className="text-blue-600 font-medium flex items-center gap-1 text-[11px]">
                      Inspect <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Claims Group */}
          {matchedClaims.length > 0 && (
            <div>
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Claims &amp; Shortages ({matchedClaims.length})
              </span>
              <div className="space-y-1.5">
                {matchedClaims.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      closeModal();
                      openModal('dealer_claim', { claimId: c.id });
                    }}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {c.id} · <span className="text-slate-500 font-sans">{c.dealerAgency}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Shortage: {c.shortageQuantityBags} bags on {c.orderId} · Status: {c.status}
                      </div>
                    </div>
                    <span className="text-rose-600 font-medium flex items-center gap-1 text-[11px]">
                      Review <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Group */}
          {matchedUsers.length > 0 && (
            <div>
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                Users &amp; Dealerships ({matchedUsers.length})
              </span>
              <div className="space-y-1.5">
                {matchedUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      closeModal();
                    }}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {u.name} · <span className="text-slate-500 font-normal">{u.organization}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Role: {u.role.toUpperCase()} · Status: {u.status} · Phone: {u.phone}
                      </div>
                    </div>
                    <span className="text-slate-500 font-medium flex items-center gap-1 text-[11px]">
                      Profile <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
