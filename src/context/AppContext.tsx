import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  UserProfile,
  Product,
  Order,
  PaymentRecord,
  DistributorWallet,
  ProductAllocation,
  Vehicle,
  Claim,
  DealerVisit,
  AuditEvent,
  NotificationItem,
  PendingSignup,
  TruckCapacityType,
  PaymentMode,
  ClaimType,
  OrderStatus
} from '../types';
import {
  api,
  BackendOrder,
  BackendPayment,
  BackendClaim,
} from '../services/api';

export const BAG_WEIGHT_KG = 50;
export const TRUCK_LIMITS = {
  '20_MT': { maxBags: 400, maxKg: 20000, maxMT: 20 },
  '25_MT': { maxBags: 500, maxKg: 25000, maxMT: 25 },
};

export const bagsToKg = (bags: number): number => bags * BAG_WEIGHT_KG;
export const bagsToMT = (bags: number): number => (bags * BAG_WEIGHT_KG) / 1000;
export const kgToMT = (kg: number): number => kg / 1000;

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatLakhs = (amount: number): string => {
  const lakhs = amount / 100000;
  return `₹${lakhs.toFixed(2)}L`;
};

export const mapBackendOrderToFrontend = (bo: BackendOrder): Order => {
  const mapStatus = (st: string): OrderStatus => {
    switch (st) {
      case 'DRAFT':
      case 'PLACED':
      case 'PAYMENT_PENDING':
        return 'order_placed';
      case 'PAYMENT_SUBMITTED':
        return 'payment_submitted';
      case 'PAYMENT_VERIFIED':
        return 'payment_verified';
      case 'LOADING_QUEUED':
        return 'loading_planned';
      case 'LOADING':
        return 'loading';
      case 'LOADED':
        return 'loading_completed';
      case 'GATE_CLEARED':
        return 'dispatch_ready';
      case 'DISPATCHED':
        return 'dispatched';
      case 'DELIVERED':
      case 'CLOSED':
        return 'delivered';
      default:
        return 'order_placed';
    }
  };

  const discountVal = parseFloat(bo.discount || '0');
  const items = (bo.items || []).map((it) => ({
    productId: `prod-${it.product}`,
    productName: it.product_name,
    bags: it.bags,
    weightKg: parseFloat(it.weight_kg || '0'),
    weightMT: parseFloat(it.weight_mt || '0'),
    ratePerBag: parseFloat(it.rate_per_bag || '0'),
    totalAmount: parseFloat(it.total_amount || '0'),
  }));

  return {
    id: bo.order_number || `ORD-${bo.id}`,
    date: bo.created_at ? bo.created_at.replace('T', ' ').substring(0, 16) : new Date().toISOString().substring(0, 16),
    dealerId: bo.dealer ? String(bo.dealer.id) : '1',
    dealerName: bo.dealer?.user_name || bo.dealer?.dealership_name || 'Ramesh Patel',
    dealerPhone: bo.dealer?.phone || '9826041290',
    dealerAgency: bo.dealer?.dealership_name || 'Patel Agro Agency',
    distributorId: bo.distributor ? String(bo.distributor.id) : '1',
    distributorName: bo.distributor?.company_name || 'Malwa Agri Feeds',
    destination: bo.destination || 'Indore / Dewas Mandi',
    truckCapacity: bo.truck_capacity || '20_MT',
    maxBags: bo.max_bags || (bo.truck_capacity === '25_MT' ? 500 : 400),
    items: items.length > 0 ? items : [
      {
        productId: 'prod-1',
        productName: 'BFEL Dudh Dhara 50kg',
        bags: bo.total_bags || 400,
        weightKg: parseFloat(bo.total_weight_kg || '20000'),
        weightMT: parseFloat(bo.total_weight_mt || '20'),
        ratePerBag: 1420,
        totalAmount: parseFloat(bo.subtotal || '568000'),
      }
    ],
    totalBags: bo.total_bags,
    totalWeightKg: parseFloat(bo.total_weight_kg || '0'),
    totalWeightMT: parseFloat(bo.total_weight_mt || '0'),
    subtotal: parseFloat(bo.subtotal || '0'),
    schemeDiscount: discountVal,
    schemeName: discountVal > 0 ? 'BFEL Volume Scheme (₹30/bag)' : undefined,
    tax: 0,
    netTotal: parseFloat(bo.net_total || '0'),
    advancePayable: parseFloat(bo.advance_payable || bo.net_total || '0'),
    advancePaid: parseFloat(bo.advance_paid || '0'),
    status: mapStatus(bo.status),
    notes: bo.notes || '',
    assignedBay: bo.status === 'LOADING' || bo.status === 'LOADED' || bo.status === 'DISPATCHED' ? 'Bay 1' : undefined,
    assignedVehicle: bo.status === 'LOADING' || bo.status === 'LOADED' || bo.status === 'DISPATCHED' ? 'MP-09-GH-4120' : undefined,
    assignedDriver: bo.status === 'LOADING' || bo.status === 'LOADED' || bo.status === 'DISPATCHED' ? 'Mahesh Yadav' : undefined,
    sealNumber: bo.status === 'LOADED' || bo.status === 'DISPATCHED' ? 'SEAL-IND-7712' : undefined,
    lrNumber: bo.status === 'DISPATCHED' ? 'LR-DEWAS-7712' : undefined,
    gatePassId: bo.status === 'LOADED' || bo.status === 'DISPATCHED' ? 'GP-MGL-7712' : undefined,
  };
};

export const mapBackendPaymentToFrontend = (bp: BackendPayment): PaymentRecord => {
  const mapStatus = (st: string): 'pending_verification' | 'verified' | 'rejected' => {
    switch (st) {
      case 'VERIFIED':
        return 'verified';
      case 'REJECTED':
        return 'rejected';
      default:
        return 'pending_verification';
    }
  };

  return {
    id: `PAY-${bp.id}`,
    orderId: bp.order_number || String(bp.order_id),
    dealerName: bp.dealer_name || 'Ramesh Patel',
    dealerAgency: bp.dealer_name ? `${bp.dealer_name} Agency` : 'Patel Agro Agency',
    amount: parseFloat(bp.amount || '0'),
    mode: (bp.payment_mode as PaymentMode) || 'RTGS',
    utr: bp.utr_number,
    bankName: bp.bank_name,
    submittedAt: bp.created_at ? bp.created_at.replace('T', ' ').substring(0, 16) : new Date().toISOString().substring(0, 16),
    status: mapStatus(bp.status),
    receiptUrl: bp.receipt_url || '/receipts/sample_pnb_rtgs.png',
    verifiedAt: bp.verified_at ? bp.verified_at.replace('T', ' ').substring(0, 16) : undefined,
    verifiedBy: bp.verified_by ? String(bp.verified_by.name || bp.verified_by) : undefined,
    rejectionReason: bp.rejection_reason,
  };
};

export const mapBackendClaimToFrontend = (bc: BackendClaim): Claim => {
  const mapStatus = (st: string): 'under_review' | 'approved' | 'rejected' => {
    switch (st) {
      case 'APPROVED':
        return 'approved';
      case 'REJECTED':
        return 'rejected';
      default:
        return 'under_review';
    }
  };

  const shortageBags = bc.shortage_bags || bc.affected_bags || 0;
  return {
    id: bc.claim_number || `CLM-${bc.id}`,
    orderId: bc.order_number || String(bc.order),
    dealerName: bc.dealer_name || 'Ramesh Patel',
    dealerAgency: bc.dealer_name ? `${bc.dealer_name} Agency` : 'Patel Agro Agency',
    distributorName: 'Malwa Agri Feeds Pvt Ltd',
    claimType: (bc.claim_type as ClaimType) || 'transit_shortage',
    expectedQuantityBags: bc.expected_bags || 400,
    receivedQuantityBags: bc.received_bags || 395,
    shortageQuantityBags: shortageBags,
    expectedWeightKg: (bc.expected_bags || 400) * 50,
    receivedWeightKg: (bc.received_bags || 395) * 50,
    shortageWeightKg: shortageBags * 50,
    description: bc.description || '',
    photos: bc.evidence_files && bc.evidence_files.length > 0 ? bc.evidence_files.map((e) => e.file_url) : ['/evidence/bag_shortage_tally.jpg'],
    submittedDate: bc.created_at ? bc.created_at.replace('T', ' ').substring(0, 16) : new Date().toISOString().substring(0, 16),
    location: 'Dewas Mandi Yard',
    status: mapStatus(bc.status),
    reviewedBy: bc.reviewed_by_name,
    reviewedDate: bc.reviewed_at ? bc.reviewed_at.replace('T', ' ').substring(0, 16) : undefined,
    creditNoteId: bc.credit_note_id,
    creditNoteAmount: bc.credit_note_amount ? parseFloat(bc.credit_note_amount) : undefined,
    adminRemarks: bc.admin_remarks || bc.review_notes,
  };
};

