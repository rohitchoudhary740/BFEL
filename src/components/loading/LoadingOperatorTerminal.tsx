import React, { useState, useEffect } from 'react';
import { useApp, BAG_WEIGHT_KG, TRUCK_LIMITS, bagsToKg, bagsToMT, formatINR } from '../../context/AppContext';
import { TruckCapacityBar } from '../common/TruckCapacityBar';
import { TruckCapacityVisualizer } from '../../design-system/TruckCapacityVisualizer';
import { StatusBadge } from '../common/StatusBadge';
import { PageHeader } from '../common/PageHeader';
import {
  Truck,
  Scale,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  RefreshCw,
  QrCode,
  Package,
  Layers,
  FileText,
  Clock,
  Search,
} from 'lucide-react';

interface LoadingOperatorTerminalProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const LoadingOperatorTerminal: React.FC<LoadingOperatorTerminalProps> = ({
  activeTab = 'terminal',
  setActiveTab,
}) => {
  const {
    orders,
    vehicles,
    updateLoadingProgress,
    completeLoading,
    openModal,
    showToast,
  } = useApp();

  // Find active loading order
  const activeOrder =
    orders.find((o) => o.status === 'loading' || o.status === 'payment_verified' || o.status === 'loading_planned') ||
    orders[0];

  const assignedVehicle =
    vehicles.find((v) => v.registrationNumber === activeOrder?.assignedVehicle) || vehicles[0];

  const maxBagsAllowed = activeOrder ? TRUCK_LIMITS[activeOrder.truckCapacity].maxBags : 400;

  // Local terminal controls
  const [loadedBags, setLoadedBags] = useState<number>(activeOrder?.loadingProgressBags ?? 372);
  const [tareWeight, setTareWeight] = useState<number>(activeOrder?.tareWeightKg ?? 9450);
  const [grossWeight, setGrossWeight] = useState<number>(activeOrder?.grossWeightKg ?? 28050);
  const [sealNumber, setSealNumber] = useState<string>(activeOrder?.sealNumber || 'BFEL-SEAL-89421');

  useEffect(() => {
    if (activeOrder) {
      setLoadedBags(activeOrder.loadingProgressBags ?? 372);
      setTareWeight(activeOrder.tareWeightKg ?? 9450);
      setGrossWeight(activeOrder.grossWeightKg ?? 28050);
      if (activeOrder.sealNumber) setSealNumber(activeOrder.sealNumber);
    }
  }, [activeOrder?.id]);

  const netWeight = Math.max(0, grossWeight - tareWeight);
  const currentExpectedNet = loadedBags * BAG_WEIGHT_KG;
  const variance = netWeight - currentExpectedNet;
  const isToleranceExceeded = Math.abs(variance) > 100;
  const isCapacityExceeded = loadedBags > maxBagsAllowed;

  // Visual cargo-bed layout
  const totalSlots = maxBagsAllowed / 10;
  const filledSlots = Math.min(totalSlots, Math.floor(loadedBags / 10));

  const handleBagAdjustment = (delta: number) => {
    const nextBags = Math.max(0, loadedBags + delta);
    if (nextBags > maxBagsAllowed) {
      showToast(`Truck capacity exceeded! Max ${maxBagsAllowed} bags for ${activeOrder.truckCapacity}.`, 'error');
    }
    setLoadedBags(nextBags);
    const nextGross = tareWeight + nextBags * BAG_WEIGHT_KG;
    setGrossWeight(nextGross);
    updateLoadingProgress(activeOrder.id, nextBags, tareWeight, nextGross, sealNumber);
  };

  const handleFinishLoading = () => {
    if (isCapacityExceeded) {
      showToast(`BLOCK ACTION: Truck capacity exceeded. Max ${maxBagsAllowed} bags for ${activeOrder.truckCapacity}.`, 'error');
      return;
    }

    if (!sealNumber.trim()) {
      showToast('Please enter security seal number before clearing dispatch.', 'error');
      return;
    }

    completeLoading(activeOrder.id, tareWeight, grossWeight, sealNumber);
    showToast(`Loading completed for ${activeOrder.id}. Gate Pass generated.`, 'success');
    openModal('gate_pass', { orderId: activeOrder.id });
  };

  const currentTab = activeTab;

  // 1. TODAY'S QUEUE WORKSPACE
  if (currentTab === 'queue') {
    const queuedTrucks = vehicles.filter((v) => v.status === 'queued' || v.status === 'available' || v.status === 'loading');
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Plant Kiosk', onClick: () => setActiveTab?.('terminal') },
            { label: "Today's Truck Queue" },
          ]}
          title="Plant Premise Truck Inflow Queue"
          subtitle="Trucks waiting at Plant Gate 2 for loading bay assignment and gross scale weighment."
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="p-3">Vehicle No</th>
                <th className="p-3">Capacity Type</th>
                <th className="p-3">Driver Name</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Assigned Bay</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {queuedTrucks.map((v) => (
                <tr key={v.registrationNumber}>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{v.registrationNumber}</td>
                  <td className="p-3 font-mono font-semibold">{v.capacity.replace('_', ' ')} ({v.maxBags} bags)</td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{v.driverName}</td>
                  <td className="p-3 font-mono text-slate-500">{v.driverPhone}</td>
                  <td className="p-3 font-mono font-bold text-blue-600">{v.currentBay || 'Bay 3'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-amber-100 text-amber-800">
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setActiveTab?.('terminal')}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs cursor-pointer shadow-xs"
                    >
                      Call to Bay 3 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 2. TRUCK PLANNER WORKSPACE
  if (currentTab === 'planner') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Plant Kiosk', onClick: () => setActiveTab?.('terminal') },
            { label: 'Truck Loading Planner' },
          ]}
          title="Loading Bay Allocation &amp; Turnaround Planner"
          subtitle="Plant Bay 1, Bay 2, Bay 3 & Bay 4 conveyor allocations."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {[
            { bay: 'Bay 1', status: 'Available', truck: 'MP09GH4567', capacity: '20 MT', driver: 'Mahesh Solanki', bags: '0 / 400', color: 'emerald' },
            { bay: 'Bay 2', status: 'Maintenance', truck: 'None', capacity: '—', driver: '—', bags: '—', color: 'slate' },
            { bay: 'Bay 3', status: 'Active Loading', truck: activeOrder.assignedVehicle || 'MP09AB1234', capacity: activeOrder.truckCapacity.replace('_', ' '), driver: activeOrder.assignedDriver || 'Ramlal Yadav', bags: `${loadedBags} / ${activeOrder.totalBags}`, color: 'amber' },
            { bay: 'Bay 4', status: 'Cleared', truck: 'MP09EF3456', capacity: '25 MT', driver: 'Balram Jat', bags: '500 / 500', color: 'blue' },
          ].map((b, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{b.bay}</h4>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                  b.color === 'amber' ? 'bg-amber-100 text-amber-800' : b.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {b.status}
                </span>
              </div>

              <div className="space-y-1 font-mono text-[11px] p-2.5 rounded bg-slate-50 dark:bg-slate-800/60">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Vehicle:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{b.truck}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Driver:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-sans">{b.driver}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Bags:</span>
                  <strong className="text-blue-600">{b.bags}</strong>
                </div>
              </div>

              {b.bay === 'Bay 3' ? (
                <button
                  onClick={() => setActiveTab?.('terminal')}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  Open Bay 3 Terminal →
                </button>
              ) : (
                <button
                  onClick={() => showToast(`${b.bay} queue inspected.`, 'info')}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  View Details
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. WEIGHBRIDGE MONITOR WORKSPACE
  if (currentTab === 'weighbridge') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Plant Kiosk', onClick: () => setActiveTab?.('terminal') },
            { label: 'Weighbridge Monitor' },
          ]}
          title="Digital Weighbridge Station #1 (Scale In &amp; Out)"
          subtitle="Calibrated Avery Weigh-Tronix digital gross/tare indicator with zero tolerance enforcement."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400">Scale Calibration Status</span>
            <div className="text-xl font-mono font-bold text-emerald-600 mt-1">NABL Certified</div>
            <span className="text-[10px] text-slate-500">Valid through Dec 2026</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400">Tare Weight (Empty Truck)</span>
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">{tareWeight} kg</div>
            <span className="text-[10px] text-slate-500">{bagsToMT(tareWeight / 50)} MT</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400">Gross Weight (Loaded Truck)</span>
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">{grossWeight} kg</div>
            <span className="text-[10px] text-slate-500">{bagsToMT(grossWeight / 50)} MT</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 text-white rounded-xl font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-amber-400 text-xs">LIVE DIGITAL SCALE INDICATOR</span>
            <span className="text-emerald-400 text-xs animate-pulse">● SIGNAL STABLE</span>
          </div>
          <div className="text-center py-6">
            <div className="text-5xl font-black text-white tracking-widest">{grossWeight} KG</div>
            <div className="text-sm text-slate-400 mt-2 font-sans">
              Net Cargo Weight: <strong>{netWeight} kg</strong> ({bagsToMT(netWeight / 50)} MT)
            </div>
            <div className="text-xs text-emerald-400 mt-1">
              Variance against expected: {variance >= 0 ? `+${variance}` : variance} kg (Tolerance ±100 kg)
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. COMPLETED LOADS WORKSPACE
  if (currentTab === 'completed') {
    const completedOrders = orders.filter((o) => o.status === 'dispatched' || o.status === 'delivered');
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Plant Kiosk', onClick: () => setActiveTab?.('terminal') },
            { label: 'Completed Loads' },
          ]}
          title="Completed Bay Truckloads &amp; Dispatches Today"
          subtitle="All trucks verified, sealed, and cleared through Gate 1 with official LR."
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Consignee</th>
                <th className="p-3">Bags / MT</th>
                <th className="p-3">Security Seal</th>
                <th className="p-3">LR Ref</th>
                <th className="p-3 text-right">Gate Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {completedOrders.map((o) => (
                <tr key={o.id}>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{o.id}</td>
                  <td className="p-3 font-mono font-bold">{o.assignedVehicle}</td>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{o.dealerAgency}</td>
                  <td className="p-3 font-mono">{o.totalBags} bags ({o.totalWeightMT} MT)</td>
                  <td className="p-3 font-mono text-emerald-600">{o.sealNumber || 'BFEL-SEAL-89421'}</td>
                  <td className="p-3 font-mono font-bold text-blue-600">{o.lrNumber}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openModal('gate_pass', { orderId: o.id })}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs cursor-pointer shadow-xs"
                    >
                      View Gate Pass
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. GATE PASS & SEALS WORKSPACE
  if (currentTab === 'gate_pass') {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumbs={[
            { label: 'Plant Kiosk', onClick: () => setActiveTab?.('terminal') },
            { label: 'Gate Passes & Seals' },
          ]}
          title="Security Gate Passes &amp; Tamper Seals Ledger"
          subtitle="Official plant egress clearance documents and driver verification QR."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {orders.slice(0, 4).map((o) => (
            <div
              key={o.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <span className="font-mono text-[10px] text-slate-400">Gate Pass Ref: GP-IND-{o.id.replace('BFEL-2026-', '')}</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{o.assignedVehicle || 'MP09AB1234'}</h4>
                </div>
                <StatusBadge status={o.status} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 font-sans block text-[10px]">Order &amp; Destination</span>
                  <strong>{o.id}</strong>
                  <div className="text-slate-500 font-sans">{o.destination}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block text-[10px]">Security Tamper Seal</span>
                  <strong className="text-emerald-600">{o.sealNumber || 'BFEL-SEAL-89421'}</strong>
                  <div className="text-slate-500 font-sans">{o.totalBags} Bags ({o.totalWeightMT} MT)</div>
                </div>
              </div>

              <button
                onClick={() => openModal('gate_pass', { orderId: o.id })}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer text-center"
              >
                Inspect Official Gate Pass Document →
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // DEFAULT: TABLET/KIOSK LOADING TERMINAL
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Terminal Title Bar */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono text-[10px] uppercase tracking-wider border border-amber-500/30">
              PLANT BAY 3 TERMINAL
            </span>
            <span className="text-xs text-emerald-400 font-mono">● LIVE BAG COUNTER ONLINE</span>
          </div>
          <h1 className="text-xl font-extrabold text-white mt-1">
            Indore Plant Loading &amp; Weighbridge Terminal
          </h1>
          <p className="text-xs text-slate-400">
            Station Operator: Kailash Verma · Manglia Plant, Indore (M.P.)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab?.('queue')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Truck Queue →
          </button>
        </div>
      </div>

      {/* Main Terminal Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Big Tactile Bag Counter (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Consignment #{activeOrder?.id} · {activeOrder?.dealerAgency}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {activeOrder?.items[0]?.productName || 'BFEL Dudh Dhara 50kg'}
                </h3>
              </div>
              <StatusBadge status={activeOrder?.status || 'loading'} size="sm" />
            </div>

            {/* Huge Bag Counter Display */}
            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                Bags Loaded into Truck
              </span>
              <div className="text-6xl font-black font-mono text-slate-900 dark:text-white my-1 tracking-tight">
                {loadedBags}
                <span className="text-xl text-slate-400 font-normal"> / {activeOrder?.totalBags || 400} bags</span>
              </div>
              <div className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                {(loadedBags * BAG_WEIGHT_KG).toLocaleString()} / {((activeOrder?.totalWeightMT || 20) * 1000).toLocaleString()} kg ({((loadedBags * BAG_WEIGHT_KG) / 1000).toFixed(2)} / {activeOrder?.totalWeightMT || 20} MT)
              </div>
              <div className="pt-1 flex items-center justify-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                  !isToleranceExceeded
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                }`}>
                  {!isToleranceExceeded ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tolerance Acceptable (±100 kg)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Tolerance Exceeded (±100 kg)</span>
                    </>
                  )}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                  !isCapacityExceeded
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                }`}>
                  {!isCapacityExceeded ? 'Capacity Verified' : 'Capacity Exceeded'}
                </span>
              </div>
            </div>

            {/* Big Tactile Adjustment Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleBagAdjustment(-10)}
                className="py-3 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-sm cursor-pointer transition-colors"
              >
                -10 Bags
              </button>
              <button
                type="button"
                onClick={() => handleBagAdjustment(-1)}
                className="py-3 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-sm cursor-pointer transition-colors"
              >
                -1 Bag
              </button>
              <button
                type="button"
                onClick={() => handleBagAdjustment(1)}
                className="py-3 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-mono font-black text-sm cursor-pointer transition-colors shadow-xs"
              >
                +1 Bag
              </button>
              <button
                type="button"
                onClick={() => handleBagAdjustment(10)}
                className="py-3 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-mono font-black text-sm cursor-pointer transition-colors shadow-xs"
              >
                +10 Bags
              </button>
            </div>

            {/* Visual Cargo-bed layout */}
            <div className="pt-2">
              <TruckCapacityVisualizer
                capacityType={activeOrder?.truckCapacity || '20_MT'}
                currentBags={loadedBags}
                label="Active Bay Live Cargo Bed Elevation"
                showAxleLayout={true}
                showDisclaimers={false}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Weighbridge & Seal (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-500" />
              Weighbridge Scale Integration
            </h3>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-sans block">Tare Weight</span>
                <strong className="text-base text-slate-900 dark:text-white">{tareWeight} kg</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-sans block">Gross Reading</span>
                <strong className="text-base text-slate-900 dark:text-white">{grossWeight} kg</strong>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">Net Cargo Weight:</span>
                <strong className="text-base text-emerald-600">{netWeight} kg</strong>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span>Variance:</span>
                <span className={isToleranceExceeded ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                  {variance >= 0 ? `+${variance}` : variance} kg (Tolerance ±100 kg)
                </span>
              </div>
            </div>

            {/* Security Seal */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Security Tamper Seal Barcode *
              </label>
              <input
                type="text"
                value={sealNumber}
                onChange={(e) => setSealNumber(e.target.value)}
                placeholder="BFEL-SEAL-XXXXX"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-sm"
              />
            </div>

            {/* Complete Loading Primary CTA */}
            <button
              type="button"
              onClick={handleFinishLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <FileCheck className="w-5 h-5" />
              <span>Complete Loading &amp; Issue Gate Pass</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
