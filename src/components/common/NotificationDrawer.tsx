import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCheck, Bell, ArrowRight } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, closeModal, openModal } = useApp();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Operations Notifications
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsAsRead}
              title="Mark all as read"
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark Read</span>
            </button>
            <button
              onClick={closeModal}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markNotificationAsRead(n.id);
                if (n.linkAction?.referenceId) {
                  const ref = n.linkAction.referenceId;
                  if (ref.startsWith('PAY-')) {
                    openModal('payment_verification', { paymentId: ref });
                  } else if (ref.startsWith('CLM-')) {
                    openModal('dealer_claim', { claimId: ref });
                  } else if (ref.startsWith('BFEL-')) {
                    openModal('gate_pass', { orderId: ref });
                  }
                }
                closeModal();
              }}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                !n.read
                  ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-xs leading-snug">{n.title}</h4>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {n.message}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{n.timestamp}</span>
                {n.linkAction && (
                  <span className="text-blue-600 font-sans font-semibold flex items-center gap-0.5">
                    View Action <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
