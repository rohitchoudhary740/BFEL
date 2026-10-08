/**
 * BFEL FLOW — Authoritative Enterprise API Client
 * Connects frontend directly to Django 5 REST Framework backend with JWT authentication.
 */

const getBaseUrl = (): string => {
  // Support both Next.js and Vite env variables, fallback to local Django DRF
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    // @ts-ignore
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:8000/api/v1';
};

export const API_BASE_URL = getBaseUrl();

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface BackendUser {
  id: number | string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  organization: string;
  territory?: string;
  permissions?: string[];
}

export interface BackendProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  bag_weight_kg: number;
  protein_percent: string;
  fat_percent: string;
  price_per_bag: string;
  is_active: boolean;
}

export interface BackendOrderItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  bags: number;
  bag_weight_kg: number;
  weight_kg: string;
  weight_mt: string;
  rate_per_bag: string;
  total_amount: string;
}

export interface BackendOrder {
  id: number;
  order_number: string;
  dealer: {
    id: number;
    dealership_name: string;
    city: string;
    district: string;
    state: string;
    user_name: string;
    phone: string;
  };
  distributor?: {
    id: number;
    company_name: string;
    distributor_code: string;
  };
  truck_capacity: '20_MT' | '25_MT';
  max_bags: number;
  total_bags: number;
  total_weight_kg: string;
  total_weight_mt: string;
  subtotal: string;
  discount: string;
  net_total: string;
  advance_payable: string;
  advance_paid: string;
  status: string;
  destination: string;
  requested_dispatch_date?: string | null;
  notes?: string;
  created_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    phone: string;
    role_name: string;
  };
  created_at: string;
  updated_at: string;
  items: BackendOrderItem[];
}

export interface BackendPayment {
  id: number;
  order_id: number;
  order_number: string;
  dealer_name: string;
  amount: string;
  payment_mode: 'RTGS' | 'NEFT' | 'IMPS' | 'WALLET';
  utr_number: string;
  bank_name: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  receipt_url?: string;
  submitted_by?: any;
  verified_by?: any;
  verified_at?: string | null;
  rejection_reason?: string;
  created_at: string;
}

export interface BackendClaim {
  id: number;
  claim_number: string;
  order: number;
  order_number: string;
  dealer: number;
  dealer_name: string;
  dealer_code: string;
  claim_type: string;
  affected_bags: number;
  expected_bags: number;
  received_bags: number;
  shortage_bags: number;
  shortage_weight_kg: string;
  description: string;
  status: 'CREATED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  credit_note_id?: string;
  credit_note_amount?: string;
  created_by_name?: string;
  reviewed_by_name?: string;
  reviewed_at?: string | null;
  review_notes?: string;
  admin_remarks?: string;
  evidence_files?: Array<{
    id: number;
    file_reference: string;
    file_url: string;
    content_type: string;
    size_bytes: number;
    caption: string;
  }>;
  created_at: string;
}

// Token helper methods
export const getStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bfel_jwt_access');
};

export const setStoredTokens = (tokens: AuthTokens) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bfel_jwt_access', tokens.access);
  localStorage.setItem('bfel_jwt_refresh', tokens.refresh);
};

export const clearStoredTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bfel_jwt_access');
  localStorage.removeItem('bfel_jwt_refresh');
};

// Generic HTTP request wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Append Bearer token if not explicitly excluded
  const token = getStoredAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If body is not FormData, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.error || JSON.stringify(errorJson);
    } catch {
      // Non-JSON response
    }
    throw new Error(errorDetail);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// Specialized API modules
