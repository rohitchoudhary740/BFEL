import React from 'react';
import { Order } from '../../types';
import { useApp, formatINR, bagsToMT } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  X,
  Building,
  MapPin,
  Truck,
  CreditCard,
  Package,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User,
  ArrowRight,
} from 'lucide-react';

interface OrderDetailDrawerProps {
  order: Order | null;
  onClose: () => void;
  onOpenPayment?: (orderId: string) => void;
  onOpenLoading?: (orderId: string) => void;
  onOpenDispatch?: (orderId: string) => void;
  onViewAudit?: (orderId: string) => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  onClose,
  onOpenPayment,
  onOpenLoading,
  onOpenDispatch,
  onViewAudit,
}) => {
  const { payments, vehicles, openModal } = useApp();

  if (!order) return null;

  const payment = payments.find((p) => p.orderId === order.id);
  const vehicle = vehicles.find((v) => v.registrationNumber === order.assignedVehicle);

  const getTimelineSteps = () => {
    const isPaymentSubmitted = order.status !== 'order_placed';
    const isPaymentVerified = isPaymentSubmitted && order.status !== 'payment_submitted';
    const isTruckAssigned = !!order.assignedVehicle;
    const isLoadingStarted = order.status === 'loading' || order.status === 'loading_completed' || order.status === 'dispatched' || order.status === 'delivered';
    const isLoadingDone = order.status === 'loading_completed' || order.status === 'dispatched' || order.status === 'delivered';
    const isDispatched = order.status === 'dispatched' || order.status === 'delivered';
    const isDelivered = order.status === 'delivered';

    return [
      {
        id: 'created',
        title: 'Order Created',
        actor: `${order.dealerName} (${order.dealerAgency})`,
        time: `${order.date} 08:30`,
        done: true,
        desc: `Placed order for ${order.totalBags} bags (${bagsToMT(order.totalBags)} MT)`,
      },
      {
        id: 'payment_submitted',
        title: 'Payment Submitted',
        actor: order.dealerName,
        time: payment ? `${order.date} 09:10` : 'Pending submission',
        done: isPaymentSubmitted,
        desc: payment ? `Advance RTGS UTR: ${payment.utr} (${formatINR(payment.amount)})` : 'Dealer must submit advance UTR proof',
      },
      {
        id: 'payment_verified',
        title: 'Payment Verified',
        actor: payment?.verifiedBy || 'Sunita Jain (Accounts)',
        time: isPaymentVerified ? `${order.date} 09:42` : 'Awaiting verification',
        done: isPaymentVerified,
        desc: isPaymentVerified ? 'Finance clearance approved · released to plant loading bay' : 'Pending accounts verification desk',
      },
      {
        id: 'truck_assigned',
        title: 'Truck Assigned',
        actor: 'Rajeshwar Sharma (Admin)',
        time: isTruckAssigned ? `${order.date} 10:00` : 'Pending bay allocation',
        done: isTruckAssigned,
        desc: isTruckAssigned ? `Vehicle: ${order.assignedVehicle} · Bay: ${order.assignedBay || 'Bay 3'} · Driver: ${order.assignedDriver || 'Rakesh Yadav'}` : 'Vehicle allocation pending in truck planner',
      },
      {
        id: 'loading_started',
        title: 'Loading Started',
        actor: 'Kailash Verma (Bay 3 Operator)',
        time: isLoadingStarted ? `${order.date} 10:15` : 'Pending loading start',
        done: isLoadingStarted,
        desc: isLoadingStarted ? `Bay scale active · tare recorded: ${order.tareWeightKg || 12450} kg` : 'Bay queue waiting',
      },
      {
        id: 'loading_completed',
        title: 'Loading Completed',
        actor: 'Kailash Verma (Bay 3 Operator)',
        time: isLoadingDone ? `${order.date} 11:20` : 'Loading in progress',
        done: isLoadingDone,
        desc: isLoadingDone ? `400/400 bags loaded · Seal: ${order.sealNumber || 'SEAL-BFEL-8841'} · Gross: ${order.grossWeightKg || 32450} kg` : `${order.loadingProgressBags || 0}/${order.totalBags} bags loaded on truck`,
      },
      {
        id: 'dispatch_generated',
        title: 'Dispatch & Gate Pass',
        actor: 'Rajeshwar Sharma (Admin)',
        time: isDispatched ? `${order.date} 11:45` : 'Pending security gate clearance',
        done: isDispatched,
        desc: isDispatched ? `LR: ${order.lrNumber || 'LR-IND-9428'} · Gate Pass: ${order.gatePassId || 'GP-MGL-491'} issued` : 'Gate clearance awaiting final dispatch order',
      },
      {
        id: 'delivered',
        title: 'Delivered',
        actor: `${order.dealerAgency} Receiving Yard`,
        time: isDelivered ? `${order.date} 15:30` : 'In transit',
        done: isDelivered,
        desc: isDelivered ? 'Physical shipment received and acknowledged at destination mandi' : `Expected ETA: ${order.destination}`,
      },
    ];
  };

  const timeline = getTimelineSteps();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col text-xs">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                {order.id}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created on {order.date}</span>
              <span>·</span>
              <span>{order.destination}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Key Metric Highlights Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Amount
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-slate-900 dark:text-white">
                {formatINR(order.netTotal)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Quantity
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
                {order.totalBags} bags
              </span>
              <span className="text-[10px] text-slate-500 block">({bagsToMT(order.totalBags)} MT)</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Loading
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {order.loadingProgressBags || (order.status === 'dispatched' || order.status === 'loading_completed' ? order.totalBags : 0)} / {order.totalBags}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Payment
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white capitalize">
                {order.advancePaid > 0 ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Dealer & Destination Block */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-500" />
              <span>Dealership &amp; Consignee Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 text-[11px] block">Dealership Agency:</span>
                <span className="font-bold text-slate-900 dark:text-white">{order.dealerAgency}</span>
                <div className="text-[11px] text-slate-500 mt-0.5">Proprietor: {order.dealerName}</div>
                <div className="text-[11px] text-slate-500">Phone: {order.dealerPhone || '+91 98260 41290'}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Unloading Destination:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{order.destination}</span>
                <div className="text-[11px] text-slate-500 mt-0.5">Assigned Distributor: Malwa Agri Feeds Pvt Ltd</div>
                <div className="text-[11px] text-slate-500">Sales Territory: Indore - Dewas Malwa Belt</div>
              </div>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-500" />
              <span>Product Specifications &amp; Bag Load</span>
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{item.productName}</div>
                    <div className="text-[11px] text-slate-500">
                      Standard 50 kg Bag · {item.bags} bags · {bagsToMT(item.bags)} MT
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-900 dark:text-white">{formatINR(item.totalAmount)}</div>
                    <div className="text-[11px] text-slate-400">@{formatINR(item.ratePerBag)} / bag</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logistics & Gate Clearance Block */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Logistics, Weighbridge &amp; Seal</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Vehicle Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {order.assignedVehicle || 'MP09AB1234'}
                </span>
                <span className="text-[10px] text-slate-500 block">Cap: {order.truckCapacity}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Loading Bay</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {order.assignedBay || 'Bay 3 (Cattle Feed)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Security Seal</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {order.sealNumber || 'SEAL-BFEL-8841'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">LR Number</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {order.lrNumber || (order.status === 'dispatched' ? 'LR-IND-9428' : 'Pending clearance')}
                </span>
              </div>
            </div>
          </div>

          {/* Order Lifecycle Timeline */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Operational Lifecycle Trail</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {timeline.filter((t) => t.done).length} / {timeline.length} Stages Passed
              </span>
            </div>

            <div className="space-y-4 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-5 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] ${
                      step.done
                        ? 'bg-emerald-500 border-white dark:border-slate-900 text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {step.done ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-xs ${step.done ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {step.title}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{step.time}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">{step.actor}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onViewAudit && (
              <button
                onClick={() => onViewAudit(order.id)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Audit Trail
              </button>
            )}

            {payment && onOpenPayment && (
              <button
                onClick={() => onOpenPayment(order.id)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                View Payment Proof
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {order.status === 'payment_verified' && onOpenLoading && (
              <button
                onClick={() => onOpenLoading(order.id)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Open Loading Terminal →
              </button>
            )}

            {order.status === 'loading_completed' && onOpenDispatch && (
              <button
                onClick={() => onOpenDispatch(order.id)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer shadow-xs"
              >
                Issue Gate Pass &amp; Dispatch →
              </button>
            )}

            {order.status === 'dispatched' && (
              <button
                onClick={() => openModal('whatsapp_alert', { orderId: order.id })}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>WhatsApp Dispatch Alert</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
