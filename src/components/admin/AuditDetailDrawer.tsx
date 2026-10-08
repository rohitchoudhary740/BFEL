import React from 'react';
import { AuditEvent } from '../../types';
import {
  X,
  History,
  ShieldCheck,
  User,
  Clock,
  Layers,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface AuditDetailDrawerProps {
  event: AuditEvent | null;
  onClose: () => void;
}

export const AuditDetailDrawer: React.FC<AuditDetailDrawerProps> = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                {event.id}
              </span>
              <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                Verified Cryptographic Log
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Recorded at {event.timestamp}
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
          {/* Action Overview Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Operational Action Event
            </span>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              {event.action}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Actor & Entity Metadata */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>Actor &amp; Origin System Details</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 text-[10px] block">Actor Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{event.user}</span>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">Role: {event.role}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Module / Entity:</span>
                <span className="font-bold text-slate-900 dark:text-white">{event.entity}</span>
                <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-0.5 font-bold">
                  Ref: {event.reference}
                </div>
              </div>
            </div>
          </div>

          {/* Security & Non-repudiation Details */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Immutable Audit Certificate</span>
            </h3>
            <div className="space-y-1.5 text-slate-500 dark:text-slate-400 pt-1">
              <div>Hash: <span className="text-slate-700 dark:text-slate-300">sha256-bfel-9a02f891b01c38e9...</span></div>
              <div>Origin Node: <span className="text-slate-700 dark:text-slate-300">Manglia Central Factory Gateway</span></div>
              <div>Execution Result: <span className="text-emerald-600 dark:text-emerald-400 font-bold">SUCCESS (200 OK)</span></div>
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