export const api = {
  // System Health
  health: {
    check: () => request<{ status: string }>('/health/'),
  },

  // Authentication
  auth: {
    login: (phoneOrIdentifier: string, password: string) =>
      request<{ tokens: AuthTokens; user: BackendUser }>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneOrIdentifier, password }),
      }),

    requestOtp: (phone: string) =>
      request<{ success: boolean; message: string; dev_otp?: string; expires_in_seconds: number }>(
        '/auth/otp/request/',
        {
          method: 'POST',
          body: JSON.stringify({ phone }),
        }
      ),

    verifyOtp: (phone: string, otp: string) =>
      request<{ tokens: AuthTokens; user: BackendUser; is_registered: boolean }>(
        '/auth/otp/verify/',
        {
          method: 'POST',
          body: JSON.stringify({ phone, otp }),
        }
      ),

    me: () => request<BackendUser>('/auth/me/'),

    signupDealer: (data: any) =>
      request<{ success: boolean; user: BackendUser; dealer: any }>('/auth/signup/dealer/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    signupSalesAgent: (data: any) =>
      request<{ success: boolean; user: BackendUser; sales_agent: any }>('/auth/signup/sales-agent/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    signupDistributor: (data: any) =>
      request<{ success: boolean; message: string; applicationId: string }>('/auth/signup/distributor/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Products Catalog
  products: {
    list: () => request<BackendProduct[]>('/products/'),
  },

  // Authorized Dealers
  dealers: {
    list: () =>
      request<
        Array<{
          id: number;
          dealership_name: string;
          city: string;
          district: string;
          state: string;
          user_name: string;
          phone: string;
        }>
      >('/dealers/'),
  },

  // Feed Orders
  orders: {
    list: () => request<BackendOrder[]>('/orders/'),
    get: (id: number | string) => request<BackendOrder>(`/orders/${id}/`),
    create: (data: {
      dealer_id?: number | string;
      truck_capacity: '20_MT' | '25_MT';
      destination: string;
      notes?: string;
      items: Array<{
        product_id: number;
        bags: number;
        rate_per_bag?: string | number;
      }>;
    }) =>
      request<BackendOrder>('/orders/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    submit: (id: number | string) =>
      request<BackendOrder>(`/orders/${id}/submit/`, {
        method: 'POST',
      }),
    cancel: (id: number | string, reason?: string) =>
      request<{ detail: string }>(`/orders/${id}/cancel/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    calculateWeight: (bag_quantity: number) =>
      request<{ bag_quantity: number; weight_kg: string; weight_mt: string }>(
        '/orders/calculate-weight/',
        {
          method: 'POST',
          body: JSON.stringify({ bag_quantity }),
        }
      ),
  },

  // Payments
  payments: {
    list: (params?: { status?: string; order_id?: number | string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.order_id) q.set('order_id', String(params.order_id));
      const qs = q.toString() ? `?${q.toString()}` : '';
      return request<BackendPayment[]>(`/payments/${qs}`);
    },
    get: (id: number | string) => request<BackendPayment>(`/payments/${id}/`),
    submit: (data: {
      order_id: number | string;
      payment_mode: 'RTGS' | 'NEFT' | 'IMPS' | 'WALLET';
      utr_number: string;
      bank_name: string;
      amount?: string | number;
      receipt_url?: string;
    }) =>
      request<BackendPayment>('/payments/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verify: (id: number | string, notes?: string) =>
      request<BackendPayment>(`/payments/${id}/verify/`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    reject: (id: number | string, reason: string) =>
      request<BackendPayment>(`/payments/${id}/reject/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // Distributor Wallets
  wallets: {
    my: () => request<any>('/wallets/my/'),
    get: (id: number | string) => request<any>(`/wallets/${id}/`),
    credit: (id: number | string, amount: number | string, reference: string, description: string) =>
      request<any>(`/wallets/${id}/credit/`, {
        method: 'POST',
        body: JSON.stringify({ amount, reference, description }),
      }),
    ledger: (id: number | string) => request<any[]>(`/wallets/${id}/ledger/`),
  },

  // Plant Truck Loading Operations
  loading: {
    getQueue: () =>
      request<{
        queued_orders: any[];
        active_sessions: any[];
        awaiting_gate_pass: any[];
        ready_for_dispatch: any[];
        counts: {
          queued_count: number;
          active_loading_count: number;
          awaiting_gate_pass_count: number;
          ready_for_dispatch_count: number;
        };
      }>('/loading/queue/'),
    getAssets: () =>
      request<{
        trucks: any[];
        drivers: any[];
        bays: any[];
      }>('/loading/assets/'),
    getSessions: () => request<any[]>('/loading/sessions/'),
    assign: (data: {
      order_id: number | string;
      truck_id: number | string;
      bay_id: number | string;
      driver_id: number | string;
    }) =>
      request<any>('/loading/sessions/assign/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    start: (sessionId: number | string) =>
      request<any>(`/loading/sessions/${sessionId}/start/`, {
        method: 'POST',
      }),
    recordBagCount: (sessionId: number | string, bags_loaded: number, notes?: string) =>
      request<any>(`/loading/sessions/${sessionId}/bag-count/`, {
        method: 'POST',
        body: JSON.stringify({ bags_loaded, notes }),
      }),
    recordWeighbridge: (
      sessionId: number | string,
      tare_weight_kg: string | number,
      gross_weight_kg: string | number,
      slip_number?: string
    ) =>
      request<any>(`/loading/sessions/${sessionId}/weighbridge/`, {
        method: 'POST',
        body: JSON.stringify({ tare_weight_kg, gross_weight_kg, slip_number }),
      }),
    complete: (sessionId: number | string, seal_number: string, notes?: string) =>
      request<any>(`/loading/sessions/${sessionId}/complete/`, {
        method: 'POST',
        body: JSON.stringify({ seal_number, notes }),
      }),
    generateGatePass: (sessionId: number | string) =>
      request<{
        id: number;
        gate_pass_number: string;
        order_number: string;
        truck_number: string;
        driver_name: string;
        seal_number: string;
        qr_code_hash: string;
        issued_at: string;
      }>(`/loading/sessions/${sessionId}/gate-pass/`, {
        method: 'POST',
      }),
  },

  // Dispatches
  dispatch: {
    list: () => request<any[]>('/dispatch/'),
    create: (order_id: number | string, lr_number: string, gate_pass_id?: number | string) =>
      request<any>('/dispatch/', {
        method: 'POST',
        body: JSON.stringify({ order_id, lr_number, gate_pass_id }),
      }),
  },

  // Claims
  claims: {
    list: () => request<BackendClaim[]>('/claims/'),
    get: (id: number | string) => request<BackendClaim>(`/claims/${id}/`),
    create: (formData: FormData | { order: number | string; claim_type: string; affected_bags: number; description: string }) => {
      const isFormData = typeof FormData !== 'undefined' && formData instanceof FormData;
      return request<BackendClaim>('/claims/', {
        method: 'POST',
        body: isFormData ? formData : JSON.stringify(formData),
      });
    },
    uploadEvidence: (claimId: number | string, file: File, caption?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (caption) formData.append('caption', caption);
      return request<any>(`/claims/${claimId}/evidence/`, {
        method: 'POST',
        body: formData,
      });
    },
    review: (
      claimId: number | string,
      action: 'APPROVE' | 'REJECT' | 'UNDER_REVIEW',
      notes?: string,
      approved_amount?: string | number
    ) =>
      request<BackendClaim>(`/claims/${claimId}/review/`, {
        method: 'POST',
        body: JSON.stringify({ action, notes, approved_amount }),
      }),
  },

  // Live Real-Time Dashboard & Polling
  live: {
    getDashboard: (since?: string) => {
      const q = since ? `?since=${encodeURIComponent(since)}` : '';
      return request<any>(`/live/dashboard/${q}`);
    },
    getOrderStatus: (orderId: number | string) => request<any>(`/live/orders/${orderId}/`),
    getEvents: (since?: string, limit: number = 50) => {
      const q = new URLSearchParams();
      if (since) q.set('since', since);
      q.set('limit', String(limit));
      return request<any>(`/live/events/?${q.toString()}`);
    },
  },
};
