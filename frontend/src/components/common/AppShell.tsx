import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

// Auth and Onboarding Pages
import { LoginPage } from '../auth/LoginPage';
import { SignupRoleSelectionPage } from '../auth/SignupRoleSelectionPage';
import { DealerSignupPage } from '../auth/DealerSignupPage';
import { SalesAgentSignupPage } from '../auth/SalesAgentSignupPage';
import { DistributorRequestPage } from '../auth/DistributorRequestPage';
import { InternalRestrictedPage } from '../auth/InternalRestrictedPage';
import { ForgotPasswordPage } from '../auth/ForgotPasswordPage';
import { AccessDeniedPage } from '../auth/AccessDeniedPage';

// Common Framework Components
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

// Role Dashboards & Workspaces
import { DealerDashboard } from '../dealer/DealerDashboard';
import { SalesAgentDashboard } from '../sales/SalesAgentDashboard';
import { DistributorDashboard } from '../distributor/DistributorDashboard';
import { AccountsDashboard } from '../accounts/AccountsDashboard';
import { LoadingOperatorTerminal } from '../loading/LoadingOperatorTerminal';
import { AdminCommandCenter } from '../admin/AdminCommandCenter';

// Modals & Drawers
import { DealerOrderCaptureModal } from '../dealer/DealerOrderCaptureModal';
import { DealerPaymentModal } from '../dealer/DealerPaymentModal';
import { PaymentVerificationDrawer } from '../accounts/PaymentVerificationDrawer';
import { GatePassModal } from '../documents/GatePassModal';
import { LRChallanModal } from '../documents/LRChallanModal';
import { WhatsAppAlertModal } from '../documents/WhatsAppAlertModal';
import { DealerClaimsModal } from '../dealer/DealerClaimsModal';
import { DealerVisitModal } from '../sales/DealerVisitModal';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationDrawer } from './NotificationDrawer';
import { OtpLoginModal } from './OtpLoginModal';
import { PublicSignupModal } from './PublicSignupModal';
import { AboutBfelModal } from './AboutBfelModal';
import { ErrorBoundary } from './ErrorBoundary';

import { CheckCircle2, AlertTriangle, Info, Eye, X } from 'lucide-react';

