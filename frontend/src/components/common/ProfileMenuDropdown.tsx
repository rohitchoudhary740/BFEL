import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';
import {
  User,
  Shield,
  KeyRound,
  Bell,
  History,
  LogOut,
  ChevronDown,
  Building,
  CheckCircle2,
  Eye,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

export const ProfileMenuDropdown: React.FC = () => {
  const { currentUser, logout, navigateTo, adminPreviewRole, setAdminPreviewRole, getRoleDashboardRoute } = useAuth();
  const { openModal, showToast } = useApp();
  const { toggleTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showSwitchSubmenu, setShowSwitchSubmenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSwitchSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    showToast('You have been signed out.', 'info');
  };

  const handleAdminPreview = (role: UserRole) => {
    setAdminPreviewRole(role);
    setIsOpen(false);
    setShowSwitchSubmenu(false);
    const dest = getRoleDashboardRoute(role);
    navigateTo(dest);
    showToast(`Admin preview activated: Viewing as ${role.toUpperCase().replace('_', ' ')}`, 'info');
  };

  const handleExitPreview = () => {
    setAdminPreviewRole(null);
    setIsOpen(false);
    navigateTo('/admin');
    showToast('Exited Admin preview mode. Back to Central Command Center.', 'success');
  };

  const currentDisplayRole = adminPreviewRole || currentUser.role;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
      >
        <div
          className={`w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs ${
            adminPreviewRole
              ? 'bg-amber-500 text-slate-950 font-black'
              : currentUser.avatarColor || 'bg-slate-800'
          }`}
        >
          {adminPreviewRole ? '👁' : currentUser.name.charAt(0)}
        </div>
        <div className="hidden xl:block">
          <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
            <span>{currentUser.name}</span>
            {adminPreviewRole && (
              <span className="px-1 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-bold">PREVIEW</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            {currentDisplayRole.replace('_', ' ').toUpperCase()}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 text-xs animate-fadeIn">
          {/* User Bio Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white text-sm">{currentUser.name}</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              {currentUser.organization}
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {currentDisplayRole.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Active Session
              </span>
            </div>
            {adminPreviewRole && (
              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[10px] mt-1 font-semibold flex items-center justify-between">
                <span>Active Preview: {adminPreviewRole.toUpperCase()}</span>
                <button
                  onClick={handleExitPreview}
                  className="underline hover:text-amber-700 cursor-pointer"
                >
                  Exit Preview
                </button>
              </div>
            )}
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              Last Login: {currentUser.lastLogin || 'Current session'}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                showToast(`Signed in as ${currentUser.name} (${currentUser.role})`, 'info');
              }}
              className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>My Profile &amp; Firm Information</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigateTo('/forgot-password');
              }}
              className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-slate-400" />
              <span>Security &amp; Change Password</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                openModal('notifications');
              }}
              className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-slate-400" />
              <span>Operations Notifications</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                openModal('about_bfel');
              }}
              className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
            >
              <Building className="w-4 h-4 text-slate-400" />
              <span>About BFEL Flow Platform</span>
            </button>

            {/* Appearance Toggle */}
            <button
              onClick={() => {
                toggleTheme();
              }}
              className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between cursor-pointer border-t border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-500" />
                )}
                <span>Appearance</span>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>
          </div>

          {/* Admin Controlled Role Preview / Switch Workspace */}
          {currentUser.role === 'admin' ? (
            <div className="border-t border-slate-100 dark:border-slate-800 py-1">
              <div className="px-4 py-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Admin Preview Controls</span>
                <span className="font-mono text-amber-500">TESTING</span>
              </div>

              {adminPreviewRole && (
                <button
                  onClick={handleExitPreview}
                  className="w-full px-4 py-1.5 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Exit to Admin Command Center</span>
                </button>
              )}

              <div className="px-2 py-1 space-y-0.5">
                {[
                  { role: 'dealer' as UserRole, label: 'Preview as Dealer' },
                  { role: 'sales_agent' as UserRole, label: 'Preview as Sales Agent' },
                  { role: 'distributor' as UserRole, label: 'Preview as Distributor' },
                  { role: 'accounts' as UserRole, label: 'Preview as Accounts' },
                  { role: 'loading_operator' as UserRole, label: 'Preview as Loading Operator' },
                ].map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleAdminPreview(item.role)}
                    className={`w-full px-3 py-1.5 text-left rounded-md flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      adminPreviewRole === item.role
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.label}</span>
                    </span>
                    {adminPreviewRole === item.role && (
                      <span className="text-[10px] font-mono">ACTIVE</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 text-[10px] text-slate-400">
              <span>Authorized Workspace: <strong>{currentUser.role.replace('_', ' ').toUpperCase()}</strong></span>
              <p className="mt-0.5">Role switching is governed by BFEL enterprise security policy.</p>
            </div>
          )}

          {/* Logout Trigger */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-semibold cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of BFEL Flow</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
