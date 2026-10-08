import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ProfileMenuDropdown } from './ProfileMenuDropdown';
import { ThemeToggle } from './ThemeToggle';
import {
  Search,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  Info,
} from 'lucide-react';

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const {
    currentRole,
    notifications,
    openModal,
    isOfflineMode,
    setIsOfflineMode,
    pendingSyncCount,
    syncOfflineQueue,
  } = useApp();

  const { currentUser, adminPreviewRole } = useAuth();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayRole = adminPreviewRole || currentUser?.role || currentRole || 'dealer';

  const getWorkspaceTitle = () => {
    switch (displayRole) {
      case 'dealer':
        return 'DEALER WORKSPACE';
      case 'distributor':
        return 'DISTRIBUTOR WORKSPACE';
      case 'sales_agent':
        return 'SALES AGENT WORKSPACE';
      case 'accounts':
        return 'ACCOUNTS WORKSPACE';
      case 'loading_operator':
        return 'LOADING OPERATOR WORKSPACE';
      case 'admin':
      default:
        return 'CENTRAL OPERATIONS COMMAND';
    }
  };

  const getWorkspaceContext = () => {
    if (adminPreviewRole) {
      return `Admin Preview Mode · ${currentUser?.name || 'Administrator'}`;
    }
    switch (displayRole) {
      case 'dealer':
        return currentUser?.organization || 'Patel Agro Agency · Dewas Mandi';
      case 'distributor':
        return currentUser?.organization || 'Malwa Agri Feeds Pvt Ltd · Indore Hub';
      case 'sales_agent':
        return 'Malwa & Nimar Field Operations · Indore Territory';
      case 'accounts':
        return 'BFEL Finance & Accounts Desk · Manglia';
      case 'loading_operator':
        return 'Plant Dispatch Bay 3 · Weighbridge Station 1';
      case 'admin':
      default:
        return 'Manglia Manufacturing Plant · Indore (M.P.)';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      {/* Zone 1: BFEL FLOW refined logo treatment & brand identity */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
            aria-label="Toggle navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-500 font-extrabold flex items-center justify-center text-sm shadow-xs border border-amber-500/30">
            B
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-slate-950 dark:text-white leading-none">
                BFEL <span className="text-amber-600 dark:text-amber-500 font-bold">FLOW</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight font-medium">
              Cattle Feed Distribution &amp; Operations Platform
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Authenticated Workspace Name & Context */}
      <div className="hidden md:flex items-center">
        <div className="px-3.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5 shadow-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              adminPreviewRole ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              {getWorkspaceTitle()}
            </span>
            <span className="text-slate-300 dark:text-slate-600 text-xs">/</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium max-w-[260px] truncate">
              {getWorkspaceContext()}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 3: Search, Offline status, Notifications, About, Profile Menu Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Offline Mode Switch for Dealer/Sales Agent */}
        {(currentRole === 'dealer' || currentRole === 'sales_agent') && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              title="Toggle simulated offline mode for field testing"
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                isOfflineMode
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isOfflineMode ? 'Offline Mode' : 'Online'}
              </span>
            </button>

            {isOfflineMode && pendingSyncCount > 0 && (
              <button
                onClick={syncOfflineQueue}
                title="Sync queued field records"
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer animate-pulse"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync ({pendingSyncCount})</span>
              </button>
            )}
          </div>
        )}

        {/* Global Search Button */}
        <button
          onClick={() => openModal('global_search')}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline font-mono text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          onClick={() => openModal('notifications')}
          className="relative p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Open notifications"
          title="Operations Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* About BFEL Flow Info Button */}
        <button
          onClick={() => openModal('about_bfel')}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="About BFEL Flow"
          title="About BFEL Flow Platform"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />

        {/* User Profile Menu Dropdown */}
        <div className="pl-1 border-l border-slate-200 dark:border-slate-800">
          <ProfileMenuDropdown />
        </div>
      </div>
    </header>
  );
};
