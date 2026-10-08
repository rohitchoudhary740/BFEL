import React, { useState } from 'react';
import { useApp, formatINR } from '../../context/AppContext';
import { Claim } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { ClaimDetailDrawer } from './ClaimDetailDrawer';
import {
  AlertCircle,
  Search,
  CheckCircle2,
  Clock,
  Camera,
  FileText,
  Filter,
} from 'lucide-react';

interface ClaimsDeskViewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
  defaultStatus?: string;
}

export const ClaimsDeskView: React.FC<ClaimsDeskViewProps> = ({
  onNavigateToTab,
  defaultStatus = 'all',
}) => {
  const { claims } = useApp();
  const [activeTab, setActiveTab] = useState<string>(defaultStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const pendingClaims = claims.filter((c) => c.status === 'under_review' || c.status === 'submitted');
  const resolvedClaims = claims.filter((c) => c.status === 'approved' || c.status === 'rejected');

  const filteredClaims = claims.filter((c) => {
    if (activeTab === 'shortage' && c.claimType !== 'shortage') return false;
    if (activeTab === 'damaged' && c.claimType !== 'damaged_bags') return false;
    if (activeTab === 'quality' && c.claimType !== 'quality_issue') return false;
    if (activeTab === 'wrong_product' && c.claimType !== 'wrong_product') return false;
    if (activeTab === 'resolved' && c.status !== 'approved' && c.status !== 'rejected') return false;
    if (activeTab === 'pending' && c.status !== 'under_review' && c.status !== 'submitted') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchId = c.id.toLowerCase().includes(q);
      const matchOrder = c.orderId.toLowerCase().includes(q);
      const matchAgency = c.dealerAgency.toLowerCase().includes(q);
      const matchDealer = c.dealerName.toLowerCase().includes(q);
      if (!matchId && !matchOrder && !matchAgency && !matchDealer) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Operations', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Claims Desk' },
        ]}
        title="Claims &amp; Shortages Desk"
        subtitle="Review dealer consignment shortages, damaged bag photographic evidence, and approve credit note adjustments."
        badge={{ text: `${pendingClaims.length} Actionable`, variant: pendingClaims.length > 0 ? 'rose' : 'slate' }}
      />

      {/* Tabs and Search */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex-wrap">
          {[
            { id: 'all', label: `All Claims (${claims.length})` },
            { id: 'pending', label: `Pending (${pendingClaims.length})` },
            { id: 'shortage', label: 'Shortage' },
            { id: 'damaged', label: 'Damaged Bags' },
            { id: 'quality', label: 'Quality' },
            { id: 'resolved', label: `Resolved (${resolvedClaims.length})` },
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
            placeholder="Search Claim ID, Order, Dealer..."
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
                <th className="py-3 px-4">Claim ID &amp; Date</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Dealer / Destination</th>
                <th className="py-3 px-4">Expected</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4">Shortage / Discrepancy</th>
                <th className="py-3 px-4">Claim Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No active claims</p>
                    <p className="text-xs mt-1">No shortage or damage claims require action.</p>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedClaim(c)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                        {c.id}
                      </div>
                      <div className="text-[10px] text-slate-400">{c.submittedDate}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {c.orderId}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{c.dealerAgency}</div>
                      <div className="text-[10px] text-slate-400">{c.location || 'Dewas Mandi'}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {c.expectedQuantityBags} bags
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {c.receivedQuantityBags} bags
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {c.shortageQuantityBags} bags short
                      </span>
                      <div className="text-[10px] text-slate-400">({c.shortageWeightKg || c.shortageQuantityBags * 50} kg)</div>
                    </td>

                    <td className="py-3 px-4 font-medium uppercase text-[10px] text-slate-600 dark:text-slate-400">
                      {c.claimType.replace('_', ' ')}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      {c.status === 'under_review' || c.status === 'submitted' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClaim(c);
                          }}
                          className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] cursor-pointer shadow-xs transition-colors"
                        >
                          Review &amp; Credit Note →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClaim(c);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-[11px] cursor-pointer"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Detail Drawer */}
      <ClaimDetailDrawer
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
      />
    </div>
  );
};