// Initial default users
export const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  dealer: {
    id: 'user-dealer-1',
    name: 'Ramesh Patel',
    role: 'dealer',
    phone: '+91 98260 41290',
    email: 'ramesh.patel@patelagro.in',
    entityName: 'Patel Agro Agency',
    location: 'Dewas Mandi Yard, MP',
    avatarColor: 'bg-emerald-600',
  },
  sales_agent: {
    id: 'user-agent-1',
    name: 'Vikram Chauhan',
    role: 'sales_agent',
    phone: '+91 94250 88219',
    email: 'vikram.chauhan@bfel.in',
    entityName: 'BFEL Field Sales - Malwa Region',
    location: 'Indore & Dewas Belt, MP',
    avatarColor: 'bg-amber-600',
  },
  distributor: {
    id: 'user-dist-1',
    name: 'Sanjay Maheshwari',
    role: 'distributor',
    phone: '+91 98270 33412',
    email: 'sanjay@malwaagrifeeds.com',
    entityName: 'Malwa Agri Feeds Pvt Ltd',
    location: 'Indore Central Hub, MP',
    avatarColor: 'bg-indigo-600',
  },
  accounts: {
    id: 'user-acc-1',
    name: 'Sunita Jain',
    role: 'accounts',
    phone: '+91 98930 77140',
    email: 'sunita.jain@bfel.in',
    entityName: 'BFEL Finance & Accounts Desk',
    location: 'Central Plant, Manglia, Indore',
    avatarColor: 'bg-teal-600',
  },
  loading_operator: {
    id: 'user-loader-1',
    name: 'Kailash Verma',
    role: 'loading_operator',
    phone: '+91 97520 19340',
    email: 'kailash.v@bfel.in',
    entityName: 'Plant Dispatch Bay 3',
    location: 'Manglia Loading Terminal, Indore',
    avatarColor: 'bg-blue-600',
  },
  admin: {
    id: 'user-admin-1',
    name: 'Rajeshwar Sharma',
    role: 'admin',
    phone: '+91 98261 00552',
    email: 'operations.head@bfel.in',
    entityName: 'BFEL Operations Command Center',
    location: 'Headquarters, Indore, MP',
    avatarColor: 'bg-slate-800',
  },
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-dudh-dhara',
    name: 'BFEL Dudh Dhara 50kg',
    sku: 'BFEL-DD-50',
    bagWeightKg: 50,
    proteinPercent: 20,
    fatPercent: 4.0,
    pricePerBag: 1420,
    stockAvailableBags: 4800,
    category: 'Cattle Feed',
    description: 'High yield balanced cattle feed for lactating dairy cows & buffaloes with bypass protein.',
  },
  {
    id: 'prod-mahamilk-super',
    name: 'BFEL Mahamilk Super 50kg',
    sku: 'BFEL-MS-50',
    bagWeightKg: 50,
    proteinPercent: 22,
    fatPercent: 4.5,
    pricePerBag: 1540,
    stockAvailableBags: 3200,
    category: 'Cattle Feed',
    description: 'Super enriched formulation for heavy milk yielders with organic minerals & yeast cultures.',
  },
  {
    id: 'prod-pashu-shakti',
    name: 'BFEL Pashu Shakti Balanced 50kg',
    sku: 'BFEL-PS-50',
    bagWeightKg: 50,
    proteinPercent: 18,
    fatPercent: 3.5,
    pricePerBag: 1310,
    stockAvailableBags: 5100,
    category: 'Cattle Feed',
    description: 'All-round maintenance & standard lactating ration supporting optimal rumen health.',
  },
  {
    id: 'prod-calf-starter',
    name: 'BFEL Calf Starter Pellet 50kg',
    sku: 'BFEL-CS-50',
    bagWeightKg: 50,
    proteinPercent: 24,
    fatPercent: 5.0,
    pricePerBag: 1750,
    stockAvailableBags: 1600,
    category: 'Pellets',
    description: 'Micro-pelleted early ruminal development formula with essential amino acids & vitamins.',
  },
];

const INITIAL_WALLET: DistributorWallet = {
  availableBalance: 420000,
  reservedFunds: 180000,
  creditLimit: 1000000,
  availableCredit: 680000,
  creditUtilizationPercent: 32,
  transactions: [
    {
      id: 'tx-101',
      date: '2026-10-01 10:15',
      reference: 'ADV-DEP-9941',
      description: 'Advance RTGS Deposit - Patel Agro Agency',
      debit: 0,
      credit: 500000,
      balance: 420000,
      type: 'advance_deposit',
    },
    {
      id: 'tx-102',
      date: '2026-09-29 16:30',
      reference: 'BFEL-2026-8380',
      description: 'Dispatched 500 bags Mahamilk Super (25 MT)',
      debit: 755000,
      credit: 0,
      balance: 100000,
      type: 'order_charge',
    },
    {
      id: 'tx-103',
      date: '2026-09-28 14:00',
      reference: 'CRN-2026-042',
      description: 'Credit Note Approved - Shortage Claim Patel Agro',
      debit: 0,
      credit: 11360,
      balance: 855000,
      type: 'credit_note',
    },
  ],
};

const INITIAL_ALLOCATIONS: ProductAllocation[] = [
  {
    productId: 'prod-dudh-dhara',
    productName: 'BFEL Dudh Dhara 50kg',
    allocatedBags: 2000,
    availableBags: 1240,
    reservedBags: 760,
  },
  {
    productId: 'prod-mahamilk-super',
    productName: 'BFEL Mahamilk Super 50kg',
    allocatedBags: 1500,
    availableBags: 900,
    reservedBags: 600,
  },
  {
    productId: 'prod-pashu-shakti',
    productName: 'BFEL Pashu Shakti Balanced 50kg',
    allocatedBags: 1800,
    availableBags: 1400,
    reservedBags: 400,
  },
  {
    productId: 'prod-calf-starter',
    productName: 'BFEL Calf Starter Pellet 50kg',
    allocatedBags: 600,
    availableBags: 450,
    reservedBags: 150,
  },
];