export const AppShell: React.FC = () => {
  const { currentRole, activeModal, toastMessage, toastType, switchRole } = useApp();
  const { currentUser, isAuthenticated, currentAuthRoute, navigateTo, adminPreviewRole, setAdminPreviewRole } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Determine effective role (admin in preview mode takes on preview role)
  const effectiveRole: UserRole = (currentUser?.role === 'admin' && adminPreviewRole)
    ? adminPreviewRole
    : (currentUser?.role || currentRole || 'dealer');

  // Synchronize AppContext role state
  React.useEffect(() => {
    if (currentUser?.role && currentUser.role !== currentRole && !adminPreviewRole) {
      switchRole(currentUser.role);
    }
  }, [currentUser?.role, adminPreviewRole]);

  // For Admin: automatically sync preview role if route indicates a specific role workspace
  React.useEffect(() => {
    if (currentUser?.role === 'admin') {
      if (currentAuthRoute.startsWith('/dealer') && adminPreviewRole !== 'dealer') {
        setAdminPreviewRole('dealer');
      } else if (currentAuthRoute.startsWith('/sales') && adminPreviewRole !== 'sales_agent') {
        setAdminPreviewRole('sales_agent');
      } else if (currentAuthRoute.startsWith('/distributor') && adminPreviewRole !== 'distributor') {
        setAdminPreviewRole('distributor');
      } else if (currentAuthRoute.startsWith('/accounts') && adminPreviewRole !== 'accounts') {
        setAdminPreviewRole('accounts');
      } else if (currentAuthRoute.startsWith('/loading') && adminPreviewRole !== 'loading_operator') {
        setAdminPreviewRole('loading_operator');
      } else if (currentAuthRoute.startsWith('/admin') && adminPreviewRole !== null) {
        setAdminPreviewRole(null);
      }
    }
  }, [currentAuthRoute, currentUser?.role, adminPreviewRole, setAdminPreviewRole]);

  // Sync tab with URL route for client-side routing across ALL roles
  React.useEffect(() => {
    const roleSlug = effectiveRole === 'sales_agent' ? 'sales' : (effectiveRole === 'loading_operator' ? 'loading' : effectiveRole);
    const prefix = `/${roleSlug}`;

    if (currentAuthRoute.startsWith(prefix)) {
      const remainder = currentAuthRoute.slice(prefix.length).replace(/^\//, '').split('?')[0];
      if (remainder) {
        setActiveTab(remainder.replace(/-/g, '_'));
      } else {
        setActiveTab(effectiveRole === 'loading_operator' ? 'terminal' : (effectiveRole === 'admin' ? 'command_center' : 'overview'));
      }
    }
  }, [currentAuthRoute, effectiveRole]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const roleSlug = effectiveRole === 'sales_agent' ? 'sales' : (effectiveRole === 'loading_operator' ? 'loading' : effectiveRole);
    const isBaseTab =
      tab === 'overview' ||
      tab === 'command_center' ||
      (effectiveRole === 'loading_operator' && tab === 'terminal');
    const slug = isBaseTab ? '' : `/${tab.replace(/_/g, '-')}`;
    navigateTo(`/${roleSlug}${slug}`);
  };

  // 1. ROUTING & ACCESS CONTROL GUARD:
  // If not authenticated or on an auth route, render dedicated Auth views
  if (!isAuthenticated || currentAuthRoute === '/login') {
    return <LoginPage />;
  }

  if (currentAuthRoute === '/signup') {
    return <SignupRoleSelectionPage />;
  }

  if (currentAuthRoute === '/signup/dealer') {
    return <DealerSignupPage />;
  }

  if (currentAuthRoute === '/signup/sales-agent') {
    return <SalesAgentSignupPage />;
  }

  if (currentAuthRoute === '/signup/distributor') {
    return <DistributorRequestPage />;
  }

  if (currentAuthRoute === '/signup/accounts') {
    return <InternalRestrictedPage roleType="accounts" />;
  }

  if (currentAuthRoute === '/signup/loading') {
    return <InternalRestrictedPage roleType="loading" />;
  }

  if (currentAuthRoute === '/signup/admin') {
    return <InternalRestrictedPage roleType="admin" />;
  }

  if (currentAuthRoute === '/forgot-password') {
    return <ForgotPasswordPage />;
  }

  if (currentAuthRoute === '/otp-verification' || currentAuthRoute === '/verify-otp') {
    return <LoginPage defaultMethod="otp" />;
  }

  if (currentAuthRoute === '/access-denied' || currentAuthRoute === '/access-restricted') {
    return <AccessDeniedPage />;
  }

  // 2. CHECK ROLE AUTHORIZATION FOR DASHBOARD ROUTE
  // Non-admin users cannot access other role paths
  if (currentUser && currentUser.role !== 'admin') {
    if (currentAuthRoute.startsWith('/admin')) {
      return <AccessDeniedPage />;
    }
    if (currentAuthRoute.startsWith('/accounts') && currentUser.role !== 'accounts') {
      return <AccessDeniedPage />;
    }
    if (currentAuthRoute.startsWith('/loading') && currentUser.role !== 'loading_operator') {
      return <AccessDeniedPage />;
    }
    if (currentAuthRoute.startsWith('/distributor') && currentUser.role !== 'distributor') {
      return <AccessDeniedPage />;
    }
    if (currentAuthRoute.startsWith('/sales') && currentUser.role !== 'sales_agent') {
      return <AccessDeniedPage />;
    }
    if (currentAuthRoute.startsWith('/dealer') && currentUser.role !== 'dealer') {
      return <AccessDeniedPage />;
    }
  }

  // 3. RENDER AUTHORIZED DASHBOARD
  const renderDashboard = () => {
    switch (effectiveRole) {
      case 'dealer':
        return <DealerDashboard activeTab={activeTab} setActiveTab={handleTabChange} />;
      case 'sales_agent':
        return <SalesAgentDashboard activeTab={activeTab} setActiveTab={handleTabChange} />;
      case 'distributor':
        return <DistributorDashboard activeTab={activeTab} setActiveTab={handleTabChange} />;
      case 'accounts':
        return <AccountsDashboard activeTab={activeTab} setActiveTab={handleTabChange} />;
      case 'loading_operator':
        return <LoadingOperatorTerminal activeTab={activeTab} setActiveTab={handleTabChange} />;
      case 'admin':
      default:
        return <AdminCommandCenter activeTab={activeTab} setActiveTab={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Admin Preview Mode Sticky Banner */}
      {currentUser?.role === 'admin' && adminPreviewRole && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm z-40 sticky top-0 border-b border-amber-600">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-400 font-mono text-[10px] uppercase font-black">
              ADMIN PREVIEW MODE
            </span>
            <span>
              You are previewing BFEL Flow as <strong>{adminPreviewRole.toUpperCase().replace('_', ' ')}</strong>. Actions modify live operational state.
            </span>
          </div>
          <button
            onClick={() => {
              setAdminPreviewRole(null);
              navigateTo('/admin');
            }}
            className="flex items-center gap-1 px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded font-bold text-xs cursor-pointer shadow-xs transition-colors"
          >
            <span>Exit Preview</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Top Navigation Bar */}
      <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Body Area */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-10">
          <ErrorBoundary
            key={`${effectiveRole}-${activeTab}`}
            fallbackTitle="Workspace view encountered an issue"
            onReset={() => handleTabChange('overview')}
          >
            {renderDashboard()}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation for Dealer and Sales Agent */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {/* Global Modals & Drawers */}
      {activeModal === 'dealer_order_capture' && <DealerOrderCaptureModal />}
      {activeModal === 'dealer_payment' && <DealerPaymentModal />}
      {activeModal === 'payment_verification' && <PaymentVerificationDrawer />}
      {activeModal === 'gate_pass' && <GatePassModal />}
      {activeModal === 'lr_challan' && <LRChallanModal />}
      {activeModal === 'whatsapp_alert' && <WhatsAppAlertModal />}
      {activeModal === 'dealer_claim' && <DealerClaimsModal />}
      {activeModal === 'dealer_visit' && <DealerVisitModal />}
      {activeModal === 'global_search' && <GlobalSearchModal />}
      {activeModal === 'notifications' && <NotificationDrawer />}
      {activeModal === 'otp_login' && <OtpLoginModal />}
      {activeModal === 'public_signup' && <PublicSignupModal />}
      {activeModal === 'about_bfel' && <AboutBfelModal />}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg bg-slate-900 text-white border border-slate-700 text-xs animate-slide-up">
          {toastType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toastType === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
