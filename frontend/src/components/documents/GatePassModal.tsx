import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Printer, Download, Share2, ShieldCheck, QrCode } from 'lucide-react';

export const GatePassModal: React.FC = () => {
  const { activeModalData, orders, closeModal, dispatchOrder, showToast } = useApp();

  const orderId = activeModalData?.orderId || orders[0]?.id;
  const order = orders.find((o) => o.id === orderId) || orders[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    showToast(`Gate Pass ${order.gatePassId || 'GP-2026'} downloaded as PDF`, 'success');
  };

  const handleClearDispatch = () => {
    dispatchOrder(order.id);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Outward Security Document
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Official Plant Gate Pass
              </h2>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Gate Pass Document Container */}
        <div className="p-6 space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs">
          {/* Header Title inside document */}
          <div className="text-center pb-3 border-b-2 border-slate-900 dark:border-slate-100">
            <h1 className="text-base font-extrabold tracking-tight uppercase">
              Bharat Feeds &amp; Extractions Ltd
            </h1>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Manglia Cattle Feed Plant &amp; Extraction Complex, A.B. Road, Indore (M.P.)
            </p>
            <div className="inline-block mt-1 px-3 py-0.5 bg-slate-900 text-white font-mono text-[11px] font-bold rounded">
              OUTWARD GATE PASS: {order.gatePassId || 'GP-MGL-2026-0412'}
            </div>
          </div>

          {/* Key Grid */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 dark:border-slate-700 p-3.5 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Truck Registration</span>
              <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {order.assignedVehicle || 'MP09AB1234'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Assigned Loading Bay</span>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {order.assignedBay || 'Loading Bay 3'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Driver Name &amp; Phone</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {order.assignedDriver || 'Mahesh Yadav'} (+91 98931 44520)
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Security Seal Number</span>
              <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {order.sealNumber || 'BFEL-SEAL-89421'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Consignee Dealership</span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {order.dealerAgency} ({order.destination})
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Plant Order Reference</span>
              <p className="font-mono font-bold">{order.id}</p>
            </div>
          </div>

          {/* Weighbridge Verification Box */}
          <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-slate-300">
              Weighbridge Scale Records (Indore Plant Terminal #3)
            </div>
            <div className="p-3 grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-500">Bag Count</span>
                <p className="font-mono font-bold text-sm">{order.totalBags} Bags</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Gross Weight</span>
                <p className="font-mono font-bold text-sm">{(order.grossWeightKg || 29450).toLocaleString()} kg</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Tare Weight</span>
                <p className="font-mono font-bold text-sm">{(order.tareWeightKg || 9450).toLocaleString()} kg</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Certified Net</span>
                <p className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {(order.netWeightKg || 20000).toLocaleString()} kg
                </p>
              </div>
            </div>
          </div>

          {/* Signatures & Security Stamp */}
          <div className="pt-4 flex items-center justify-between text-[11px] text-slate-500">
            <div className="text-center">
              <div className="w-24 h-6 border-b border-slate-400 mx-auto" />
              <span className="mt-1 block">Weighbridge Operator</span>
            </div>
            <div className="text-center">
              <div className="w-24 h-6 border-b border-slate-400 mx-auto" />
              <span className="mt-1 block">Security Officer Stamp</span>
            </div>
            <div className="text-center">
              <div className="w-24 h-6 border-b border-slate-400 mx-auto" />
              <span className="mt-1 block">Driver Acknowledgement</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>

          {order.status !== 'dispatched' && order.status !== 'delivered' && (
            <button
              onClick={handleClearDispatch}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow cursor-pointer transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Security Clear &amp; Dispatch Truck</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
