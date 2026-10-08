import React, { useState } from 'react';
import { useApp, formatINR, formatLakhs, bagsToMT } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Scale,
  Truck,
  CreditCard,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportsViewProps {
  onNavigateToTab?: (tab: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigateToTab }) => {
  const { orders, payments, claims, showToast } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'oct_2026' | 'sep_2026' | 'q3_2026'>('oct_2026');

  const totalBags = orders.reduce((sum, o) => sum + o.totalBags, 0);
  const totalMT = bagsToMT(totalBags);
  const totalGrossValue = orders.reduce((sum, o) => sum + o.netTotal, 0);
  const verifiedPaymentsCount = payments.filter((p) => p.status === 'verified').length;
  const claimsCount = claims.length;

  const handleExport = (reportType: string) => {
    showToast(`Generating ${reportType} CSV export for audit ledger...`, 'info');
    setTimeout(() => {
      showToast(`${reportType} CSV report downloaded successfully.`, 'success');
    }, 1200);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: 'Operations', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Reports & Logistics Intelligence' },
        ]}
        title="Executive Operations & Logistics Intelligence"
        subtitle="Consolidated plant output, dispatches, payment reconciliation velocity, and territory analysis."
        action={
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="oct_2026">October 2026 (Live)</option>
              <option value="sep_2026">September 2026</option>
              <option value="q3_2026">Q3 2026 Audit</option>
            </select>
            <button
              onClick={() => handleExport('BFEL_Operations_Report')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Plant Output</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-mono font-black text-slate-900 dark:text-white">
            {totalMT} MT
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {totalBags.toLocaleString()} bags (50 kg HDPE standard)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Consignment Gross Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-mono font-black text-slate-900 dark:text-white">
            {formatLakhs(totalGrossValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {formatINR(totalGrossValue)} total invoice turnover
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Payment Velocity</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-mono font-black text-slate-900 dark:text-white">
            18 min
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Avg UTR submission to bay clearance
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Weighbridge Compliance</span>
            <Scale className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
            99.8%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Zero variance within ±100 kg tolerance
          </div>
        </div>
      </div>

      {/* Grid of Report Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Module 1: Product Formulation Volume Split */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              Feed Formulation Production &amp; Dispatches
            </h3>
            <button
              onClick={() => handleExport('Feed_Formulation_Split')}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { name: 'BFEL Dudh Dhara 50kg', bags: 1850, mt: 92.5, percent: 46, color: 'bg-blue-600' },
              { name: 'BFEL Mahamilk Super 50kg', bags: 1200, mt: 60.0, percent: 30, color: 'bg-emerald-600' },
              { name: 'BFEL Pashu Shakti Balanced 50kg', bags: 650, mt: 32.5, percent: 16, color: 'bg-amber-500' },
              { name: 'BFEL Calf Starter Pellet 50kg', bags: 300, mt: 15.0, percent: 8, color: 'bg-purple-600' },
            ].map((p, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-slate-800 dark:text-slate-200 font-medium">
                  <span>{p.name}</span>
                  <span className="font-mono text-slate-500">{p.bags} bags ({p.mt} MT) · {p.percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module 2: Territory Dispatch Analysis */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-500" />
              Territory Dispatch Destination Breakdown
            </h3>
            <button
              onClick={() => handleExport('Territory_Dispatch_Analysis')}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { territory: 'Dewas Mandi & Rural Belt', mt: 80, trucks: 4, value: '₹22.72L', share: 40 },
              { territory: 'Sanwer Industrial Area & Outskirts', mt: 50, trucks: 2, value: '₹14.20L', share: 25 },
              { territory: 'Khargone & Nimar Zone', mt: 45, trucks: 2, value: '₹12.78L', share: 22 },
              { territory: 'Ujjain Mandi Parisar', mt: 25, trucks: 1, value: '₹7.10L', share: 13 },
            ].map((t, idx) => (
              <div key={idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{t.territory}</div>
                  <div className="text-[11px] text-slate-500">{t.trucks} truckloads dispatched ({t.mt} MT)</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">{t.value}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">{t.share}% territory share</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
