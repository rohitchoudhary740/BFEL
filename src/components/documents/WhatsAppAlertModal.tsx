import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Copy, Check, Share2, MessageSquare } from 'lucide-react';

export const WhatsAppAlertModal: React.FC = () => {
  const { activeModalData, orders, closeModal, showToast } = useApp();

  const orderId = activeModalData?.orderId || orders[0]?.id;
  const order = orders.find((o) => o.id === orderId) || orders[0];

  const [copied, setCopied] = useState(false);

  const messageText = `🌾 *BFEL Dispatch Update*

*Order:* ${order.id}
*Quantity:* ${order.totalBags} bags · ${order.totalWeightMT} MT
*Product:* ${order.items[0]?.productName || 'BFEL Cattle Feed'}
*Truck:* ${order.assignedVehicle || 'MP09AB1234'}
*LR:* ${order.lrNumber || 'LR-IND-2026-9428'}
*Seal:* ${order.sealNumber || 'BFEL-SEAL-89421'}
*Driver:* ${order.assignedDriver || 'Mahesh Yadav'}
*Destination:* ${order.destination}
*Status:* Dispatched from Manglia Plant

Live Driver Contact: +91 98931 44520
_Bharat Feeds & Extractions Ltd, Indore_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('WhatsApp dispatch message copied to clipboard', 'info');
  };

  const handleShare = () => {
    const encoded = encodeURIComponent(messageText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    showToast('Opening WhatsApp dispatch share...', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-200">
                Automated Logistics Notification
              </span>
              <h2 className="text-sm font-bold">WhatsApp Dispatch Alert</h2>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Chat Simulation Container */}
        <div className="p-5 bg-[#ECE5DD] dark:bg-slate-950 flex flex-col justify-center">
          {/* Chat bubble */}
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 relative text-xs space-y-2 max-w-sm ml-auto">
            <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <span>🌾</span>
              <span>BFEL Dispatch Update</span>
            </div>

            <div className="space-y-1 font-mono text-[11px] leading-relaxed">
              <p><strong className="text-slate-700 dark:text-slate-300">Order:</strong> {order.id}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Load:</strong> {order.totalBags} bags · {order.totalWeightMT} MT</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Product:</strong> {order.items[0]?.productName}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Truck:</strong> {order.assignedVehicle || 'MP09AB1234'}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">LR:</strong> {order.lrNumber || 'LR-IND-2026-9428'}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Seal:</strong> {order.sealNumber || 'BFEL-SEAL-89421'}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Driver:</strong> {order.assignedDriver || 'Mahesh Yadav'}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Destination:</strong> {order.destination}</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                ● Status: Dispatched from Manglia Plant
              </p>
            </div>

            <div className="pt-1 text-[9px] text-right text-slate-400 font-sans">
              16:45 · Delivered ✓✓
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Message'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow cursor-pointer transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