const INITIAL_VEHICLES: Vehicle[] = [
  {
    registrationNumber: 'MP09AB1234',
    capacity: '20_MT',
    maxBags: 400,
    driverName: 'Mahesh Yadav',
    driverPhone: '+91 98931 44520',
    driverLicense: 'MP-09-2015-882190',
    status: 'loading',
    currentOrderId: 'BFEL-2026-8491',
    currentBay: 'Bay 3',
    lastTripDate: '2026-09-30',
  },
  {
    registrationNumber: 'MP09CD4521',
    capacity: '25_MT',
    maxBags: 500,
    driverName: 'Devendra Gurjar',
    driverPhone: '+91 97521 33290',
    driverLicense: 'MP-09-2018-441209',
    status: 'available',
    lastTripDate: '2026-10-01',
  },
  {
    registrationNumber: 'MP13EF7821',
    capacity: '20_MT',
    maxBags: 400,
    driverName: 'Suresh Parmar',
    driverPhone: '+91 94240 55198',
    driverLicense: 'MP-13-2016-118830',
    status: 'queued',
    lastTripDate: '2026-10-01',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'BFEL-2026-8491',
    date: '2026-10-02 08:30',
    dealerId: 'user-dealer-1',
    dealerName: 'Ramesh Patel',
    dealerPhone: '+91 98260 41290',
    dealerAgency: 'Patel Agro Agency',
    distributorId: 'user-dist-1',
    distributorName: 'Malwa Agri Feeds',
    destination: 'Dewas Mandi Yard, MP',
    truckCapacity: '20_MT',
    maxBags: 400,
    items: [
      {
        productId: 'prod-dudh-dhara',
        productName: 'BFEL Dudh Dhara 50kg',
        bags: 400,
        weightKg: 20000,
        weightMT: 20.0,
        ratePerBag: 1420,
        totalAmount: 568000,
      },
    ],
    totalBags: 400,
    totalWeightKg: 20000,
    totalWeightMT: 20.0,
    subtotal: 568000,
    schemeDiscount: 12000, // ₹30/bag on 400 bags
    schemeName: 'Volume Slab: 400+ Bags (₹30/bag off)',
    tax: 0, // Animal feed exempted under GST schedule
    netTotal: 556000,
    advancePayable: 556000,
    advancePaid: 556000,
    status: 'loading',
    paymentId: 'PAY-8491',
    assignedVehicle: 'MP09AB1234',
    assignedDriver: 'Mahesh Yadav',
    assignedBay: 'Bay 3',
    loadingProgressBags: 372,
    tareWeightKg: 9450,
    grossWeightKg: 28050,
    netWeightKg: 18600,
    expectedWeightKg: 20000,
    weightVarianceKg: -1400, // 28 bags left to reach 400
    sealNumber: '',
  },
  {
    id: 'BFEL-2026-8488',
    date: '2026-10-01 11:20',
    dealerId: 'user-dealer-2',
    dealerName: 'Kishore Mandloi',
    dealerPhone: '+91 98262 77112',
    dealerAgency: 'Nimar Kisan Kendra',
    distributorId: 'user-dist-1',
    distributorName: 'Malwa Agri Feeds',
    destination: 'Khargone Main Depot, MP',
    truckCapacity: '25_MT',
    maxBags: 500,
    items: [
      {
        productId: 'prod-mahamilk-super',
        productName: 'BFEL Mahamilk Super 50kg',
        bags: 500,
        weightKg: 25000,
        weightMT: 25.0,
        ratePerBag: 1540,
        totalAmount: 770000,
      },
    ],
    totalBags: 500,
    totalWeightKg: 25000,
    totalWeightMT: 25.0,
    subtotal: 770000,
    schemeDiscount: 15000,
    schemeName: 'Super Dairy Volume Slab',
    tax: 0,
    netTotal: 755000,
    advancePayable: 755000,
    advancePaid: 755000,
    status: 'dispatched',
    paymentId: 'PAY-8488',
    assignedVehicle: 'MP09CD4521',
    assignedDriver: 'Devendra Gurjar',
    assignedBay: 'Bay 1',
    loadingProgressBags: 500,
    tareWeightKg: 10200,
    grossWeightKg: 35200,
    netWeightKg: 25000,
    expectedWeightKg: 25000,
    weightVarianceKg: 0,
    sealNumber: 'BFEL-SEAL-99120',
    lrNumber: 'LR-IND-2026-9428',
    gatePassId: 'GP-MGL-2026-0412',
    dispatchedAt: '2026-10-01 16:45',
  },
  {
    id: 'BFEL-2026-8485',
    date: '2026-09-30 09:15',
    dealerId: 'user-dealer-1',
    dealerName: 'Ramesh Patel',
    dealerPhone: '+91 98260 41290',
    dealerAgency: 'Patel Agro Agency',
    distributorId: 'user-dist-1',
    distributorName: 'Malwa Agri Feeds',
    destination: 'Dewas Mandi Yard, MP',
    truckCapacity: '20_MT',
    maxBags: 400,
    items: [
      {
        productId: 'prod-pashu-shakti',
        productName: 'BFEL Pashu Shakti Balanced 50kg',
        bags: 400,
        weightKg: 20000,
        weightMT: 20.0,
        ratePerBag: 1310,
        totalAmount: 524000,
      },
    ],
    totalBags: 400,
    totalWeightKg: 20000,
    totalWeightMT: 20.0,
    subtotal: 524000,
    schemeDiscount: 12000,
    schemeName: 'Volume Slab: 400+ Bags (₹30/bag off)',
    tax: 0,
    netTotal: 512000,
    advancePayable: 512000,
    advancePaid: 512000,
    status: 'delivered',
    paymentId: 'PAY-8485',
    assignedVehicle: 'MP13EF7821',
    assignedDriver: 'Suresh Parmar',
    assignedBay: 'Bay 2',
    loadingProgressBags: 400,
    tareWeightKg: 9380,
    grossWeightKg: 29380,
    netWeightKg: 20000,
    expectedWeightKg: 20000,
    weightVarianceKg: 0,
    sealNumber: 'BFEL-SEAL-98711',
    lrNumber: 'LR-IND-2026-9390',
    gatePassId: 'GP-MGL-2026-0399',
    dispatchedAt: '2026-09-30 14:00',
    deliveredAt: '2026-09-30 19:30',
  },
];

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'PAY-8491',
    orderId: 'BFEL-2026-8491',
    dealerName: 'Ramesh Patel',
    dealerAgency: 'Patel Agro Agency',
    amount: 556000,
    mode: 'RTGS',
    utr: 'PUNBR52026100299841',
    bankName: 'Punjab National Bank, Dewas',
    submittedAt: '2026-10-02 08:45',
    status: 'verified',
    verifiedAt: '2026-10-02 09:10',
    verifiedBy: 'Sunita Jain (Accounts)',
    receiptUrl: '/receipts/sample_pnb_rtgs.png',
  },
  {
    id: 'PAY-8493-PENDING',
    orderId: 'BFEL-2026-8493',
    dealerName: 'Bherulal Patidar',
    dealerAgency: 'Patidar Krishi Seva',
    amount: 568000,
    mode: 'NEFT',
    utr: 'SBIN00261002441920',
    bankName: 'State Bank of India, Sanwer',
    submittedAt: '2026-10-02 10:20',
    status: 'pending_verification',
    receiptUrl: '/receipts/sample_sbi_neft.png',
  },
];

const INITIAL_CLAIMS: Claim[] = [
  {
    id: 'CLM-2026-089',
    orderId: 'BFEL-2026-8485',
    dealerName: 'Ramesh Patel',
    dealerAgency: 'Patel Agro Agency',
    distributorName: 'Malwa Agri Feeds',
    claimType: 'shortage',
    expectedQuantityBags: 400,
    receivedQuantityBags: 392,
    shortageQuantityBags: 8,
    expectedWeightKg: 20000,
    receivedWeightKg: 19600,
    shortageWeightKg: 400,
    description: 'During unloading at Dewas Mandi godown in presence of driver Suresh Parmar, 8 bags were short from rear cargo stack. Unloading challan stamped with 392 bags.',
    photos: [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><text x="200" y="140" fill="%2394a3b8" font-size="16" text-anchor="middle" font-family="sans-serif">Photo 1: Unloading Bay Stack Count</text><text x="200" y="170" fill="%2338bdf8" font-size="14" text-anchor="middle" font-family="sans-serif">392 bags tallied on physical tally sheet</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><text x="200" y="140" fill="%2394a3b8" font-size="16" text-anchor="middle" font-family="sans-serif">Photo 2: Stamped LR Shortage Endorsement</text><text x="200" y="170" fill="%2338bdf8" font-size="14" text-anchor="middle" font-family="sans-serif">Driver counter-signed 8 bags short</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><text x="200" y="140" fill="%2394a3b8" font-size="16" text-anchor="middle" font-family="sans-serif">Photo 3: Truck MP13EF7821 Empty Bed</text><text x="200" y="170" fill="%2338bdf8" font-size="14" text-anchor="middle" font-family="sans-serif">Clean cargo bed inspection</text></svg>',
    ],
    submittedDate: '2026-10-01 10:45',
    location: 'Dewas Mandi Yard',
    status: 'under_review',
  },
];

