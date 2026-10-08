import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Vehicle } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { VehicleDetailDrawer } from './VehicleDetailDrawer';
import {
  Truck,
  Users,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  ArrowRight,
} from 'lucide-react';

interface FleetMasterViewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
  onOpenOrder?: (orderId: string) => void;
}

export const FleetMasterView: React.FC<FleetMasterViewProps> = ({
  onNavigateToTab,
  onOpenOrder,
}) => {
  const { vehicles } = useApp();
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers' | 'bays'>('vehicles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const filteredVehicles = vehicles.filter((v) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchNum = v.registrationNumber.toLowerCase().includes(q);
      const matchDriver = v.driverName.toLowerCase().includes(q);
      const matchOrder = v.currentOrderId && v.currentOrderId.toLowerCase().includes(q);
      if (!matchNum && !matchDriver && !matchOrder) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Master Data', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Fleet & Driver Master' },
        ]}
        title="Fleet &amp; Driver Master"
        subtitle="Commercial truck fleet registry, verified heavy vehicle drivers, and plant loading bay assignments."
        badge={{ text: `${vehicles.length} Trucks Registered`, variant: 'blue' }}
      />

      {/* Tabs and Search */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {[
            { id: 'vehicles', label: `Vehicles (${vehicles.length})`, icon: Truck },
            { id: 'drivers', label: `Commercial Drivers (${vehicles.length})`, icon: Users },
            { id: 'bays', label: 'Plant Loading Bays (4)', icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Vehicle, Driver, Order..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>
      </div>

      {/* View: Vehicles */}
      {activeTab === 'vehicles' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Vehicle Number</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Designated Driver</th>
                  <th className="py-3 px-4">Current Bay</th>
                  <th className="py-3 px-4">Current Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVehicles.map((v) => (
                  <tr
                    key={v.registrationNumber}
                    onClick={() => setSelectedVehicle(v)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {v.registrationNumber}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {v.capacity.replace('_', ' ')}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{v.driverName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{v.driverPhone}</div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {v.currentBay || 'Bay 3 (Manglia)'}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {v.currentOrderId || <span className="text-slate-400 italic font-sans">Available</span>}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        v.status === 'loading'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : v.status === 'dispatched'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}>
                        {v.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicle(v);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-semibold text-[11px] cursor-pointer"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View: Drivers */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.registrationNumber}
              onClick={() => setSelectedVehicle(v)}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-amber-500 transition-colors cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                    {v.driverName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{v.driverName}</h4>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {v.driverPhone}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  Verified DL
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px]">
                <span className="text-slate-500">Assigned Truck:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{v.registrationNumber}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View: Loading Bays */}
      {activeTab === 'bays' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'Bay 1', status: 'Active Loading', vehicle: 'MP09CD5678', feed: 'Mahamilk Super 50kg', operator: 'Suresh Patil' },
            { id: 'Bay 2', status: 'Available', vehicle: 'None (Cleaned)', feed: 'Calf Starter / General', operator: 'Raju Rathore' },
            { id: 'Bay 3', status: 'Active Loading', vehicle: 'MP09AB1234', feed: 'Dudh Dhara 50kg', operator: 'Kailash Verma' },
            { id: 'Bay 4', status: 'Scheduled Maintenance', vehicle: 'Scale Calibration', feed: 'Bulk Extractions', operator: 'Engineering Team' },
          ].map((bay, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-black text-sm text-slate-900 dark:text-white">{bay.id}</span>
                <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                  bay.status.includes('Active')
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {bay.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">Truck: <strong className="font-mono text-slate-700 dark:text-slate-300">{bay.vehicle}</strong></div>
              <div className="text-[11px] text-slate-500">Feed: <strong className="text-slate-700 dark:text-slate-300">{bay.feed}</strong></div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                Operator: {bay.operator}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vehicle Detail Drawer */}
      <VehicleDetailDrawer
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onOpenOrder={onOpenOrder}
      />
    </div>
  );
};
