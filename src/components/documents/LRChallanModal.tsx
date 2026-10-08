import React from 'react';
import { useApp, formatINR } from '../../context/AppContext';
import { X, Printer, Download, Share2, FileText } from 'lucide-react';

export const LRChallanModal: React.FC = () => {
  const { activeModalData, orders, closeModal, showToast } = useApp();

  const orderId = activeModalData?.orderId || orders[0]?.id;
  const order = orders.find((o) => o.id === orderId) || orders[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    showToast(`Lorry Receipt ${order.lrNumber || 'LR-2026'} downloaded`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Logistics Consignment Note
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Lorry Receipt (LR) / Challan
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

        {/* Digital Document View */}
        <div className="p-6 space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs">
          {/* Header */}
          <div className="flex justify-between items-start pb-3 border-b-2 border-slate-900 dark:border-slate-100">
            <div>
              <h1 className="text-base font-extrabold uppercase tracking-tight">
                Bharat Feeds &amp; Extractions Ltd
              </h1>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                CIN: U15312MP1995PLC009124 · GSTIN: 23AABCB1294K1Z5
              </p>
              <p className="text-[10px] text-slate-500">
                Plot 12-14, Industrial Area, Manglia, Indore (M.P.) 453771
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">LR NUMBER</span>
              <div className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
                {order.lrNumber || 'LR-IND-2026-9428'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Date: {order.date}
              </div>
            </div>
          </div>

          {/* Consignor / Consignee Table */}
          <div className="grid grid-cols-2 gap-4 p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Consignor (From)</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                Bharat Feeds &amp; Extractions Ltd
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Manglia Central Bagging Plant, Indore
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Consignee (To)</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {order.dealerAgency}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {order.destination} · Contact: {order.dealerName} ({order.dealerPhone})
              </p>
            </div>
          </div>

          {/* Transport Particulars */}
          <div className="grid grid-cols-4 gap-2 text-center p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Vehicle No.</span>
              <p className="font-mono font-bold text-slate-900 dark:text-white">{order.assignedVehicle || 'MP09AB1234'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Driver</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{order.assignedDriver || 'Mahesh Yadav'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Container Seal</span>
              <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{order.sealNumber || 'BFEL-SEAL-89421'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Freight Terms</span>
              <p className="font-bold text-blue-600">PAID AT SOURCE</p>
            </div>
          </div>

          {/* Product Items Table */}
          <table className="w-full border border-slate-200 dark:border-slate-700 text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 uppercase">
              <tr>
                <th className="p-2 text-left">Description of Goods</th>
                <th className="p-2 text-right">Packages</th>
                <th className="p-2 text-right">Packing</th>
                <th className="p-2 text-right">Gross Weight</th>
                <th className="p-2 text-right">Net Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2 font-medium">{item.productName}</td>
                  <td className="p-2 text-right font-mono font-bold">{item.bags} Bags</td>
                  <td className="p-2 text-right">50 kg HDPE Woven</td>
                  <td className="p-2 text-right font-mono">{(order.grossWeightKg || 29450).toLocaleString()} kg</td>
                  <td className="p-2 text-right font-mono font-bold">{(item.weightKg).toLocaleString()} kg</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Clause */}
          <div className="text-[10px] text-slate-500 leading-tight border-t border-slate-200 dark:border-slate-800 pt-3">
            Goods delivered strictly at owner's risk under standard road carrier conditions. Any physical shortage or bag damage must be endorsed on this copy by driver at the time of unloading to be eligible for BFEL credit notes.
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
              <span>Print LR</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
          <button
            onClick={closeModal}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
