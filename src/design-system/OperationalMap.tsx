import React, { useState, useRef, useId, useMemo } from 'react';
import {
  MapPin,
  Truck,
  Building,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Filter,
  Layers,
  List,
  Map as MapIcon,
  ShieldCheck,
  Clock,
  Phone,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  Compass,
  Radio,
  Activity,
  Crosshair,
  Maximize2,
} from 'lucide-react';
import { UserRole } from '../types';

export interface MapLocationMarker {
  id: string;
  name: string;
  type: 'plant' | 'dealer' | 'distributor' | 'shipment';
  categoryLabel?: string;
  town: string;
  district: string;
  state: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  coordinates: { x: number; y: number }; // Calibrated regional vector coordinates
  status?: string;
  activeOrdersCount?: number;
  lastMilestone?: string;
  transitProgress?: number; // 0 to 100% for in-transit trucks
  routeTo?: { x: number; y: number; label: string };
  assignedVehicle?: string;
  sealNumber?: string;
  lrNumber?: string;
}

export interface OperationalMapProps {
  role?: 'admin' | 'dealer' | 'sales_agent' | 'distributor';
  title?: string;
  subtitle?: string;
  markers?: MapLocationMarker[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: MapLocationMarker | null) => void;
  showLayersControl?: boolean;
  showViewToggle?: boolean;
  allowSearch?: boolean;
  initialZoom?: number;
  className?: string;
  height?: string | number;
}

/**
 * Authoritative Central India / Malwa Logistics Seed Network
 * Strictly anchored to registered mandi yards and plant premises in M.P.
 */
export const DEFAULT_CORRIDOR_MARKERS: MapLocationMarker[] = [
  {
    id: 'plant-manglia',
    name: 'BFEL Central Extraction Mill & Dispatch Terminal',
    type: 'plant',
    categoryLabel: 'Primary Manufacturing Plant',
    town: 'Manglia Industrial Area, Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    address: 'Survey No. 44/2, A.B. Road, Manglia, Indore - 453771',
    contactPerson: 'Kailash Verma (Dispatch Supt.)',
    phone: '+91 731 2894100',
    coordinates: { x: 500, y: 320 },
    status: 'ACTIVE_DISPATCH',
    activeOrdersCount: 6,
    lastMilestone: 'Dual Avery Weighbridge Terminal Online (24x7)',
  },
  {
    id: 'dealer-dewas',
    name: 'Patel Agro Agency',
    type: 'dealer',
    categoryLabel: 'Tier-1 Mandi Dealer',
    town: 'Dewas Mandi Yard',
    district: 'Dewas',
    state: 'Madhya Pradesh',
    address: 'Godown 12, Krishi Upaj Mandi, Dewas - 455001',
    contactPerson: 'Ramesh Patel',
    phone: '+91 98260 41290',
    coordinates: { x: 670, y: 230 },
    status: 'ORDER_ACTIVE',
    activeOrdersCount: 1,
    lastMilestone: 'Consignment In Transit via NH-52',
  },
  {
    id: 'dealer-khargone',
    name: 'Nimar Kisan Kendra',
    type: 'dealer',
    categoryLabel: 'Tier-1 Mandi Dealer',
    town: 'Khargone Main Depot',
    district: 'Khargone',
    state: 'Madhya Pradesh',
    address: 'Bistan Road By-pass, Khargone - 451001',
    contactPerson: 'Kishore Mandloi',
    phone: '+91 94250 88219',
    coordinates: { x: 410, y: 620 },
    status: 'CLEAR',
    activeOrdersCount: 1,
    lastMilestone: 'Advance Remittance Verified (UTR Cleared)',
  },
  {
    id: 'dealer-sanwer',
    name: 'Malwa Pashu Aahar',
    type: 'dealer',
    categoryLabel: 'Tier-1 Mandi Dealer',
    town: 'Sanwer By-pass Mandi',
    district: 'Indore',
    state: 'Madhya Pradesh',
    address: 'Ujjain Road, Sanwer - 453551',
    contactPerson: 'Omprakash Joshi',
    phone: '+91 98930 77140',
    coordinates: { x: 470, y: 220 },
    status: 'PAYMENT_PENDING',
    activeOrdersCount: 1,
    lastMilestone: 'Awaiting Bank Advance Remittance',
  },
  {
    id: 'dealer-ujjain',
    name: 'Choudhary Kisan Kendra',
    type: 'dealer',
    categoryLabel: 'Tier-1 Mandi Dealer',
    town: 'Ujjain Rural Mandi',
    district: 'Ujjain',
    state: 'Madhya Pradesh',
    address: 'Agar Road, Chimanganj Mandi, Ujjain - 456006',
    contactPerson: 'Gopal Choudhary',
    phone: '+91 94250 99120',
    coordinates: { x: 430, y: 130 },
    status: 'CLEAR',
    activeOrdersCount: 0,
    lastMilestone: 'Prior Consignment Delivered with Clean Proof',
  },
  {
    id: 'distributor-nimar',
    name: 'Nimar Wholesale Hub (Stockist #04)',
    type: 'distributor',
    categoryLabel: 'Regional Stockist Partner',
    town: 'Barwaha Regional Depot',
    district: 'Khargone',
    state: 'Madhya Pradesh',
    address: 'Warehouse 4, Highway By-pass, Barwaha - 451115',
    contactPerson: 'Rajendra Solanki',
    phone: '+91 98270 54109',
    coordinates: { x: 630, y: 510 },
    status: 'ACTIVE_DISTRIBUTION',
    activeOrdersCount: 2,
    lastMilestone: '₹10,00,000 Credit Headroom Maintained',
  },
  {
    id: 'shipment-dewas-transit',
    name: 'Consignment MP09AB1234 (400 Bags / 20 MT)',
    type: 'shipment',
    categoryLabel: 'In-Transit Consignment',
    town: 'En-route Dewas (NH-52)',
    district: 'Dewas Sector',
    state: 'Madhya Pradesh',
    coordinates: { x: 590, y: 270 }, // Midpoint along NH-52
    status: 'IN_TRANSIT',
    assignedVehicle: 'MP-09-AB-1234',
    sealNumber: 'SEAL-IND-8841',
    lrNumber: 'LR-2026-99410',
    transitProgress: 65,
    routeTo: { x: 670, y: 230, label: 'Dewas Mandi Yard' },
    lastMilestone: 'Departed Manglia Weighbridge at 14:10 · ETA 45m',
  },
];

