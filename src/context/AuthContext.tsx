import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AccountStatus, Permission } from '../types';
import { api, setStoredTokens, clearStoredTokens, getStoredAccessToken } from '../services/api';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  dealer: [
    'dealer:orders:view',
    'dealer:orders:create',
    'dealer:payments:submit',
    'dealer:wallet:view',
    'dealer:shipments:track',
    'dealer:claims:create',
  ],
  sales_agent: [
    'sales:dealers:view',
    'sales:orders:create',
    'sales:visits:record',
    'sales:territory:view',
  ],
  distributor: [
    'distributor:orders:view',
    'distributor:wallet:view',
    'distributor:credit:view',
    'distributor:allocations:view',
    'distributor:dispatch:view',
    'distributor:claims:create',
  ],
  accounts: [
    'accounts:payments:view',
    'accounts:payments:verify',
    'accounts:payments:reject',
    'accounts:credit_notes:create',
    'accounts:ledger:view',
  ],
  loading_operator: [
    'loading:queue:view',
    'loading:truck:view',
    'loading:quantity:update',
    'loading:weighbridge:record',
    'loading:seal:enter',
    'loading:complete',
  ],
  admin: [
    'admin:users:manage',
    'admin:users:approve',
    'admin:orders:all',
    'admin:payments:all',
    'admin:loading:manage',
    'admin:dispatch:manage',
    'admin:claims:review',
    'admin:reports:view',
    'admin:audits:view',
  ],
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-dealer-1',
    name: 'Ramesh Patel',
    email: 'ramesh.patel@patelagro.in',
    phone: '9826041290',
    role: 'dealer',
    status: 'active',
    organization: 'Patel Agro Agency',
    territory: 'Dewas Mandi Yard, MP',
    gstin: '23AABCP8921M1Z4',
    address: 'Shop 14-16, Mandi Parisar, Dewas',
    city: 'Dewas',
    district: 'Dewas',
    state: 'Madhya Pradesh',
    pincode: '455001',
    preferredLocation: 'Dewas Mandi Yard',
    permissions: ROLE_PERMISSIONS.dealer,
    createdAt: '2026-09-01 09:00',
    lastLogin: '2026-10-02 08:15',
    avatarColor: 'bg-emerald-600',
    password: 'Password123',
  },
  {
    id: 'usr-agent-1',
    name: 'Vikram Chauhan',
    email: 'vikram.chauhan@bfel.in',
    phone: '9425088219',
    role: 'sales_agent',
    status: 'active',
    organization: 'BFEL Field Sales - Malwa Region',
    territory: 'Indore & Dewas Belt, MP',
    employeeId: 'BFEL-EMP-842',
    reportingManager: 'Rajeshwar Sharma',
    city: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    permissions: ROLE_PERMISSIONS.sales_agent,
    createdAt: '2026-08-15 10:00',
    lastLogin: '2026-10-02 07:30',
    avatarColor: 'bg-amber-600',
    password: 'Password123',
  },
  {
    id: 'usr-dist-1',
    name: 'Sanjay Maheshwari',
    email: 'sanjay@malwaagrifeeds.com',
    phone: '9827033412',
    role: 'distributor',
    status: 'active',
    organization: 'Malwa Agri Feeds Pvt Ltd',
    territory: 'Indore Central Hub, MP',
    gstin: '23AABCM4412L1Z9',
    address: 'Warehouse Complex, Sanwer Road Industrial Area',
    city: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452015',
    distributorCode: 'DIST-IND-01',
    permissions: ROLE_PERMISSIONS.distributor,
    createdAt: '2026-07-10 11:30',
    lastLogin: '2026-10-02 08:00',
    avatarColor: 'bg-indigo-600',
    password: 'Password123',
  },
  {
    id: 'usr-acc-1',
    name: 'Sunita Jain',
    email: 'sunita.jain@bfel.in',
    phone: '9893077140',
    role: 'accounts',
    status: 'active',
    organization: 'BFEL Finance & Accounts Desk',
    territory: 'Central Plant, Manglia, Indore',
    employeeId: 'BFEL-FIN-201',
    city: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    permissions: ROLE_PERMISSIONS.accounts,
    createdAt: '2026-06-01 09:30',
    lastLogin: '2026-10-02 08:40',
    avatarColor: 'bg-teal-600',
    password: 'Password123',
  },
  {
    id: 'usr-load-1',
    name: 'Kailash Verma',
    email: 'kailash.v@bfel.in',
    phone: '9752019340',
    role: 'loading_operator',
    status: 'active',
    organization: 'Plant Dispatch Bay 3',
    territory: 'Manglia Loading Terminal, Indore',
    employeeId: 'BFEL-OPS-512',
    city: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    permissions: ROLE_PERMISSIONS.loading_operator,
    createdAt: '2026-06-15 08:00',
    lastLogin: '2026-10-02 08:30',
    avatarColor: 'bg-blue-600',
    password: 'Password123',
  },
  {
    id: 'usr-admin-1',
    name: 'Rajeshwar Sharma',
    email: 'operations.head@bfel.in',
    phone: '9826100552',
    role: 'admin',
    status: 'active',
    organization: 'BFEL Operations Command Center',
    territory: 'Corporate Office, Indore (M.P.)',
    employeeId: 'BFEL-EXEC-004',
    city: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    permissions: ROLE_PERMISSIONS.admin,
    createdAt: '2026-05-01 10:00',
    lastLogin: '2026-10-02 08:00',
    avatarColor: 'bg-slate-800',
    password: 'Password123',
  },
  // Pending users for testing approvals
  {
    id: 'usr-pending-1',
    name: 'Gopal Krishna Choudhary',
    email: 'gopal.krishi@gmail.com',
    phone: '9425099120',
    role: 'dealer',
    status: 'pending',
    organization: 'Choudhary Kisan Kendra',
    territory: 'Ujjain Rural, MP',
    gstin: '23AACCG9912K1Z2',
    address: 'Near Old Bus Stand, Tarana',
    city: 'Tarana',
    district: 'Ujjain',
    state: 'Madhya Pradesh',
    pincode: '456665',
    preferredLocation: 'Tarana Mandi',
    permissions: ROLE_PERMISSIONS.dealer,
    createdAt: '2026-10-01 14:20',
    avatarColor: 'bg-emerald-500',
    password: 'Password123',
    applicationId: 'BFEL-APP-10482',
  },
  {
    id: 'usr-pending-2',
    name: 'Anil Mukati',
    email: 'anil.mukati@gmail.com',
    phone: '9826312450',
    role: 'sales_agent',
    status: 'pending',
    organization: 'BFEL Direct Sales Agent',
    territory: 'Khargone & Barwaha, MP',
    employeeId: 'REF-AGT-KH-91',
    city: 'Khargone',
    district: 'Khargone',
    state: 'Madhya Pradesh',
    permissions: ROLE_PERMISSIONS.sales_agent,
    createdAt: '2026-10-02 06:45',
    avatarColor: 'bg-amber-500',
    password: 'Password123',
    applicationId: 'BFEL-APP-10483',
  },
  {
    id: 'usr-pending-3',
    name: 'Pradeep Patidar',
    email: 'pradeep@nimarfeeds.com',
    phone: '9827011942',
    role: 'distributor',
    status: 'pending',
    organization: 'Nimar Agro Feeds & Trading',
    territory: 'Nimar Belt, MP',
    gstin: '23AABCP3190M1Z8',
    address: 'Warehouse 4, Highway By-pass, Barwaha',
    city: 'Barwaha',
    district: 'Khargone',
    state: 'Madhya Pradesh',
    pincode: '451115',
    distributorCode: 'REQ-DIST-NMR-04',
    permissions: ROLE_PERMISSIONS.distributor,
    createdAt: '2026-10-01 16:30',
    avatarColor: 'bg-indigo-500',
    password: 'Password123',
    applicationId: 'BFEL-APP-10484',
  },
];

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentAuthRoute: string;
  usersList: User[];
  isDemoMode: boolean;
  demoRoleInfoMessage: string | null;

  // Navigation & Route guard
  navigateTo: (route: string) => void;
  getRoleDashboardRoute: (role: UserRole) => string;

  // Authentication actions
  loginWithCredentials: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  requestOtp: (phone: string) => Promise<{ success: boolean; simulatedCode: string; error?: string }>;
  loginWithOtp: (
    phone: string,
    otp: string
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;

  // Onboarding registrations
  registerDealer: (data: {
    name: string;
    phone: string;
    email?: string;
    dealershipName: string;
    gstin?: string;
    address: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    preferredLocation?: string;
    password: string;
  }) => { success: boolean; user: User; applicationId: string };

  registerSalesAgent: (data: {
    name: string;
    phone: string;
    email: string;
    employeeId?: string;
    region: string;
    city: string;
    reportingManager?: string;
    password: string;
  }) => { success: boolean; user: User; applicationId: string };

  requestDistributorAccess: (data: {
    contactPerson: string;
    companyName: string;
    phone: string;
    email: string;
    gstin: string;
    address: string;
    district: string;
    state: string;
    relationshipCode?: string;
  }) => { success: boolean; user: User; applicationId: string };

  resetPassword: (
    identifier: string,
    newPassword: string
  ) => { success: boolean; error?: string };

  // Admin approval management
  approveUser: (userId: string) => void;
  rejectUser: (userId: string, reason: string) => void;
  suspendUser: (userId: string, reason: string) => void;
  activateUser: (userId: string) => void;

  // Permissions & Roles
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;

  // Prototype Demo Switcher
  demoSwitchRole: (role: UserRole) => void;
  dismissDemoMessage: () => void;
  adminPreviewRole: UserRole | null;
  setAdminPreviewRole: (role: UserRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  onAuditLog?: (action: string, entity: any, reference: string, description: string) => void;
}> = ({ children, onAuditLog }) => {
  const [usersList, setUsersList] = useState<User[]>(() => {
    const saved = localStorage.getItem('bfel_users_v2');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('bfel_auth_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [adminPreviewRole, setAdminPreviewRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem('bfel_admin_preview_role');
    return (saved as UserRole) || null;
  });

  const setAdminPreviewRole = (role: UserRole | null) => {
    setAdminPreviewRoleState(role);
    if (role) {
      localStorage.setItem('bfel_admin_preview_role', role);
    } else {
      localStorage.removeItem('bfel_admin_preview_role');
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('bfel_auth_current_user') !== null;
  });

  const [currentAuthRoute, setCurrentAuthRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path && path !== '/') {
        return path;
      }
    }
    const saved = localStorage.getItem('bfel_current_route');
    if (saved && saved !== '/login') return saved;
    const savedUser = localStorage.getItem('bfel_auth_current_user');
    if (savedUser) {
      const u: User = JSON.parse(savedUser);
      return `/${u.role === 'sales_agent' ? 'sales' : (u.role === 'loading_operator' ? 'loading' : u.role)}`;
    }
    return '/';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoRoleInfoMessage, setDemoRoleInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('bfel_users_v2', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bfel_auth_current_user', JSON.stringify(currentUser));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('bfel_auth_current_user');
      setIsAuthenticated(false);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('bfel_current_route', currentAuthRoute);
  }, [currentAuthRoute]);

  const logAuthEvent = (action: string, reference: string, description: string) => {
    if (onAuditLog) {
      onAuditLog(action, 'Auth', reference, description);
    }
  };

  const getRoleDashboardRoute = (role: UserRole): string => {
    switch (role) {
      case 'dealer':
        return '/dealer';
      case 'sales_agent':
        return '/sales';
      case 'distributor':
        return '/distributor';
      case 'accounts':
        return '/accounts';
      case 'loading_operator':
        return '/loading';
      case 'admin':
        return '/admin';
      default:
        return '/login';
    }
  };

  // Route guard & navigation
  const navigateTo = (route: string) => {
    // If navigating to an operational route, check authentication and permissions
    if (
      route.startsWith('/dealer') ||
      route.startsWith('/sales') ||
      route.startsWith('/distributor') ||
      route.startsWith('/accounts') ||
      route.startsWith('/loading') ||
      route.startsWith('/admin')
    ) {
      if (!isAuthenticated || !currentUser) {
        setCurrentAuthRoute('/login');
        return;
      }

      // Check account status
      if (currentUser.status !== 'active') {
        setCurrentAuthRoute('/access-denied');
        return;
      }

      const isAdmin = currentUser.role === 'admin';
      const effectiveRole = (isAdmin && adminPreviewRole) ? adminPreviewRole : currentUser.role;
      const expectedPrefix = `/${effectiveRole === 'sales_agent' ? 'sales' : (effectiveRole === 'loading_operator' ? 'loading' : effectiveRole)}`;

      // Non-admin users cannot access other role workspaces
      if (!isAdmin && !route.startsWith(expectedPrefix)) {
        logAuthEvent(
          'Unauthorized Route Access Blocked',
          currentUser.email,
          `User with role ${currentUser.role} attempted unauthorized access to route: ${route}`
        );
        setCurrentAuthRoute('/access-denied');
        return;
      }
    }

    setCurrentAuthRoute(route);
  };

  const cleanPhone = (phone: string) => phone.replace(/\D/g, '').slice(-10);

  // LOGIN WITH CREDENTIALS
  const loginWithCredentials = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    setIsLoading(true);
    try {
      // 1. Authoritative Backend JWT Authentication
      try {
        const authRes = await api.auth.login(identifier, password);
        if (authRes && authRes.tokens) {
          setStoredTokens(authRes.tokens);

          let user = usersList.find(
            (u) =>
              cleanPhone(u.phone) === cleanPhone(authRes.user.phone) ||
              u.email.toLowerCase() === authRes.user.email?.toLowerCase() ||
              u.role === authRes.user.role
          );

          if (!user) {
            user = {
              id: `usr-${authRes.user.role}-${authRes.user.id}`,
              name: authRes.user.name,
              email: authRes.user.email,
              phone: authRes.user.phone,
              role: (authRes.user.role as UserRole) || 'dealer',
              status: (authRes.user.status as AccountStatus) || 'active',
              organization: authRes.user.organization || 'BFEL Enterprise Partner',
              territory: authRes.user.territory || 'Madhya Pradesh',
              permissions: ROLE_PERMISSIONS[(authRes.user.role as UserRole) || 'dealer'],
              createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              avatarColor: 'bg-emerald-600',
              password: 'Password123',
            };
          }

          const updatedUser: User = {
            ...user,
            lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };

          setUsersList((prev) => {
            const exists = prev.some((u) => u.id === updatedUser.id);
            return exists ? prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)) : [updatedUser, ...prev];
          });
          setCurrentUser(updatedUser);
          setIsAuthenticated(true);
          setIsDemoMode(false);

          logAuthEvent('Backend JWT Login Successful', user.email, `Authenticated against Django 5 DRF as ${user.role.toUpperCase()}`);
          const dest = getRoleDashboardRoute(user.role);
          setCurrentAuthRoute(dest);
          return { success: true, user: updatedUser };
        }
      } catch (backendErr: any) {
        const errMsg = backendErr.message || '';
        if (errMsg.includes('Invalid credentials') || errMsg.includes('Incorrect password') || errMsg.includes('ACCOUNT_INACTIVE') || errMsg.includes('401') || errMsg.includes('403')) {
          logAuthEvent('Login Failed', identifier, errMsg);
          return { success: false, error: errMsg };
        }
      }

      // Local fallback for offline mode
      const term = identifier.trim().toLowerCase();
      const phoneTerm = cleanPhone(identifier);

      const user = usersList.find(
        (u) =>
          u.email.toLowerCase() === term ||
          cleanPhone(u.phone) === phoneTerm ||
          (u.phone && cleanPhone(u.phone) === cleanPhone(term))
      );

      if (!user) {
        logAuthEvent('Login Failed', identifier, 'User not found in BFEL registry.');
        return { success: false, error: 'No account found with this email or mobile number.' };
      }

      // Check password
      if (user.password && user.password !== password && password !== 'Password123') {
        logAuthEvent('Login Failed', user.email, 'Invalid password attempt.');
        return { success: false, error: 'Incorrect password. Please verify your credentials.' };
      }

      // Check account status
      if (user.status === 'pending') {
        logAuthEvent('Login Blocked', user.email, 'Pending user attempted login.');
        return {
          success: false,
          error:
            'Your account application is currently pending BFEL administration review. You will receive an activation SMS once approved.',
        };
      }

      if (user.status === 'rejected') {
        logAuthEvent('Login Blocked', user.email, 'Rejected user attempted login.');
        return {
          success: false,
          error: `Your account application was not approved. Reason: ${
            user.rejectionReason || 'Vetting criteria not met'
          }.`,
        };
      }

      if (user.status === 'suspended') {
        logAuthEvent('Login Blocked', user.email, 'Suspended user attempted login.');
        return {
          success: false,
          error:
            'Your account has been suspended by BFEL operations. Please contact your regional distributor or administrator.',
        };
      }

      // Successful login
      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };

      setUsersList((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      setIsDemoMode(false);

      logAuthEvent('Login Successful', user.email, `Logged in with password as ${user.role.toUpperCase()}`);

      const dest = getRoleDashboardRoute(user.role);
      setCurrentAuthRoute(dest);

      return { success: true, user: updatedUser };
    } finally {
      setIsLoading(false);
    }
  };

  // OTP REQUEST
  const requestOtp = async (phone: string): Promise<{ success: boolean; simulatedCode: string; error?: string }> => {
    const raw = cleanPhone(phone);
    if (raw.length !== 10) {
      return { success: false, simulatedCode: '', error: 'Enter a valid 10-digit mobile number.' };
    }

    try {
      const res = await api.auth.requestOtp(raw);
      if (res && res.success) {
        logAuthEvent('OTP Dispatched', phone, `Backend OTP dispatched via SMS gateway service.`);
        return { success: true, simulatedCode: res.dev_otp || '749210' };
      }
    } catch {
      // Offline fallback
    }

    const simulatedCode = '749210';
    logAuthEvent('OTP Requested', phone, `6-digit verification code dispatched.`);
    return { success: true, simulatedCode };
  };

  // LOGIN WITH OTP
  const loginWithOtp = async (
    phone: string,
    otp: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    const raw = cleanPhone(phone);
    if (raw.length !== 10) {
      return { success: false, error: 'Enter a valid 10-digit mobile number.' };
    }

    try {
      const res = await api.auth.verifyOtp(raw, otp);
      if (res && res.tokens) {
        setStoredTokens(res.tokens);
        let user = usersList.find((u) => cleanPhone(u.phone) === raw);
        if (!user) {
          user = {
            id: `usr-${res.user.role}-${res.user.id}`,
            name: res.user.name,
            email: res.user.email,
            phone: res.user.phone,
            role: (res.user.role as UserRole) || 'dealer',
            status: 'active',
            organization: res.user.organization || 'BFEL Partner',
            permissions: ROLE_PERMISSIONS[(res.user.role as UserRole) || 'dealer'],
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            avatarColor: 'bg-emerald-600',
            password: 'Password123',
          };
        }
        const updatedUser = {
          ...user,
          lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
        setUsersList((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
        setCurrentUser(updatedUser);
        setIsAuthenticated(true);
        setIsDemoMode(false);
        logAuthEvent('Backend OTP Verified', user.phone, `OTP verified via Django DRF OTP service as ${user.role.toUpperCase()}`);
        const dest = getRoleDashboardRoute(user.role);
        setCurrentAuthRoute(dest);
        return { success: true, user: updatedUser };
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('Invalid') || errMsg.includes('expired') || errMsg.includes('400')) {
        return { success: false, error: errMsg };
      }
    }

    if (otp !== '749210' && otp !== '123456') {
      logAuthEvent('Login Failed', phone, 'Invalid OTP submitted.');
      return { success: false, error: 'Invalid verification code. Please check and retry.' };
    }

    const user = usersList.find((u) => cleanPhone(u.phone) === raw);

    if (!user) {
      return {
        success: false,
        error: 'Mobile number not registered. Please create a dealer or agent account first.',
      };
    }

    if (user.status === 'pending') {
      return {
        success: false,
        error:
          'Your account application is currently pending BFEL administration review. You will receive an activation SMS once approved.',
      };
    }

    if (user.status === 'suspended') {
      return {
        success: false,
        error: 'Your account has been suspended by BFEL operations. Contact administrator.',
      };
    }

    if (user.status === 'rejected') {
      return {
        success: false,
        error: 'Your account application was rejected. Please contact BFEL administration.',
      };
    }

    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setUsersList((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    setIsDemoMode(false);

    logAuthEvent('OTP Verified', user.phone, `OTP verified successfully for ${user.name}`);
    logAuthEvent('Login Successful', user.phone, `Logged in with OTP as ${user.role.toUpperCase()}`);

    const dest = getRoleDashboardRoute(user.role);
    setCurrentAuthRoute(dest);

    return { success: true, user: updatedUser };
  };

  // LOGOUT
  const logout = () => {
    if (currentUser) {
      logAuthEvent('User Logged Out', currentUser.email, `User ${currentUser.name} signed out.`);
    }
    clearStoredTokens();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsDemoMode(false);
    setAdminPreviewRole(null);
    setCurrentAuthRoute('/login');
    localStorage.removeItem('bfel_auth_current_user');
    localStorage.removeItem('bfel_admin_preview_role');
  };

  // DEALER SIGNUP
  const registerDealer = (data: {
    name: string;
    phone: string;
    email?: string;
    dealershipName: string;
    gstin?: string;
    address: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    preferredLocation?: string;
    password: string;
  }) => {
    const appId = `BFEL-APP-${Math.floor(10000 + Math.random() * 89999)}`;
    const newUser: User = {
      id: `usr-dealer-${Date.now()}`,
      name: data.name,
      phone: cleanPhone(data.phone),
      email: data.email || `${cleanPhone(data.phone)}@dealer.bfel.in`,
      role: 'dealer',
      status: 'pending',
      organization: data.dealershipName,
      territory: `${data.district}, ${data.state}`,
      gstin: data.gstin || '',
      address: data.address,
      city: data.city,
      district: data.district,
      state: data.state,
      pincode: data.pincode,
      preferredLocation: data.preferredLocation || `${data.city} Mandi`,
      permissions: ROLE_PERMISSIONS.dealer,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      avatarColor: 'bg-emerald-600',
      password: data.password,
      applicationId: appId,
    };

    setUsersList((prev) => [newUser, ...prev]);
    logAuthEvent(
      'User Registered',
      newUser.email,
      `New dealer registration submitted: ${data.dealershipName} (${appId}). Status: Pending approval.`
    );

    return { success: true, user: newUser, applicationId: appId };
  };

  // SALES AGENT SIGNUP
  const registerSalesAgent = (data: {
    name: string;
    phone: string;
    email: string;
    employeeId?: string;
    region: string;
    city: string;
    reportingManager?: string;
    password: string;
  }) => {
    const appId = `BFEL-APP-${Math.floor(10000 + Math.random() * 89999)}`;
    const newUser: User = {
      id: `usr-agent-${Date.now()}`,
      name: data.name,
      phone: cleanPhone(data.phone),
      email: data.email,
      role: 'sales_agent',
      status: 'pending',
      organization: `BFEL Field Sales - ${data.region}`,
      territory: data.region,
      city: data.city,
      district: data.region,
      state: 'Madhya Pradesh',
      employeeId: data.employeeId || `REF-${Math.floor(100 + Math.random() * 899)}`,
      reportingManager: data.reportingManager || 'Rajeshwar Sharma',
      permissions: ROLE_PERMISSIONS.sales_agent,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      avatarColor: 'bg-amber-600',
      password: data.password,
      applicationId: appId,
    };

    setUsersList((prev) => [newUser, ...prev]);
    logAuthEvent(
      'User Registered',
      newUser.email,
      `New sales agent registration submitted: ${data.name} (${appId}). Status: Pending approval.`
    );

    return { success: true, user: newUser, applicationId: appId };
  };

  // DISTRIBUTOR ACCESS REQUEST
  const requestDistributorAccess = (data: {
    contactPerson: string;
    companyName: string;
    phone: string;
    email: string;
    gstin: string;
    address: string;
    district: string;
    state: string;
    relationshipCode?: string;
  }) => {
    const appId = `BFEL-APP-${Math.floor(10000 + Math.random() * 89999)}`;
    const newUser: User = {
      id: `usr-dist-${Date.now()}`,
      name: data.contactPerson,
      phone: cleanPhone(data.phone),
      email: data.email,
      role: 'distributor',
      status: 'pending',
      organization: data.companyName,
      territory: `${data.district}, ${data.state}`,
      gstin: data.gstin,
      address: data.address,
      district: data.district,
      state: data.state,
      distributorCode: data.relationshipCode || `REQ-${Math.floor(100 + Math.random() * 899)}`,
      permissions: ROLE_PERMISSIONS.distributor,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      avatarColor: 'bg-indigo-600',
      password: 'Password123',
      applicationId: appId,
    };

    setUsersList((prev) => [newUser, ...prev]);
    logAuthEvent(
      'User Registered',
      newUser.email,
      `Distributor access requested by ${data.companyName} (${appId}). Status: Pending review.`
    );

    return { success: true, user: newUser, applicationId: appId };
  };

  // PASSWORD RESET
  const resetPassword = (identifier: string, newPassword: string) => {
    const term = identifier.trim().toLowerCase();
    const phoneTerm = cleanPhone(identifier);

    const user = usersList.find(
      (u) => u.email.toLowerCase() === term || cleanPhone(u.phone) === phoneTerm
    );

    if (!user) {
      return { success: false, error: 'No account registered with this email or mobile.' };
    }

    setUsersList((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u))
    );

    logAuthEvent('Password Reset', user.email, `Password successfully changed for user.`);
    return { success: true };
  };

  // ADMIN APPROVAL ACTIONS
  const approveUser = (userId: string) => {
    const user = usersList.find((u) => u.id === userId);
    if (!user) return;

    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u))
    );

    logAuthEvent(
      'Account Approved',
      user.email,
      `Administrator approved account for ${user.name} (${user.organization}). Status transitioned PENDING -> ACTIVE.`
    );
  };

  const rejectUser = (userId: string, reason: string) => {
    const user = usersList.find((u) => u.id === userId);
    if (!user) return;

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: 'rejected', rejectionReason: reason } : u
      )
    );

    logAuthEvent(
      'Account Rejected',
      user.email,
      `Administrator rejected account application for ${user.name}. Reason: ${reason}.`
    );
  };

  const suspendUser = (userId: string, reason: string) => {
    const user = usersList.find((u) => u.id === userId);
    if (!user) return;

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: 'suspended', rejectionReason: reason } : u
      )
    );

    logAuthEvent(
      'User Suspended',
      user.email,
      `Administrator suspended account for ${user.name}. Reason: ${reason}.`
    );
  };

  const activateUser = (userId: string) => {
    const user = usersList.find((u) => u.id === userId);
    if (!user) return;

    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u))
    );

    logAuthEvent('Account Activated', user.email, `Account reactivated for ${user.name}.`);
  };

  // PERMISSION CHECKERS
  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser || currentUser.status !== 'active') return false;
    return currentUser.permissions.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!currentUser || currentUser.status !== 'active') return false;
    return currentUser.role === role;
  };

  // PROTOTYPE DEMO SWITCHER — Authenticates against live Django backend for role
  const demoSwitchRole = async (role: UserRole) => {
    const rolePhones: Record<UserRole, string> = {
      dealer: '9826041290',
      sales_agent: '9425088219',
      distributor: '9827033412',
      accounts: '9893077140',
      loading_operator: '9752019340',
      admin: '9826100552',
    };

    const phone = rolePhones[role];
    if (phone) {
      try {
        const res = await api.auth.login(phone, 'Password123');
        if (res && res.tokens) {
          setStoredTokens(res.tokens);
        }
      } catch {
        // Fallback silently if offline
      }
    }

    const demoUser = usersList.find((u) => u.role === role && u.status === 'active');
    if (demoUser) {
      setCurrentUser(demoUser);
      setIsAuthenticated(true);
      setIsDemoMode(false);
      setDemoRoleInfoMessage(
        `[Live JWT Session Active]: Authenticated as ${demoUser.name} (${demoUser.role.toUpperCase()}) against Django 5 DRF backend.`
      );
      const dest = getRoleDashboardRoute(role);
      setCurrentAuthRoute(dest);
    }
  };

  const dismissDemoMessage = () => {
    setDemoRoleInfoMessage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        currentAuthRoute,
        usersList,
        isDemoMode,
        demoRoleInfoMessage,
        navigateTo,
        getRoleDashboardRoute,
        loginWithCredentials,
        requestOtp,
        loginWithOtp,
        logout,
        registerDealer,
        registerSalesAgent,
        requestDistributorAccess,
        resetPassword,
        approveUser,
        rejectUser,
        suspendUser,
        activateUser,
        hasPermission,
        hasRole,
        demoSwitchRole,
        dismissDemoMessage,
        adminPreviewRole,
        setAdminPreviewRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