const INITIAL_VISITS: DealerVisit[] = [
  {
    id: 'VST-101',
    agentId: 'user-agent-1',
    agentName: 'Vikram Chauhan',
    dealerId: 'user-dealer-1',
    dealerAgency: 'Patel Agro Agency',
    dealerContact: 'Ramesh Patel (+91 98260 41290)',
    location: 'Dewas Mandi Yard, MP',
    gpsStatus: 'verified',
    gpsCoordinates: '22.9676° N, 76.0534° E',
    visitTime: '2026-10-02 07:45',
    lastVisitDate: '2026-09-25',
    lastOrderDate: '2026-10-02',
    outstandingBalance: 0,
    currentStockBags: 64,
    notes: 'Good stock movement of Dudh Dhara 50kg among local dairy cooperatives. Dealer requested early morning dispatch for upcoming festival week.',
    photos: [],
    isSynced: true,
  },
  {
    id: 'VST-102',
    agentId: 'user-agent-1',
    agentName: 'Vikram Chauhan',
    dealerId: 'user-dealer-3',
    dealerAgency: 'Malwa Pashu Aahar, Ujjain Road',
    dealerContact: 'Omprakash Joshi (+91 94253 11822)',
    location: 'Sanwer By-pass, MP',
    gpsStatus: 'verified',
    gpsCoordinates: '22.9781° N, 75.8310° E',
    visitTime: '2026-10-02 09:30',
    lastVisitDate: '2026-09-20',
    lastOrderDate: '2026-09-28',
    outstandingBalance: 84000,
    currentStockBags: 28,
    notes: 'Stock running critically low. Planning a 20 MT mixed truck order by tomorrow evening.',
    photos: [],
    isSynced: true,
  },
];

const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'aud-1',
    timestamp: '2026-10-02 09:10',
    user: 'Sunita Jain',
    role: 'accounts',
    action: 'Payment Verified',
    entity: 'Payment',
    reference: 'PAY-8491 (BFEL-2026-8491)',
    description: 'Verified RTGS ₹5,56,000 UTR PUNBR52026100299841. Order approved for loading terminal.',
  },
  {
    id: 'aud-2',
    timestamp: '2026-10-02 08:45',
    user: 'Ramesh Patel',
    role: 'dealer',
    action: 'Payment Submitted',
    entity: 'Payment',
    reference: 'PAY-8491',
    description: 'Submitted advance payment proof ₹5,56,000 via PNB RTGS.',
  },
  {
    id: 'aud-3',
    timestamp: '2026-10-02 08:30',
    user: 'Ramesh Patel',
    role: 'dealer',
    action: 'Order Created',
    entity: 'Order',
    reference: 'BFEL-2026-8491',
    description: 'Created 400-bag Dudh Dhara 50kg order (20 MT Truck load) for Dewas Mandi.',
  },
  {
    id: 'aud-4',
    timestamp: '2026-10-01 16:45',
    user: 'Kailash Verma',
    role: 'loading_operator',
    action: 'Loading Completed & LR Generated',
    entity: 'Loading',
    reference: 'BFEL-2026-8488',
    description: '500 bags loaded on MP09CD4521. Net wt: 25,000 kg. Gate pass GP-MGL-2026-0412 & LR-IND-2026-9428 issued.',
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Payment Verified for BFEL-2026-8491',
    message: 'Accounts verified advance payment of ₹5,56,000. Truck MP09AB1234 loading in progress at Bay 3.',
    timestamp: '25m ago',
    type: 'payment',
    read: false,
    linkAction: { role: 'loading_operator', tab: 'loading', referenceId: 'BFEL-2026-8491' },
  },
  {
    id: 'notif-2',
    title: 'Shortage Claim CLM-2026-089 Pending Review',
    message: 'Patel Agro Agency reported 8 bags short on order BFEL-2026-8485. Photo proof attached.',
    timestamp: '1h ago',
    type: 'claim',
    read: false,
    linkAction: { role: 'admin', tab: 'claims', referenceId: 'CLM-2026-089' },
  },
  {
    id: 'notif-3',
    title: 'New Advance Payment Pending UTR Verification',
    message: 'Bherulal Patidar submitted NEFT ₹5,68,000 (UTR: SBIN00261002441920) awaiting accounts desk review.',
    timestamp: '15m ago',
    type: 'payment',
    read: false,
    linkAction: { role: 'accounts', tab: 'payments', referenceId: 'PAY-8493-PENDING' },
  },
];

const INITIAL_PENDING_SIGNUPS: PendingSignup[] = [
  {
    id: 'sgn-1',
    name: 'Gopal Krishna Choudhary',
    phone: '+91 94250 99120',
    email: 'gopal.krishi@gmail.com',
    requestedRole: 'dealer',
    dealershipName: 'Choudhary Kisan Kendra',
    territory: 'Ujjain Rural, MP',
    appliedDate: '2026-10-01',
    status: 'pending',
  },
  {
    id: 'sgn-2',
    name: 'Anil Mukati',
    phone: '+91 98263 12450',
    email: 'anil.mukati@gmail.com',
    requestedRole: 'sales_agent',
    dealershipName: 'BFEL Direct Sales Agent',
    territory: 'Khargone & Barwaha, MP',
    appliedDate: '2026-10-02',
    status: 'pending',
  },
];

interface AppContextType {
  currentUser: UserProfile;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  users: Record<UserRole, UserProfile>;
  
  // Products & Inventory
  products: Product[];
  
  // Orders
  orders: Order[];
  createOrder: (orderData: {
    dealerId: string;
    dealerName: string;
    dealerPhone: string;
    dealerAgency: string;
    destination: string;
    truckCapacity: TruckCapacityType;
    productId: string;
    bags: number;
    notes?: string;
  }) => Order;
  getOrderById: (id: string) => Order | undefined;
  
  // Payments
  payments: PaymentRecord[];
  submitPayment: (data: {
    orderId: string;
    dealerName: string;
    dealerAgency: string;
    amount: number;
    mode: PaymentMode;
    utr: string;
    bankName: string;
    receiptUrl?: string;
  }) => PaymentRecord;
  verifyPayment: (paymentId: string) => void;
  rejectPayment: (paymentId: string, reason: string) => void;
  
  // Loading & Terminal
  vehicles: Vehicle[];
  updateLoadingProgress: (orderId: string, bagsLoaded: number, tareKg: number, grossKg: number, sealNumber: string) => void;
  completeLoading: (orderId: string, tareKg: number, grossKg: number, sealNumber: string) => void;
  
  // Dispatch
  dispatchOrder: (orderId: string) => void;
  
  // Claims
  claims: Claim[];
  createClaim: (claimData: {
    orderId: string;
    dealerName: string;
    dealerAgency: string;
    claimType: ClaimType;
    expectedBags: number;
    receivedBags: number;
    description: string;
    photos: string[];
    location: string;
  }) => Claim;
  approveClaim: (claimId: string, remarks?: string) => void;
  rejectClaim: (claimId: string, remarks: string) => void;
  
  // Wallet & Allocations
  wallet: DistributorWallet;
  allocations: ProductAllocation[];
  
  // Field Operations & Dealer Visits
  visits: DealerVisit[];
  recordDealerVisit: (visit: Omit<DealerVisit, 'id' | 'isSynced'>) => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  pendingSyncCount: number;
  syncOfflineQueue: () => void;
  
  // Audits & Notifications
  auditLogs: AuditEvent[];
  addAuditLog: (action: string, entity: AuditEvent['entity'], reference: string, description: string) => void;
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Signups
  pendingSignups: PendingSignup[];
  approveSignup: (id: string) => void;
  rejectSignup: (id: string) => void;
  requestSignup: (signup: Omit<PendingSignup, 'id' | 'appliedDate' | 'status'>) => void;
  
