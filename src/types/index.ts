export type UserRole = 
  | 'dealer'
  | 'sales_agent'
  | 'distributor'
  | 'accounts'
  | 'loading_operator'
  | 'admin';

export type AccountStatus = 'active' | 'pending' | 'suspended' | 'rejected';

export type Permission =
  // Dealer
  | 'dealer:orders:view'
  | 'dealer:orders:create'
  | 'dealer:payments:submit'
  | 'dealer:wallet:view'
  | 'dealer:shipments:track'
  | 'dealer:claims:create'
  // Sales Agent
  | 'sales:dealers:view'
  | 'sales:orders:create'
  | 'sales:visits:record'
  | 'sales:territory:view'
  // Distributor
  | 'distributor:orders:view'
  | 'distributor:wallet:view'
  | 'distributor:credit:view'
  | 'distributor:allocations:view'
  | 'distributor:dispatch:view'
  | 'distributor:claims:create'
  // Accounts
  | 'accounts:payments:view'
  | 'accounts:payments:verify'
  | 'accounts:payments:reject'
  | 'accounts:credit_notes:create'
  | 'accounts:ledger:view'
  // Loading Operator
  | 'loading:queue:view'
  | 'loading:truck:view'
  | 'loading:quantity:update'
  | 'loading:weighbridge:record'
  | 'loading:seal:enter'
  | 'loading:complete'
  // Admin
  | 'admin:users:manage'
  | 'admin:users:approve'
  | 'admin:orders:all'
  | 'admin:payments:all'
  | 'admin:loading:manage'
  | 'admin:dispatch:manage'
  | 'admin:claims:review'
  | 'admin:reports:view'
  | 'admin:audits:view';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  organization: string; // e.g. "Patel Agro Agency" or "BFEL Central Plant"
  territory?: string; // e.g. "Dewas Mandi Yard, MP"
  gstin?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  preferredLocation?: string;
  employeeId?: string;
  reportingManager?: string;
  distributorCode?: string;
  permissions: Permission[];
  createdAt: string;
  lastLogin?: string;
  rejectionReason?: string;
  avatarColor?: string;
  password?: string; // Simulated for prototype
  applicationId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  entityName: string; // e.g. "Patel Agro Agency" or "BFEL Central Plant"
  location: string; // e.g. "Dewas, MP"
  avatarColor: string;
}

export type TruckCapacityType = '20_MT' | '25_MT';

export interface Product {
  id: string;
  name: string;
  sku: string;
  bagWeightKg: number; // always 50 kg
  proteinPercent: number;
  fatPercent: number;
  pricePerBag: number;
  stockAvailableBags: number;
  category: 'Cattle Feed' | 'Specialty' | 'Pellets';
  description: string;
}

export type OrderStatus =
  | 'order_placed'
  | 'payment_submitted'
  | 'payment_verified'
  | 'loading_planned'
  | 'loading'
  | 'loading_completed'
  | 'dispatch_ready'
  | 'dispatched'
  | 'delivered';

export interface OrderItem {
  productId: string;
  productName: string;
  bags: number;
  weightKg: number;
  weightMT: number;
  ratePerBag: number;
  totalAmount: number;
}

export interface Order {
  id: string;
  date: string;
  dealerId: string;
  dealerName: string;
  dealerPhone: string;
  dealerAgency: string;
  distributorId: string;
  distributorName: string;
  destination: string;
  truckCapacity: TruckCapacityType;
  maxBags: number; // 400 for 20 MT, 500 for 25 MT
  items: OrderItem[];
  totalBags: number;
  totalWeightKg: number;
  totalWeightMT: number;
  subtotal: number;
  schemeDiscount: number;
  schemeName?: string;
  tax: number;
  netTotal: number;
  advancePayable: number;
  advancePaid: number;
  status: OrderStatus;
  paymentId?: string;
  assignedVehicle?: string;
  assignedDriver?: string;
  assignedBay?: string;
  loadingProgressBags?: number;
  tareWeightKg?: number;
  grossWeightKg?: number;
  netWeightKg?: number;
  expectedWeightKg?: number;
  weightVarianceKg?: number;
  sealNumber?: string;
  lrNumber?: string;
  gatePassId?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export type PaymentMode = 'RTGS' | 'NEFT' | 'IMPS';

export type PaymentStatus = 'pending_verification' | 'verified' | 'rejected';

export interface PaymentRecord {
  id: string;
  orderId: string;
  dealerName: string;
  dealerAgency: string;
  amount: number;
  mode: PaymentMode;
  utr: string;
  bankName: string;
  submittedAt: string;
  status: PaymentStatus;
  receiptUrl?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  remarks?: string;
}

export interface WalletTransaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: 'order_charge' | 'advance_deposit' | 'credit_note' | 'scheme_rebate';
}

export interface DistributorWallet {
  availableBalance: number; // e.g. ₹4,20,000
  reservedFunds: number; // e.g. ₹1,80,000
  creditLimit: number; // e.g. ₹10,00,000
  availableCredit: number; // e.g. ₹6,80,000
  creditUtilizationPercent: number; // e.g. 32%
  transactions: WalletTransaction[];
}

export interface ProductAllocation {
  productId: string;
  productName: string;
  allocatedBags: number;
  availableBags: number;
  reservedBags: number;
}

export interface Vehicle {
  registrationNumber: string; // e.g. "MP09AB1234"
  capacity: TruckCapacityType;
  maxBags: number;
  driverName: string;
  driverPhone: string;
  driverLicense: string;
  status: 'available' | 'queued' | 'loading' | 'dispatched' | 'delivered' | 'delayed';
  currentOrderId?: string;
  currentBay?: string;
  lastTripDate: string;
}

export type ClaimType = 'shortage' | 'damaged_bags' | 'quality_issue' | 'wrong_product';

export type ClaimStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface Claim {
  id: string;
  orderId: string;
  dealerName: string;
  dealerAgency: string;
  distributorName: string;
  claimType: ClaimType;
  expectedQuantityBags: number;
  receivedQuantityBags: number;
  shortageQuantityBags: number;
  expectedWeightKg: number;
  receivedWeightKg: number;
  shortageWeightKg: number;
  description: string;
  photos: string[];
  submittedDate: string;
  location: string;
  status: ClaimStatus;
  reviewedBy?: string;
  reviewedDate?: string;
  creditNoteId?: string;
  creditNoteAmount?: number;
  adminRemarks?: string;
}

export interface DealerVisit {
  id: string;
  agentId: string;
  agentName: string;
  dealerId: string;
  dealerAgency: string;
  dealerContact: string;
  location: string;
  gpsStatus: 'verified' | 'approximate' | 'offline_cached';
  gpsCoordinates: string;
  visitTime: string;
  lastVisitDate: string;
  lastOrderDate: string;
  outstandingBalance: number;
  currentStockBags: number;
  notes: string;
  photos: string[];
  orderCreatedId?: string;
  isSynced: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  entity: 'Order' | 'Payment' | 'Loading' | 'Dispatch' | 'Claim' | 'Wallet' | 'Visit' | 'Auth' | 'User';
  reference: string;
  description: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order' | 'payment' | 'loading' | 'dispatch' | 'claim' | 'credit';
  read: boolean;
  linkAction?: {
    role: UserRole;
    tab: string;
    referenceId?: string;
  };
}

export interface PendingSignup {
  id: string;
  name: string;
  phone: string;
  email: string;
  requestedRole: 'dealer' | 'sales_agent';
  dealershipName: string;
  territory: string;
  appliedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}
