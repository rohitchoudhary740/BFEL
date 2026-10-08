import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditEvent } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { AuditDetailDrawer } from './AuditDetailDrawer';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  User,
} from 'lucide-react';

interface AuditTrailViewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
  defaultReference?: string;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  onNavigateToTab,
  defaultReference = '',
}) => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState(defaultReference);
  const [roleFilter, setRoleFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    if (roleFilter !== 'all' && log.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (entityFilter !== 'all' && log.entity.toLowerCase() !== entityFilter.toLowerCase()) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchUser = log.user.toLowerCase().includes(q);
      const matchRef = log.reference.toLowerCase().includes(q);
      const matchDesc = log.description.toLowerCase().includes(q);
      if (!matchAction && !matchUser && !matchRef && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Governance', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Audit Trail' },
        ]}
        title="Enterprise Operations Audit Trail"
        subtitle="Cryptographically logged operational ledger tracking order lifecycles, UTR validations, truck loadings and gate clearances."
        badge={{ text: `${auditLogs.length} Events Logged`, variant: 'slate' }}
      />

      {/* Filters and Search */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Reference ID (BFEL-2026-..., UTR, LR...), Actor, Action..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Accounts">Accounts</option>
            <option value="Loading">Loading Operator</option>
            <option value="Dealer">Dealer</option>
            <option value="Sales">Sales Agent</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Modules</option>
            <option value="Order">Order Flow</option>
            <option value="Payment">Payment</option>
            <option value="Loading">Loading Bay</option>
            <option value="Dispatch">Dispatch</option>
            <option value="Claim">Claims &amp; Credit</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module / Entity</th>
                <th className="py-3 px-4">Reference ID</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedEvent(log)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 text-slate-500">
                    {log.timestamp}
                  </td>

                  <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                    {log.user}
                  </td>

                  <td className="py-3 px-4 font-sans uppercase text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                    {log.role}
                  </td>

                  <td className="py-3 px-4 font-sans font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors">
                    {log.action}
                  </td>

                  <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-400">
                    {log.entity}
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {log.reference}
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      Success
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(log);
                      }}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-[10px] cursor-pointer"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Drawer */}
      <AuditDetailDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};