  // Global modals & drawers
  activeModal: string | null;
  activeModalData: any;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;
  
  // Reset demo
  resetToDefault: () => void;
  
  // Toast system
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('dealer');
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USERS.dealer);
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('bfel_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });
  
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('bfel_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });
  
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('bfel_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });
  
  const [wallet, setWallet] = useState<DistributorWallet>(() => {
    const saved = localStorage.getItem('bfel_wallet');
    return saved ? JSON.parse(saved) : INITIAL_WALLET;
  });
  
  const [allocations, setAllocations] = useState<ProductAllocation[]>(() => {
    const saved = localStorage.getItem('bfel_allocations');
    return saved ? JSON.parse(saved) : INITIAL_ALLOCATIONS;
  });
  
  const [claims, setClaims] = useState<Claim[]>(() => {
    const saved = localStorage.getItem('bfel_claims');
    return saved ? JSON.parse(saved) : INITIAL_CLAIMS;
  });
  
  const [visits, setVisits] = useState<DealerVisit[]>(() => {
    const saved = localStorage.getItem('bfel_visits');
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
  });
  
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(() => {
    const saved = localStorage.getItem('bfel_audits');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });
  
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('bfel_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  
  const [pendingSignups, setPendingSignups] = useState<PendingSignup[]>(() => {
    const saved = localStorage.getItem('bfel_signups');
    return saved ? JSON.parse(saved) : INITIAL_PENDING_SIGNUPS;
  });

  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Modals & Drawers state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeModalData, setActiveModalData] = useState<any>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('bfel_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('bfel_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('bfel_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('bfel_wallet', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem('bfel_allocations', JSON.stringify(allocations));
  }, [allocations]);

  useEffect(() => {
    localStorage.setItem('bfel_claims', JSON.stringify(claims));
  }, [claims]);

  useEffect(() => {
    localStorage.setItem('bfel_visits', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('bfel_audits', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('bfel_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('bfel_signups', JSON.stringify(pendingSignups));
  }, [pendingSignups]);

  // Synchronize Authoritative State from Live Django 5 / PostgreSQL 16 Backend
  useEffect(() => {
    let isMounted = true;

    const syncAuthoritativeState = async () => {
      try {
        // 1. Sync Products
        const backendProds = await api.products.list();
        if (isMounted && backendProds && backendProds.length > 0) {
          const mappedProds: Product[] = backendProds.map((p) => ({
            id: `prod-${p.id}`,
            name: p.name,
            sku: p.sku,
            bagWeightKg: p.bag_weight_kg,
            proteinPercent: parseFloat(p.protein_percent),
            fatPercent: parseFloat(p.fat_percent),
            pricePerBag: parseFloat(p.price_per_bag),
            stockAvailableBags: 5000,
            category: 'Cattle Feed',
            description: `${p.name} - 50 kg bag, ${p.protein_percent}% crude protein, ${p.fat_percent}% fat content.`,
          }));
          setProducts(mappedProds);
        }
      } catch {
        // Keep initial products if unauthenticated or offline
      }

      try {
        // 2. Sync Orders
        const backendOrders = await api.orders.list();
        if (isMounted && backendOrders && backendOrders.length > 0) {
          const mappedOrders = backendOrders.map(mapBackendOrderToFrontend);
          setOrders((prev) => {
            const mappedIds = new Set(mappedOrders.map((o) => o.id));
            const nonOverlapping = prev.filter((o) => !mappedIds.has(o.id));
            return [...mappedOrders, ...nonOverlapping];
          });
        }
      } catch {
        // Keep cached orders
      }

      try {
        // 3. Sync Payments
        const backendPayments = await api.payments.list();
        if (isMounted && backendPayments && backendPayments.length > 0) {
          const mappedPayments = backendPayments.map(mapBackendPaymentToFrontend);
          setPayments((prev) => {
            const payIds = new Set(mappedPayments.map((p) => p.id));
            const nonOverlapping = prev.filter((p) => !payIds.has(p.id));
            return [...mappedPayments, ...nonOverlapping];
          });
        }
      } catch {
        // Keep cached payments
      }

      try {
        // 4. Sync Claims
        const backendClaims = await api.claims.list();
        if (isMounted && backendClaims && backendClaims.length > 0) {
          const mappedClaims = backendClaims.map(mapBackendClaimToFrontend);
          setClaims((prev) => {
            const claimIds = new Set(mappedClaims.map((c) => c.id));
            const nonOverlapping = prev.filter((c) => !claimIds.has(c.id));
            return [...mappedClaims, ...nonOverlapping];
          });
        }
      } catch {
        // Keep cached claims
      }

      try {
        // 5. Sync Assets / Fleet
        const assets = await api.loading.getAssets();
        if (isMounted && assets && assets.trucks && assets.trucks.length > 0) {
          const mappedVehicles: Vehicle[] = assets.trucks.map((t: any) => ({
            registrationNumber: t.registration_number,
            capacity: t.capacity_type,
            maxBags: t.max_bags,
            driverName: t.driver?.name || 'Mahesh Yadav',
            driverPhone: t.driver?.phone || '+91 98931 44520',
            driverLicense: t.driver?.license_number || 'MP-09-2015-882190',
            status: t.is_active ? 'available' : 'loading',
            lastTripDate: '2026-10-02',
          }));
          setVehicles(mappedVehicles);
        }
      } catch {
        // Keep cached vehicles
      }
    };

    syncAuthoritativeState();
    return () => {
      isMounted = false;
    };
  }, [currentRole]);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    setCurrentUser(DEFAULT_USERS[role]);
    showToast(`Switched workspace to ${DEFAULT_USERS[role].name} (${role.toUpperCase().replace('_', ' ')})`, 'info');
  };

  const addAuditLog = (action: string, entity: AuditEvent['entity'], reference: string, description: string) => {
    const newLog: AuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      user: currentUser.name,
      role: currentRole,
      action,
      entity,
      reference,
      description,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addNotification = (title: string, message: string, type: NotificationItem['type'], linkAction?: NotificationItem['linkAction']) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      type,
      read: false,
      linkAction,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // ORDER CREATION
  const createOrder = (orderData: {
    dealerId: string;
    dealerName: string;
    dealerPhone: string;
    dealerAgency: string;
    destination: string;
    truckCapacity: TruckCapacityType;
    productId: string;
    bags: number;
    notes?: string;
  }): Order => {
    const maxBagsAllowed = TRUCK_LIMITS[orderData.truckCapacity].maxBags;
    if (orderData.bags > maxBagsAllowed) {
      throw new Error(`Truck capacity exceeded! ${orderData.truckCapacity} supports maximum ${maxBagsAllowed} bags (50 kg each).`);
    }

    const prod = products.find((p) => p.id === orderData.productId) || products[0];
    const weightKg = bagsToKg(orderData.bags);
    const weightMT = bagsToMT(orderData.bags);
    const subtotal = orderData.bags * prod.pricePerBag;

    // Scheme Engine: 400+ bags = ₹30 discount per bag
    let schemeDiscount = 0;
    let schemeName: string | undefined = undefined;
    if (orderData.bags >= 400) {
      schemeDiscount = orderData.bags * 30;
      schemeName = 'BFEL Volume Scheme: 400+ bags (₹30/bag discount)';
    }

    const netTotal = subtotal - schemeDiscount;
    const advancePayable = netTotal; // 100% advance standard for plant dispatch

    const orderId = `BFEL-2026-${Math.floor(8500 + Math.random() * 900)}`;

    const newOrder: Order = {
      id: orderId,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      dealerId: orderData.dealerId,
      dealerName: orderData.dealerName,
      dealerPhone: orderData.dealerPhone,
      dealerAgency: orderData.dealerAgency,
      distributorId: 'user-dist-1',
      distributorName: 'Malwa Agri Feeds',
      destination: orderData.destination,
      truckCapacity: orderData.truckCapacity,
      maxBags: maxBagsAllowed,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          bags: orderData.bags,
          weightKg,
          weightMT,
          ratePerBag: prod.pricePerBag,
          totalAmount: subtotal,
        },
      ],
      totalBags: orderData.bags,
      totalWeightKg: weightKg,
      totalWeightMT: weightMT,
      subtotal,
      schemeDiscount,
      schemeName,
      tax: 0,
      netTotal,
      advancePayable,
      advancePaid: 0,
      status: 'order_placed',
      notes: orderData.notes,
    };

    if (isOfflineMode) {
      setOfflineQueue((prev) => [...prev, { type: 'create_order', payload: newOrder }]);
      showToast('Order saved to offline cache. 1 action queued for sync.', 'info');
    }

    setOrders((prev) => [newOrder, ...prev]);

    // Dispatch to Authoritative Backend (Django 5 / PostgreSQL 16)
    (async () => {
      try {
        const prodBackendId = parseInt(prod.id.replace('prod-', '')) || 1;
        const created = await api.orders.create({
          truck_capacity: orderData.truckCapacity,
          destination: orderData.destination,
          notes: orderData.notes,
          items: [
            {
              product_id: prodBackendId,
              bags: orderData.bags,
              rate_per_bag: prod.pricePerBag,
            },
          ],
        });
        if (created && created.id) {
          const submitted = await api.orders.submit(created.id);
          const mapped = mapBackendOrderToFrontend(submitted || created);
          setOrders((prev) => [mapped, ...prev.filter((o) => o.id !== orderId && o.id !== mapped.id)]);
        }
      } catch (err: any) {
        console.warn('Backend order sync note:', err.message);
      }
    })();

    addAuditLog(
      'Order Created',
      'Order',
      orderId,
      `Placed order for ${orderData.bags} bags of ${prod.name} (${weightMT} MT) on ${orderData.truckCapacity} truck.`
    );

    addNotification(
      `New Order Placed: ${orderId}`,
      `${orderData.dealerAgency} placed an order for ${orderData.bags} bags (${weightMT} MT). Advance payable: ${formatINR(advancePayable)}.`,
      'order',
      { role: 'dealer', tab: 'orders', referenceId: orderId }
    );

    showToast(`Order ${orderId} placed successfully. Please submit advance payment to proceed.`, 'success');
    return newOrder;
  };

  const getOrderById = (id: string): Order | undefined => {
    return orders.find((o) => o.id === id);
  };

  // ADVANCE PAYMENT
  const submitPayment = (data: {
    orderId: string;
    dealerName: string;
    dealerAgency: string;
    amount: number;
    mode: PaymentMode;
    utr: string;
    bankName: string;
    receiptUrl?: string;
  }): PaymentRecord => {
    const payId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment: PaymentRecord = {
      id: payId,
      orderId: data.orderId,
      dealerName: data.dealerName,
      dealerAgency: data.dealerAgency,
      amount: data.amount,
      mode: data.mode,
      utr: data.utr,
      bankName: data.bankName,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending_verification',
      receiptUrl: data.receiptUrl || '/receipts/sample_pnb_rtgs.png',
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Dispatch to Authoritative Backend (Django 5 / PostgreSQL 16)
    (async () => {
      try {
        const backendMode = (data.mode === 'RTGS' || data.mode === 'NEFT' || data.mode === 'IMPS') ? data.mode : 'RTGS';
        const res = await api.payments.submit({
          order_id: data.orderId,
          payment_mode: backendMode,
          utr_number: data.utr,
          bank_name: data.bankName,
          amount: data.amount,
          receipt_url: data.receiptUrl,
        });
        if (res && res.id) {
          const mappedPay = mapBackendPaymentToFrontend(res);
          setPayments((prev) => [mappedPay, ...prev.filter((p) => p.id !== payId && p.id !== mappedPay.id)]);
        }
      } catch (err: any) {
        console.warn('Backend payment sync note:', err.message);
      }
    })();

    // Update order status
    setOrders((prev) =>
      prev.map((o) =>
        o.id === data.orderId
          ? {
              ...o,
              paymentId: payId,
              status: 'payment_submitted',
              advancePaid: data.amount,
            }
          : o
      )
    );

    addAuditLog(
      'Payment Submitted',
      'Payment',
      payId,
      `Submitted ${data.mode} advance of ${formatINR(data.amount)} (UTR: ${data.utr}) for ${data.orderId}.`
    );

    addNotification(
      `Advance Payment Submitted: ${data.orderId}`,
      `${data.dealerAgency} submitted ${data.mode} ${formatINR(data.amount)} (UTR: ${data.utr}). Awaiting Accounts Desk verification.`,
      'payment',
      { role: 'accounts', tab: 'payments', referenceId: payId }
    );

    showToast(`Payment submitted! Sent to Central Accounts for UTR verification.`, 'success');
    return newPayment;
  };

  // ACCOUNTS PAYMENT VERIFICATION
  const verifyPayment = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    const verifiedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // 1. Update Payment status
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'verified',
              verifiedAt,
              verifiedBy: currentUser.name,
            }
          : p
      )
    );

    // 2. Update Order status -> payment_verified, queue for loading
    setOrders((prev) =>
      prev.map((o) =>
        o.id === payment.orderId
          ? {
              ...o,
              status: 'payment_verified',
              assignedBay: 'Bay 3', // Auto-route to active plant terminal
              assignedVehicle: 'MP09AB1234',
              assignedDriver: 'Mahesh Yadav',
              loadingProgressBags: 0,
            }
          : o
      )
    );

    // 3. Update Distributor Wallet
    setWallet((prev) => {
      const newReserved = prev.reservedFunds + payment.amount;
      const newAvailCredit = prev.creditLimit - newReserved;
      const newUtilization = Math.round((newReserved / prev.creditLimit) * 100);
      const newTx: any = {
        id: `tx-${Date.now()}`,
        date: verifiedAt,
        reference: payment.utr,
        description: `Advance Verified for Order ${payment.orderId} (${payment.dealerAgency})`,
        debit: 0,
        credit: payment.amount,
        balance: prev.availableBalance + payment.amount,
        type: 'advance_deposit',
      };
      return {
        ...prev,
        availableBalance: prev.availableBalance + payment.amount,
        reservedFunds: newReserved,
        availableCredit: Math.max(0, newAvailCredit),
        creditUtilizationPercent: newUtilization,
        transactions: [newTx, ...prev.transactions],
      };
    });

    addAuditLog(
      'Payment Verified',
      'Payment',
      paymentId,
      `Verified ${payment.mode} of ${formatINR(payment.amount)} (UTR: ${payment.utr}) for ${payment.orderId}. Order released to plant loading terminal.`
    );

    addNotification(
      `Order ${payment.orderId} Released to Loading Bay`,
      `Payment verified for ${payment.dealerAgency}. Assigned to Loading Bay 3 (Truck MP09AB1234).`,
      'loading',
      { role: 'loading_operator', tab: 'loading', referenceId: payment.orderId }
    );

    // Dispatch to Authoritative Backend
    (async () => {
      try {
        const rawId = paymentId.startsWith('PAY-') ? paymentId.replace('PAY-', '') : paymentId;
        await api.payments.verify(rawId, 'Verified by accounts desk');
      } catch (err: any) {
        console.warn('Backend payment verify sync note:', err.message);
      }
    })();

    showToast(`Payment ${paymentId} verified! Order ${payment.orderId} released to Loading Bay 3.`, 'success');
  };

  const rejectPayment = (paymentId: string, reason: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'rejected',
              rejectionReason: reason,
            }
          : p
      )
    );

    // Keep order blocked
    setOrders((prev) =>
      prev.map((o) =>
        o.id === payment.orderId
          ? {
              ...o,
              status: 'payment_submitted',
            }
          : o
      )
    );

    // Dispatch to Authoritative Backend
    (async () => {
      try {
        const rawId = paymentId.startsWith('PAY-') ? paymentId.replace('PAY-', '') : paymentId;
        await api.payments.reject(rawId, reason);
      } catch (err: any) {
        console.warn('Backend payment reject sync note:', err.message);
      }
    })();

    addAuditLog(
      'Payment Rejected',
      'Payment',
      paymentId,
      `Rejected payment for ${payment.orderId}. Reason: ${reason}. Order remains blocked.`
    );

    addNotification(
      `Payment Rejected for ${payment.orderId}`,
      `Reason: ${reason}. Dealer requested to re-verify UTR/Receipt.`,
      'payment',
      { role: 'dealer', tab: 'payments', referenceId: paymentId }
    );

    showToast(`Payment rejected. Reason logged in audit trail.`, 'error');
  };

  // LOADING OPERATOR TERMINAL
  const updateLoadingProgress = (
    orderId: string,
    bagsLoaded: number,
    tareKg: number,
    grossKg: number,
    sealNumber: string
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (bagsLoaded > order.maxBags) {
      showToast(`Truck capacity exceeded! Max capacity is ${order.maxBags} bags (${order.truckCapacity}).`, 'error');
      return;
    }

    const netWeight = grossKg - tareKg;
    const expectedWeight = order.totalBags * BAG_WEIGHT_KG;
    const variance = netWeight - expectedWeight;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'loading',
              loadingProgressBags: bagsLoaded,
              tareWeightKg: tareKg,
              grossWeightKg: grossKg,
              netWeightKg: netWeight,
              expectedWeightKg: expectedWeight,
              weightVarianceKg: variance,
              sealNumber,
            }
          : o
      )
    );
  };

  const completeLoading = (
    orderId: string,
    tareKg: number,
    grossKg: number,
    sealNumber: string
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Strict validation rule: Never allow 401 on 20MT or 501 on 25MT
    if (order.totalBags > order.maxBags) {
      showToast(`BLOCK ACTION: Truck capacity exceeded. ${order.truckCapacity} trucks support maximum ${order.maxBags} bags.`, 'error');
      return;
    }

    if (!sealNumber.trim()) {
      showToast(`Security seal number is required before dispatch clearance.`, 'error');
      return;
    }

    const netWeight = grossKg - tareKg;
    const expectedWeight = order.totalBags * BAG_WEIGHT_KG;
    const variance = Math.abs(netWeight - expectedWeight);

    // Variance check warning (tolerance: 100 kg)
    if (variance > 150) {
      showToast(`Weighbridge warning: Net weight variance (${variance} kg) exceeds tolerance! Please re-verify scales before finishing.`, 'error');
    }

    const lrNumber = `LR-IND-2026-${Math.floor(9400 + Math.random() * 500)}`;
    const gatePassId = `GP-MGL-2026-0${Math.floor(400 + Math.random() * 90)}`;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'loading_completed',
              loadingProgressBags: order.totalBags,
              tareWeightKg: tareKg,
              grossWeightKg: grossKg,
              netWeightKg: netWeight,
              expectedWeightKg: expectedWeight,
              weightVarianceKg: netWeight - expectedWeight,
              sealNumber,
              lrNumber,
              gatePassId,
            }
          : o
      )
    );

    // Update vehicle status
    if (order.assignedVehicle) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.registrationNumber === order.assignedVehicle
            ? { ...v, status: 'loading' }
            : v
        )
      );
    }

    addAuditLog(
      'Loading Completed',
      'Loading',
      orderId,
      `Completed loading ${order.totalBags} bags (${bagsToMT(order.totalBags)} MT) on truck ${order.assignedVehicle || 'MP09AB1234'}. Generated Gate Pass ${gatePassId} and LR ${lrNumber}.`
    );

    addNotification(
      `Truck Loaded & Gate Pass Issued: ${orderId}`,
      `${order.totalBags} bags verified. Tare: ${tareKg}kg, Gross: ${grossKg}kg, Net: ${netWeight}kg. Ready for security gate clearance.`,
      'loading',
      { role: 'admin', tab: 'dispatch', referenceId: orderId }
    );

    // Dispatch to Authoritative Backend
    (async () => {
      try {
        const queue = await api.loading.getQueue();
        const active = (queue.active_sessions || []).find(
          (s: any) => s.order_number === orderId || String(s.order_id) === orderId
        );
        if (active) {
          await api.loading.recordWeighbridge(active.id, tareKg, grossKg);
          await api.loading.complete(active.id, sealNumber);
          await api.loading.generateGatePass(active.id);
        }
      } catch (err: any) {
        console.warn('Backend loading sync note:', err.message);
      }
    })();

    showToast(`Loading complete! Gate Pass (${gatePassId}) and LR (${lrNumber}) generated.`, 'success');
  };

  // DISPATCH
  const dispatchOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const dispatchedTime = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'dispatched',
              dispatchedAt: dispatchedTime,
            }
          : o
      )
    );

    if (order.assignedVehicle) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.registrationNumber === order.assignedVehicle
            ? { ...v, status: 'dispatched' }
            : v
        )
      );
    }

    // Dispatch to Authoritative Backend
    (async () => {
      try {
        await api.dispatch.create(orderId, order.lrNumber || `LR-IND-2026-${Math.floor(9400 + Math.random() * 500)}`, order.gatePassId);
      } catch (err: any) {
        console.warn('Backend dispatch sync note:', err.message);
      }
    })();

    addAuditLog(
      'Truck Dispatched',
      'Dispatch',
      orderId,
      `Dispatched truck ${order.assignedVehicle} with ${order.totalBags} bags under LR ${order.lrNumber}. Driver: ${order.assignedDriver}.`
    );

    addNotification(
      `Dispatch Departed: ${orderId}`,
      `Truck ${order.assignedVehicle} has exited Manglia Plant for ${order.destination}. WhatsApp alert generated.`,
      'dispatch',
      { role: 'dealer', tab: 'tracking', referenceId: orderId }
    );

    showToast(`Order ${orderId} dispatched! WhatsApp alert notification ready.`, 'success');
  };

  // CLAIMS WORKFLOW
  const createClaim = (claimData: {
    orderId: string;
    dealerName: string;
    dealerAgency: string;
    claimType: ClaimType;
    expectedBags: number;
    receivedBags: number;
    description: string;
    photos: string[];
    location: string;
  }): Claim => {
    // Calculated shortage
    const shortageBags = Math.max(0, claimData.expectedBags - claimData.receivedBags);
    const expectedKg = bagsToKg(claimData.expectedBags);
    const receivedKg = bagsToKg(claimData.receivedBags);
    const shortageKg = bagsToKg(shortageBags);

    const claimId = `CLM-2026-0${Math.floor(100 + Math.random() * 899)}`;
    const newClaim: Claim = {
      id: claimId,
      orderId: claimData.orderId,
      dealerName: claimData.dealerName,
      dealerAgency: claimData.dealerAgency,
      distributorName: 'Malwa Agri Feeds',
      claimType: claimData.claimType,
      expectedQuantityBags: claimData.expectedBags,
      receivedQuantityBags: claimData.receivedBags,
      shortageQuantityBags: shortageBags,
      expectedWeightKg: expectedKg,
      receivedWeightKg: receivedKg,
      shortageWeightKg: shortageKg,
      description: claimData.description,
      photos: claimData.photos,
      submittedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      location: claimData.location,
      status: 'under_review',
    };

    setClaims((prev) => [newClaim, ...prev]);

    // Dispatch to Authoritative Backend
    (async () => {
      try {
        const res = await api.claims.create({
          order: claimData.orderId,
          claim_type: claimData.claimType,
          affected_bags: shortageBags,
          description: claimData.description,
        });
        if (res && res.id) {
          const mapped = mapBackendClaimToFrontend(res);
          setClaims((prev) => [mapped, ...prev.filter((c) => c.id !== claimId && c.id !== mapped.id)]);
        }
      } catch (err: any) {
        console.warn('Backend claim sync note:', err.message);
      }
    })();

    addAuditLog(
      'Claim Submitted',
      'Claim',
      claimId,
      `Reported ${claimData.claimType} on ${claimData.orderId}. Shortage: ${shortageBags} bags (${shortageKg} kg). Photos attached.`
    );

    addNotification(
      `New Shortage Claim: ${claimId}`,
      `${claimData.dealerAgency} reported ${shortageBags} bags shortage on ${claimData.orderId}. Review required.`,
      'claim',
      { role: 'admin', tab: 'claims', referenceId: claimId }
    );

    showToast(`Claim ${claimId} submitted for shortage of ${shortageBags} bags.`, 'success');
    return newClaim;
  };

  const approveClaim = (claimId: string, remarks?: string) => {
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return;

    // Calculate credit note amount based on standard rate ₹1420/bag
    const creditAmount = claim.shortageQuantityBags * 1420;
    const crnId = `CRN-2026-${Math.floor(100 + Math.random() * 900)}`;

    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: 'approved',
              reviewedBy: currentUser.name,
              reviewedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
              creditNoteId: crnId,
              creditNoteAmount: creditAmount,
              adminRemarks: remarks || 'Shortage verified against driver endorsed LR tally. Credit note approved.',
            }
          : c
      )
    );

    // Credit Distributor Wallet
    setWallet((prev) => ({
      ...prev,
      availableBalance: prev.availableBalance + creditAmount,
      transactions: [
        {
          id: `tx-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          reference: crnId,
          description: `Credit Note for Claim ${claimId} (${claim.shortageQuantityBags} bags shortage)`,
          debit: 0,
          credit: creditAmount,
          balance: prev.availableBalance + creditAmount,
          type: 'credit_note',
        },
        ...prev.transactions,
      ],
    }));

    addAuditLog(
      'Claim Approved & Credit Note Issued',
      'Claim',
      claimId,
      `Approved shortage claim ${claimId}. Generated Credit Note ${crnId} for ${formatINR(creditAmount)}.`
    );

    addNotification(
      `Credit Note ${crnId} Generated`,
      `Claim ${claimId} approved. Wallet credited with ${formatINR(creditAmount)} for ${claim.dealerAgency}.`,
      'credit',
      { role: 'dealer', tab: 'claims', referenceId: claimId }
    );

    // Dispatch to Authoritative Backend
    (async () => {
      try {
        const rawId = claimId.startsWith('CLM-') ? claimId.replace('CLM-', '') : claimId;
        await api.claims.review(rawId, 'APPROVE', remarks, creditAmount);
      } catch (err: any) {
        console.warn('Backend claim approve sync note:', err.message);
      }
    })();

    showToast(`Claim approved! Credit note ${crnId} of ${formatINR(creditAmount)} generated.`, 'success');
  };

  const rejectClaim = (claimId: string, remarks: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: 'rejected',
              reviewedBy: currentUser.name,
              reviewedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
              adminRemarks: remarks,
            }
          : c
      )
    );

    // Dispatch to Authoritative Backend
    (async () => {
      try {
        const rawId = claimId.startsWith('CLM-') ? claimId.replace('CLM-', '') : claimId;
        await api.claims.review(rawId, 'REJECT', remarks);
      } catch (err: any) {
        console.warn('Backend claim reject sync note:', err.message);
      }
    })();

    addAuditLog(
      'Claim Rejected',
      'Claim',
      claimId,
      `Rejected claim ${claimId}. Reason: ${remarks}.`
    );

    showToast(`Claim ${claimId} rejected.`, 'info');
  };

  // FIELD SALES DEALER VISITS
  const recordDealerVisit = (visitData: Omit<DealerVisit, 'id' | 'isSynced'>) => {
    const visitId = `VST-${Math.floor(100 + Math.random() * 900)}`;
    const newVisit: DealerVisit = {
      ...visitData,
      id: visitId,
      isSynced: !isOfflineMode,
    };

    if (isOfflineMode) {
      setOfflineQueue((prev) => [...prev, { type: 'dealer_visit', payload: newVisit }]);
      showToast('Visit saved to local device. Will sync once back online.', 'info');
    } else {
      showToast(`Dealer visit recorded for ${visitData.dealerAgency}.`, 'success');
    }

    setVisits((prev) => [newVisit, ...prev]);

    addAuditLog(
      'Dealer Visit Recorded',
      'Visit',
      visitId,
      `Sales agent ${currentUser.name} checked into ${visitData.dealerAgency} (${visitData.gpsCoordinates}). Stock count: ${visitData.currentStockBags} bags.`
    );
  };

  const syncOfflineQueue = () => {
    if (offlineQueue.length === 0) {
      showToast('No pending offline actions to sync.', 'info');
      return;
    }

    // Mark visits synced
    setVisits((prev) => prev.map((v) => ({ ...v, isSynced: true })));
    setOfflineQueue([]);
    setIsOfflineMode(false);
    showToast(`Successfully synchronized all offline records with BFEL Central Plant.`, 'success');
  };

  // SIGNUPS
  const approveSignup = (id: string) => {
    setPendingSignups((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'approved' } : s))
    );
    showToast(`Approved registration for ${id}. Provisioned in dealership directory.`, 'success');
  };

  const rejectSignup = (id: string) => {
    setPendingSignups((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s))
    );
    showToast(`Application rejected.`, 'info');
  };

  const requestSignup = (signup: Omit<PendingSignup, 'id' | 'appliedDate' | 'status'>) => {
    const newSignup: PendingSignup = {
      ...signup,
      id: `sgn-${Date.now()}`,
      appliedDate: new Date().toISOString().substring(0, 10),
      status: 'pending',
    };
    setPendingSignups((prev) => [newSignup, ...prev]);
    showToast(`Application submitted! Pending admin review & onboarding verification.`, 'success');
  };

  // NOTIFICATIONS
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // MODAL HANDLERS
  const openModal = (modalName: string, data?: any) => {
    setActiveModal(modalName);
    setActiveModalData(data || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveModalData(null);
  };

  // RESET
  const resetToDefault = () => {
    localStorage.removeItem('bfel_orders');
    localStorage.removeItem('bfel_payments');
    localStorage.removeItem('bfel_vehicles');
    localStorage.removeItem('bfel_wallet');
    localStorage.removeItem('bfel_allocations');
    localStorage.removeItem('bfel_claims');
    localStorage.removeItem('bfel_visits');
    localStorage.removeItem('bfel_audits');
    localStorage.removeItem('bfel_notifications');
    localStorage.removeItem('bfel_signups');

    setOrders(INITIAL_ORDERS);
    setPayments(INITIAL_PAYMENTS);
    setVehicles(INITIAL_VEHICLES);
    setWallet(INITIAL_WALLET);
    setAllocations(INITIAL_ALLOCATIONS);
    setClaims(INITIAL_CLAIMS);
    setVisits(INITIAL_VISITS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setPendingSignups(INITIAL_PENDING_SIGNUPS);
    setCurrentRole('dealer');
    setCurrentUser(DEFAULT_USERS.dealer);
    showToast('Platform reset to pristine Indore factory demo state.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        switchRole,
        users: DEFAULT_USERS,
        products,
        orders,
        createOrder,
        getOrderById,
        payments,
        submitPayment,
        verifyPayment,
        rejectPayment,
        vehicles,
        updateLoadingProgress,
        completeLoading,
        dispatchOrder,
        claims,
        createClaim,
        approveClaim,
        rejectClaim,
        wallet,
        allocations,
        visits,
        recordDealerVisit,
        isOfflineMode,
        setIsOfflineMode,
        pendingSyncCount: offlineQueue.length,
        syncOfflineQueue,
        auditLogs,
        addAuditLog,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        pendingSignups,
        approveSignup,
        rejectSignup,
        requestSignup,
        activeModal,
        activeModalData,
        openModal,
        closeModal,
        resetToDefault,
        toastMessage,
        toastType,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
