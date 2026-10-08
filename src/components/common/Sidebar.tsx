import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Truck,
  MapPin,
  ClipboardCheck,
  AlertCircle,
  FileText,
  BarChart3,
  Users,
  Settings,
  PlusCircle,
  Package,
  Layers,
  History,
  ShieldCheck,
  Scale,
  Building,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { currentRole, payments, orders, claims, pendingSignups } = useApp();
  const { currentUser, adminPreviewRole, navigateTo } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bfel_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('bfel_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const effectiveRole: UserRole = (currentUser?.role === 'admin' && adminPreviewRole)
    ? adminPreviewRole
    : (currentUser?.role || currentRole || 'dealer');

  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending_verification').length;
  const pendingClaimsCount = claims.filter((c) => c.status === 'under_review').length;
  const activeLoadingCount = orders.filter((o) => o.status === 'loading' || o.status === 'loading_planned').length;
  const pendingSignupsCount = pendingSignups.filter((s) => s.status === 'pending').length;

  const getNavSections = (): { title?: string; items: NavItem[] }[] => {
    switch (effectiveRole) {
      case 'dealer':
        return [
          {
            title: 'Dealer Workspace',
            items: [
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'place_order', label: '+ Place Feed Order', icon: PlusCircle, highlight: true },
              { id: 'orders', label: 'My Orders', icon: ShoppingCart },
              { id: 'payments', label: 'Payments', icon: CreditCard, badge: pendingPaymentsCount },
              { id: 'tracking', label: 'Delivery Tracking', icon: Truck },
              { id: 'claims', label: 'Claims', icon: AlertCircle },
              { id: 'products', label: 'Product Catalog', icon: Package },
            ],
          },
        ];

      case 'distributor':
        return [
          {
            title: 'Distributor Workspace',
            items: [
              { id: 'overview', label: 'Distributor Overview', icon: LayoutDashboard },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'wallet', label: 'Credit & Wallet', icon: CreditCard },
              { id: 'stock', label: 'Stock Allocations', icon: Layers },
              { id: 'dispatches', label: 'Dispatches & LRs', icon: Truck },
              { id: 'claims', label: 'Claims Center', icon: AlertCircle },
              { id: 'dealers', label: 'Dealer Network', icon: Users },
            ],
          },
        ];

      case 'sales_agent':
        return [
          {
            title: 'Sales Agent Workspace',
            items: [
              { id: 'overview', label: 'Sales Overview', icon: LayoutDashboard },
              { id: 'dealers', label: 'My Dealers', icon: Users },
              { id: 'visits', label: 'Dealer Visits', icon: MapPin },
              { id: 'create_order', label: '+ Create Order', icon: PlusCircle, highlight: true },
              { id: 'followups', label: 'Order Follow-ups', icon: Clock },
              { id: 'collections', label: 'Collections', icon: CreditCard },
              { id: 'territory', label: 'Territory Activity', icon: BarChart3 },
            ],
          },
        ];

      case 'accounts':
        return [
          {
            title: 'Accounts Desk',
            items: [
              { id: 'overview', label: 'Accounts Overview', icon: LayoutDashboard },
              { id: 'payments', label: 'Payment Verification', icon: ClipboardCheck, badge: pendingPaymentsCount, highlight: pendingPaymentsCount > 0 },
              { id: 'reconciliation', label: 'Bank Reconciliation', icon: CreditCard },
              { id: 'verified', label: 'Verified Payments', icon: CheckCircle2 },
              { id: 'rejected', label: 'Rejected Payments', icon: AlertTriangle },
              { id: 'audit', label: 'Audit Trail', icon: History },
            ],
          },
        ];

      case 'loading_operator':
        return [
          {
            title: 'Plant Loading Kiosk',
            items: [
              { id: 'terminal', label: 'Loading Terminal', icon: Truck, highlight: true },
              { id: 'queue', label: "Today's Queue", icon: Layers, badge: activeLoadingCount },
              { id: 'planner', label: 'Truck Planner', icon: ClipboardCheck },
              { id: 'weighbridge', label: 'Weighbridge', icon: Scale },
              { id: 'completed', label: 'Completed Loads', icon: ShieldCheck },
              { id: 'gate_pass', label: 'Gate Pass', icon: FileText },
            ],
          },
        ];

      case 'admin':
      default:
        return [
          {
            title: 'Central Command',
            items: [
              { id: 'command_center', label: 'Operations Overview', icon: LayoutDashboard },
              { id: 'needs_attention', label: 'Needs Attention', icon: AlertTriangle, badge: pendingPaymentsCount + pendingClaimsCount },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'place_order', label: '+ Place Feed Order', icon: PlusCircle, highlight: true },
              { id: 'payment_desk', label: 'Payment Desk', icon: CreditCard, badge: pendingPaymentsCount },
              { id: 'loading', label: 'Truck Loading Planner', icon: Truck, badge: activeLoadingCount },
              { id: 'dispatches', label: 'Dispatches', icon: FileText },
              { id: 'claims', label: 'Claims', icon: AlertCircle, badge: pendingClaimsCount },
              { id: 'users', label: 'User Management', icon: Users, badge: pendingSignupsCount },
              { id: 'products', label: 'Product Catalog', icon: Package },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'audit', label: 'Audit Trail', icon: History },
            ],
          },
          {
            title: 'Master Data',
            items: [
              { id: 'fleet', label: 'Fleet & Driver Master', icon: Truck },
              { id: 'dealers', label: 'Dealer Overview', icon: Building },
            ],
          },
        ];
    }
  };

  const sections = getNavSections();

  const handleNavClick = (itemId: string) => {
    setActiveTab(itemId);
    onClose();

    const roleSlug =
      effectiveRole === 'sales_agent'
        ? 'sales'
        : effectiveRole === 'loading_operator'
        ? 'loading'
        : effectiveRole;

    const isBaseTab =
      itemId === 'overview' ||
      itemId === 'command_center' ||
      (effectiveRole === 'loading_operator' && itemId === 'terminal');

    const tabSlug = isBaseTab ? '' : `/${itemId.replace(/_/g, '-')}`;
    navigateTo(`/${roleSlug}${tabSlug}`);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 flex flex-col justify-between ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}
      >
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5 scrollbar-thin">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && !isCollapsed && (
                <div className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {section.title}
                </div>
              )}
              {isCollapsed && sIdx > 0 && (
                <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
              )}
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    activeTab === item.id ||
                    (item.id === 'command_center' && activeTab === 'overview') ||
                    (item.id === 'overview' && activeTab === 'command_center');
                  const Icon = item.icon;

                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center ${
                          isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                        } text-xs font-medium rounded-lg transition-colors cursor-pointer relative ${
                          item.highlight
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs'
                            : isActive
                            ? 'bg-amber-50 dark:bg-slate-800 text-amber-900 dark:text-white font-semibold border-l-2 border-amber-500 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className={`flex items-center ${isCollapsed ? '' : 'gap-2.5'}`}>
                          <Icon className="w-4 h-4 shrink-0" />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!isCollapsed && typeof item.badge === 'number' && item.badge > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded">
                            {item.badge}
                          </span>
                        )}
                        {isCollapsed && typeof item.badge === 'number' && item.badge > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </button>

                      {/* Tooltip for collapsed mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-950 text-white text-xs font-medium rounded-md shadow-lg border border-slate-700 whitespace-nowrap pointer-events-none animate-fadeIn">
                          <span>{item.label}</span>
                          {typeof item.badge === 'number' && item.badge > 0 && (
                            <span className="px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Operational Status Bar & Collapse Toggle */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/70">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span className="truncate">Manglia Bay 3</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[10px]">● Online</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/60">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">50 kg/bag standard</span>
                <button
                  onClick={toggleCollapse}
                  className="hidden md:flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Collapse</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" title="Manglia Bay 3 Online" />
              <button
                onClick={toggleCollapse}
                className="hidden md:flex p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