/**
 * OperationalMap
 * 
 * Vector-based, zero-dependency, theme-reactive GIS logistics map designed for
 * Central India cattle-feed distribution. Supports pan, zoom, layer filtering,
 * interactive marker inspect panels, live highway flow animations, and list/map toggling.
 */
export const OperationalMap: React.FC<OperationalMapProps> = ({
  role = 'admin',
  title = 'Regional Distribution & Consignment Logistics Map',
  subtitle = 'Central India logistics corridor: Manufacturing plant, registered mandi godowns, and authorized fleet routes.',
  markers = DEFAULT_CORRIDOR_MARKERS,
  selectedMarkerId = null,
  onSelectMarker,
  showLayersControl = true,
  showViewToggle = true,
  allowSearch = true,
  initialZoom = 1,
  className = '',
  height = '540px',
}) => {
  const mapId = useId();
  const svgRef = useRef<SVGSVGElement>(null);

  // View state
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeLayer, setActiveLayer] = useState<'all' | 'plant' | 'dealer' | 'distributor' | 'shipment'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSelectedMarker, setInternalSelectedMarker] = useState<MapLocationMarker | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<MapLocationMarker | null>(null);

  // Controlled or uncontrolled marker selection
  const currentSelectedMarker = useMemo(() => {
    if (selectedMarkerId) {
      return markers.find((m) => m.id === selectedMarkerId) || null;
    }
    return internalSelectedMarker;
  }, [selectedMarkerId, internalSelectedMarker, markers]);

  const handleMarkerClick = (marker: MapLocationMarker) => {
    setInternalSelectedMarker(marker);
    onSelectMarker?.(marker);
  };

  const handleClearSelection = () => {
    setInternalSelectedMarker(null);
    onSelectMarker?.(null);
  };

  // Focus on specific location with smooth calibrated pan & zoom
  const focusOnLocation = (marker: MapLocationMarker) => {
    // Map center is (500, 350)
    const targetX = (500 - marker.coordinates.x) * 0.45;
    const targetY = (350 - marker.coordinates.y) * 0.45;
    setPan({ x: targetX, y: targetY });
    setZoom(1.3);
    handleMarkerClick(marker);
  };

  // Filtered markers based on role, layer, and search query
  const filteredMarkers = useMemo(() => {
    return markers.filter((m) => {
      // Role-specific scoping
      if (role === 'dealer' && m.type === 'dealer' && m.id !== 'dealer-dewas') {
        return false; // Dealer only sees their own godown and central plant
      }
      if (role === 'sales_agent' && m.type === 'distributor') {
        return false; // Sales agent focused on retail dealers
      }

      // Layer filtering
      if (activeLayer !== 'all' && m.type !== activeLayer) {
        return false;
      }

      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesTown = m.town.toLowerCase().includes(q);
        const matchesDistrict = m.district.toLowerCase().includes(q);
        const matchesVehicle = m.assignedVehicle?.toLowerCase().includes(q);
        if (!matchesName && !matchesTown && !matchesDistrict && !matchesVehicle) {
          return false;
        }
      }

      return true;
    });
  }, [markers, role, activeLayer, searchQuery]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      aria-labelledby={`${mapId}-title`}
      className={`
        rounded-2xl bg-white dark:bg-[#0B1017]
        border border-slate-200 dark:border-[#1B2636]
        shadow-sm overflow-hidden flex flex-col text-slate-900 dark:text-slate-100
        transition-colors ${className}
      `}
    >
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1B2636] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 id={`${mapId}-title`} className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
              Malwa-Nimar Corridor
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Action Controls & View Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {allowSearch && (
            <div className="relative w-44 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter Mandi, Vehicle, City..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#070B10] border border-slate-200 dark:border-[#1B2636] text-xs font-sans text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {showViewToggle && (
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-[#1B2636] p-0.5 bg-slate-50 dark:bg-[#070B10]">
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white dark:bg-[#111823] text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-[#111823] text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Facility Ledger ({filteredMarkers.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Corridor Live Telemetry Status Strip */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-[#070C12] border-b border-slate-200 dark:border-[#1B2636] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Manglia Extraction Mill: Online</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <span>Mandi Depots:</span>
            <strong className="text-slate-900 dark:text-white">4 Active</strong>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <span>En Route (NH-52):</span>
            <strong className="text-cyan-600 dark:text-cyan-400">1 FTL Consignment</strong>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <span>Calibration:</span>
            <strong className="text-amber-600 dark:text-amber-400">Avery Scale ±100kg</strong>
          </div>
        </div>
        <div className="text-slate-400 text-[10px] hidden md:block">
          Datum: WGS84 · Central M.P. Corridor
        </div>
      </div>

      {/* 3. Layer Filter Buttons & Quick Hub Focus (When in Map View) */}
      {showLayersControl && viewMode === 'map' && (
        <div className="px-4 py-2 bg-slate-100/60 dark:bg-[#0A0F17] border-b border-slate-200 dark:border-[#1B2636] flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Layer selection buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mr-1">Layer:</span>
            <button
              type="button"
              onClick={() => setActiveLayer('all')}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] cursor-pointer transition-colors ${
                activeLayer === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                  : 'bg-white dark:bg-[#111823] border border-slate-200 dark:border-[#1B2636] text-slate-600 dark:text-slate-400'
              }`}
            >
              All Hubs ({markers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('plant')}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] cursor-pointer transition-colors ${
                activeLayer === 'plant'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                  : 'bg-white dark:bg-[#111823] border border-slate-200 dark:border-[#1B2636] text-amber-600 dark:text-amber-400'
              }`}
            >
              Factory Plant
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('dealer')}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] cursor-pointer transition-colors ${
                activeLayer === 'dealer'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-[#111823] border border-slate-200 dark:border-[#1B2636] text-emerald-600 dark:text-emerald-400'
              }`}
            >
              Dealers ({markers.filter((m) => m.type === 'dealer').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('distributor')}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] cursor-pointer transition-colors ${
                activeLayer === 'distributor'
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-[#111823] border border-slate-200 dark:border-[#1B2636] text-blue-600 dark:text-blue-400'
              }`}
            >
              Distributors
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('shipment')}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] cursor-pointer transition-colors ${
                activeLayer === 'shipment'
                  ? 'bg-cyan-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-[#111823] border border-slate-200 dark:border-[#1B2636] text-cyan-600 dark:text-cyan-400'
              }`}
            >
              Active Dispatches
            </button>
          </div>

          {/* Quick Focus Hub Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
            <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0 mr-1">
              <Crosshair className="w-3 h-3 text-amber-500" />
              <span>Quick Focus:</span>
            </span>
            {markers.map((m) => {
              const isSelected = currentSelectedMarker?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => focusOnLocation(m)}
                  className={`px-2 py-0.5 rounded-md border whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-2xs'
                      : 'bg-white dark:bg-[#0D1520] border-slate-200 dark:border-[#1F2C3F] text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  }`}
                  title={`Focus on ${m.name}`}
                >
                  <span>{m.type === 'plant' ? '🏭' : m.type === 'shipment' ? '🚚' : m.type === 'dealer' ? '🏬' : '🏢'}</span>
                  <span>{m.town.split(',')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Main Display Area: Map or List View */}
      {viewMode === 'map' ? (
        <div className="relative w-full bg-slate-900 dark:bg-[#040609] overflow-hidden select-none" style={{ height }}>
          {/* Zoom & View Controls Overlay */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              aria-label="Zoom In"
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset View (1x)"
              aria-label="Reset View"
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center justify-center cursor-pointer transition-colors font-mono text-[10px]"
            >
              1x
            </button>
          </div>

          {/* Top-Left Geographic Compass Rose */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 p-2 rounded-xl bg-slate-950/75 backdrop-blur-xs border border-slate-800/80 text-[10px] font-mono text-slate-400">
            <div className="w-7 h-7 rounded-full border border-amber-500/40 flex items-center justify-center relative bg-slate-900/80">
              <Compass className="w-4 h-4 text-amber-500" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-slate-200">MALWA-NIMAR GRID</div>
              <div className="text-[9px] text-slate-500">22.7°N · 75.8°E (MP)</div>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <svg
            ref={svgRef}
            viewBox="0 0 1000 700"
            className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300"
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: '50% 50%',
            }}
          >
            <style>
              {`
                @keyframes highwayFlowPulse {
                  from { stroke-dashoffset: 48; }
                  to { stroke-dashoffset: 0; }
                }
                .flow-highway {
                  animation: highwayFlowPulse 2.5s linear infinite;
                }
                @keyframes radarPulseRing {
                  0% { r: 14px; opacity: 0.9; }
                  100% { r: 36px; opacity: 0; }
                }
                .pulse-beacon {
                  animation: radarPulseRing 2.4s cubic-bezier(0.1, 0.7, 0.1, 1) infinite;
                }
              `}
            </style>

            <defs>
              {/* Radial Glow Gradients */}
              <radialGradient id="plantGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="dealerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="transitGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="narmadaRiverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284C7" stopOpacity="0.1" />
                <stop offset="30%" stopColor="#0284C7" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
              </linearGradient>

              {/* GIS Coordinate Graticule Pattern */}
              <pattern id="gisCoordinateGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#1B2636" strokeWidth="0.6" strokeOpacity="0.5" />
                <circle cx="80" cy="80" r="1" fill="#334155" />
              </pattern>

              <filter id="shadowGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* GIS Graticule Mesh Background */}
            <rect width="1000" height="700" fill="url(#gisCoordinateGrid)" />

            {/* Geographical Background: Stylized Regional District Outlines (Indore, Ujjain, Dewas, Khargone) */}
            <g id="districtContours" className="opacity-45">
              {/* Malwa Plateau Regional Shape */}
              <path
                d="M 180 320 Q 300 100 500 80 Q 750 90 850 200 Q 880 400 750 580 Q 550 680 350 650 Q 150 550 180 320 Z"
                fill="#0A1017"
                stroke="#1B2636"
                strokeWidth="1.8"
              />

              {/* Watermark District Region Labels */}
              <text x="320" y="270" fill="#1E293B" className="text-[14px] font-mono tracking-widest font-extrabold uppercase select-none">
                INDORE DISTRICT
              </text>
              <text x="680" y="160" fill="#1E293B" className="text-[13px] font-mono tracking-widest font-extrabold uppercase select-none">
                DEWAS SECTOR
              </text>
              <text x="360" y="110" fill="#1E293B" className="text-[13px] font-mono tracking-widest font-extrabold uppercase select-none">
                UJJAIN AGRI BELT
              </text>
              <text x="440" y="650" fill="#1E293B" className="text-[13px] font-mono tracking-widest font-extrabold uppercase select-none">
                WEST NIMAR / KHARGONE
              </text>

              {/* Narmada Valley Basin (South Boundary River) */}
              <path
                d="M 150 540 Q 380 560 550 530 T 880 545"
                fill="none"
                stroke="url(#narmadaRiverGradient)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 150 540 Q 380 560 550 530 T 880 545"
                fill="none"
                stroke="#0284C7"
                strokeWidth="2"
                strokeDasharray="10 8"
                className="opacity-75"
              />
              <text x="690" y="562" fill="#38BDF8" className="text-[10px] font-mono tracking-widest font-semibold uppercase opacity-90">
                ≈ Narmada Basin Corridor ≈
              </text>
            </g>

            {/* Highway Artery Network (Central India Primary Logistic Routes) */}
            <g id="highwayNetwork">
              {/* NH-52: Indore Manglia to Dewas */}
              {/* Glow Underlay */}
              <path
                d="M 500 320 Q 580 270 670 230"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="8"
                className="opacity-20"
              />
              {/* Animated Flow Line */}
              <path
                d="M 500 320 Q 580 270 670 230"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
                strokeDasharray="8 6"
                className="flow-highway opacity-85"
              />
              {/* NH-52 Highway Shield Badge */}
              <g transform="translate(565, 235)">
                <rect width="44" height="18" rx="4" fill="#0A0F17" stroke="#F59E0B" strokeWidth="1.2" />
                <text x="22" y="13" fill="#F59E0B" textAnchor="middle" className="text-[9px] font-mono font-extrabold">NH-52</text>
              </g>

              {/* SH-27: Indore to Sanwer & Ujjain */}
              {/* Glow Underlay */}
              <path
                d="M 500 320 L 470 220 L 430 130"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="7"
                className="opacity-20"
              />
              {/* Animated Flow Line */}
              <path
                d="M 500 320 L 470 220 L 430 130"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className="flow-highway opacity-80"
              />
              {/* SH-27 Highway Shield Badge */}
              <g transform="translate(425, 160)">
                <rect width="44" height="18" rx="4" fill="#0A0F17" stroke="#38BDF8" strokeWidth="1.2" />
                <text x="22" y="13" fill="#38BDF8" textAnchor="middle" className="text-[9px] font-mono font-extrabold">SH-27</text>
              </g>

              {/* NH-347BG: Indore to Barwaha & Khargone */}
              {/* Glow Underlay */}
              <path
                d="M 500 320 Q 560 420 630 510 Q 520 580 410 620"
                fill="none"
                stroke="#10B981"
                strokeWidth="7"
                className="opacity-20"
              />
              {/* Animated Flow Line */}
              <path
                d="M 500 320 Q 560 420 630 510 Q 520 580 410 620"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeDasharray="8 6"
                className="flow-highway opacity-80"
              />
              {/* NH-347BG Highway Shield Badge */}
              <g transform="translate(540, 440)">
                <rect width="62" height="18" rx="4" fill="#0A0F17" stroke="#10B981" strokeWidth="1.2" />
                <text x="31" y="13" fill="#10B981" textAnchor="middle" className="text-[9px] font-mono font-extrabold">NH-347BG</text>
              </g>
            </g>

            {/* Interactive Location Markers */}
            <g id="markersGroup">
              {filteredMarkers.map((marker) => {
                const isSelected = currentSelectedMarker?.id === marker.id;
                const isHovered = hoveredMarker?.id === marker.id;
                const isPlant = marker.type === 'plant';
                const isShipment = marker.type === 'shipment';
                const isDealer = marker.type === 'dealer';
                const isDistributor = marker.type === 'distributor';

                const markerColor = isPlant
                  ? '#F59E0B'
                  : isShipment
                  ? '#38BDF8'
                  : isDealer
                  ? '#10B981'
                  : '#3B82F6';

                return (
                  <g
                    key={marker.id}
                    onClick={() => handleMarkerClick(marker)}
                    onMouseEnter={() => setHoveredMarker(marker)}
                    onMouseLeave={() => setHoveredMarker(null)}
                    className="cursor-pointer group transition-all"
                    filter="url(#shadowGlow)"
                  >
                    {/* Ambient Pulsing Radar Ring for Central Plant & In-Transit Trucks */}
                    {(isPlant || isShipment || isSelected) && (
                      <circle
                        cx={marker.coordinates.x}
                        cy={marker.coordinates.y}
                        r={isSelected ? 28 : isPlant ? 24 : 18}
                        fill={isPlant ? 'url(#plantGlow)' : isShipment ? 'url(#transitGlow)' : 'none'}
                        stroke={markerColor}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        className="animate-spin pointer-events-none"
                        style={{ animationDuration: isPlant ? '10s' : '6s' }}
                      />
                    )}

                    {/* Outer Pin Body */}
                    <circle
                      cx={marker.coordinates.x}
                      cy={marker.coordinates.y}
                      r={isPlant ? 15 : isShipment ? 13 : 11}
                      fill={markerColor}
                      stroke="#06080C"
                      strokeWidth={isSelected ? 3.5 : 2}
                      className="group-hover:scale-125 transition-transform origin-center"
                    />

                    {/* Inner Core */}
                    <circle
                      cx={marker.coordinates.x}
                      cy={marker.coordinates.y}
                      r={isPlant ? 6 : 4.5}
                      fill="#FFFFFF"
                      className="pointer-events-none"
                    />

                    {/* Facility Label Pill */}
                    <g className="transition-opacity pointer-events-none">
                      <rect
                        x={marker.coordinates.x + 14}
                        y={marker.coordinates.y - 12}
                        width={marker.name.length * 6.5 + 24}
                        height={22}
                        rx="5"
                        fill="#06080C"
                        stroke={isSelected ? markerColor : isHovered ? '#64748B' : '#1E293B'}
                        strokeWidth={isSelected ? 1.5 : 1}
                        className="opacity-95"
                      />
                      <text
                        x={marker.coordinates.x + 22}
                        y={marker.coordinates.y + 3}
                        fill="#F8FAFC"
                        className="text-[10px] font-sans font-bold select-none"
                      >
                        {marker.town}
                      </text>
                    </g>

                    {/* Active Transit ETA Tag for Trucks */}
                    {isShipment && (
                      <g transform={`translate(${marker.coordinates.x - 30}, ${marker.coordinates.y - 32})`}>
                        <rect width="60" height="16" rx="4" fill="#082F49" stroke="#38BDF8" strokeWidth="1" />
                        <text x="30" y="11" fill="#38BDF8" textAnchor="middle" className="text-[8px] font-mono font-bold">
                          ETA 45m · 65%
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Calibrated Distance Scale Indicator (Bottom Right of SVG) */}
            <g transform="translate(820, 660)" className="opacity-80 select-none">
              <rect x="-10" y="-16" width="160" height="26" rx="4" fill="#080D14" stroke="#1E293B" strokeWidth="1" />
              <line x1="0" y1="0" x2="140" y2="0" stroke="#F59E0B" strokeWidth="2" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#F59E0B" strokeWidth="2" />
              <line x1="70" y1="-3" x2="70" y2="3" stroke="#F59E0B" strokeWidth="1.5" />
              <line x1="140" y1="-5" x2="140" y2="5" stroke="#F59E0B" strokeWidth="2" />
              <text x="0" y="-7" fill="#94A3B8" className="text-[8px] font-mono font-bold">0</text>
              <text x="60" y="-7" fill="#94A3B8" className="text-[8px] font-mono font-bold">25 km</text>
              <text x="120" y="-7" fill="#F59E0B" className="text-[8px] font-mono font-extrabold">50 km</text>
            </g>
          </svg>

          {/* 5. Interactive Hover Tooltip Overlay (when hovering over a marker) */}
          {hoveredMarker && !currentSelectedMarker && (
            <div
              className="absolute pointer-events-none z-30 p-2.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-800 text-white shadow-xl text-xs space-y-1 transition-opacity"
              style={{
                left: `${Math.min(750, Math.max(20, (hoveredMarker.coordinates.x * zoom + pan.x) / 1000 * 100))}%`,
                top: `${Math.min(500, Math.max(30, (hoveredMarker.coordinates.y * zoom + pan.y) / 700 * 100))}%`,
                transform: 'translate(-50%, -125%)',
              }}
            >
              <div className="font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>{hoveredMarker.name}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {hoveredMarker.town} ({hoveredMarker.district})
              </div>
              <div className="text-[10px] text-emerald-400 font-mono font-semibold">
                ● {hoveredMarker.lastMilestone || hoveredMarker.status}
              </div>
            </div>
          )}

          {/* 6. Selected Marker Detail Inspector Overlay (Float Card) */}
          {currentSelectedMarker && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-30 p-4 rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-800 text-white shadow-2xl space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        currentSelectedMarker.type === 'plant'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : currentSelectedMarker.type === 'shipment'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : currentSelectedMarker.type === 'dealer'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {currentSelectedMarker.categoryLabel || currentSelectedMarker.type}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {currentSelectedMarker.town}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    {currentSelectedMarker.name}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Operational Status</span>
                  <span className="text-emerald-400 font-bold">{currentSelectedMarker.status}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">District Authority</span>
                  <span className="text-white">{currentSelectedMarker.district}, M.P.</span>
                </div>
              </div>

              {/* Milestone Info */}
              {currentSelectedMarker.lastMilestone && (
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3 text-amber-500" />
                    Latest Validated Milestone:
                  </span>
                  <p className="text-slate-300 font-mono">{currentSelectedMarker.lastMilestone}</p>
                </div>
              )}

              {/* Transit Specific Telemetry */}
              {currentSelectedMarker.type === 'shipment' && (
                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] font-mono space-y-1 text-cyan-300">
                  <div className="flex justify-between">
                    <span>Vehicle: {currentSelectedMarker.assignedVehicle}</span>
                    <span>LR: {currentSelectedMarker.lrNumber}</span>
                  </div>
                  <div>Security Seal: {currentSelectedMarker.sealNumber}</div>
                </div>
              )}

              {/* Address & Contact */}
              {currentSelectedMarker.address && (
                <div className="text-[11px] text-slate-400 leading-snug">
                  <div><strong>Address:</strong> {currentSelectedMarker.address}</div>
                  {currentSelectedMarker.contactPerson && (
                    <div className="mt-0.5">
                      <strong>Contact:</strong> {currentSelectedMarker.contactPerson} ({currentSelectedMarker.phone})
                    </div>
                  )}
                </div>
              )}

              {/* Inspector Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => focusOnLocation(currentSelectedMarker)}
                  className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Center On Marker</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] cursor-pointer transition-colors"
                >
                  Reset View
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 7. Accessible Facility Ledger List View */
        <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-[#070B10] text-[10px] font-mono uppercase text-slate-400">
              <tr>
                <th className="p-3">Facility / Consignment</th>
                <th className="p-3">Type</th>
                <th className="p-3">Mandi / Location</th>
                <th className="p-3">District</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {filteredMarkers.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => {
                    handleMarkerClick(m);
                    setViewMode('map');
                  }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    {m.name}
                    {m.assignedVehicle && (
                      <span className="block font-mono text-[10px] text-cyan-500">{m.assignedVehicle}</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.type === 'plant'
                          ? 'bg-amber-500/10 text-amber-500'
                          : m.type === 'shipment'
                          ? 'bg-cyan-500/10 text-cyan-500'
                          : m.type === 'dealer'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {m.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{m.town}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">{m.district}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        focusOnLocation(m);
                        setViewMode('map');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-mono text-[11px] font-semibold transition-colors"
                    >
                      <span>Locate</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
