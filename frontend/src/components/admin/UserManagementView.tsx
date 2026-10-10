import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, AccountStatus } from '../../types';
import { UserDetailDrawer } from './UserDetailDrawer';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertOctagon,
  UserX,
  Search,
  ArrowRight,
  Filter,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  X,
  ShieldAlert,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { usersList, approveUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AccountStatus>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const pendingUsers = usersList.filter((u) => u.status === 'pending');
  const activeUsers = usersList.filter((u) => u.status === 'active');
  const rejectedUsers = usersList.filter((u) => u.status === 'rejected');
  const suspendedUsers = usersList.filter((u) => u.status === 'suspended');

  const filteredUsers = usersList
    .filter((u) => u.status === activeTab)
    .filter((u) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.organization.toLowerCase().includes(term) ||
        u.phone.includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.territory && u.territory.toLowerCase().includes(term)) ||
        (u.city && u.city.toLowerCase().includes(term)) ||
        (u.applicationId && u.applicationId.toLowerCase().includes(term))
      );
    });

  const tabCounts = {
    pending: pendingUsers.length,
    active: activeUsers.length,
    rejected: rejectedUsers.length,
    suspended: suspendedUsers.length,
  };

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-500/20',
          dot: 'bg-emerald-500',
          label: 'Active',
        };
      case 'pending':
        return {
          bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-500/20',
          dot: 'bg-amber-500',
          label: 'Pending Review',
        };
      case 'suspended':
        return {
          bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300 border-orange-500/20',
          dot: 'bg-orange-500',
          label: 'Suspended',
        };
      case 'rejected':
      default:
        return {
          bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-500/20',
          dot: 'bg-rose-500',
          label: 'Rejected',
        };
    }
  };

  return (
    <div className="space-y-4 text-xs w-full max-w-full min-w-0 overflow-x-hidden">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500 shrink-0" />
            <span>User Management &amp; Access Approval Desk</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographic RBAC enforcement · Public signups must be vetted by Admin before dashboard grant.
          </p>
        </div>
      </div>

      {/* Segmented Status Tabs & Search — Completely Mobile-Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Horizontal scrollable tab strip for mobile screens */}
        <div className="w-full lg:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <div
            role="tablist"
            aria-label="User Filter Tabs"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl min-w-max border border-slate-200/60 dark:border-slate-700/60"
          >
            {(
              [
                { id: 'pending', label: 'Pending Review' },
                { id: 'active', label: 'Active' },
                { id: 'rejected', label: 'Rejected' },
                { id: 'suspended', label: 'Suspended' },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tabCounts[tab.id];

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[40px] px-3.5 py-2 font-semibold text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search input field — fits viewport width */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs w-full lg:w-80 min-h-[44px] shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, mandi, phone, role..."
            className="w-full bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          MOBILE PRESENTATION (< md): RESPONSIVE APPLICANT CARDS
          Zero horizontal overflow, natural line wrapping, touch-friendly actions.
          ========================================================================= */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto opacity-40" />
            <p className="font-medium text-xs">No applicants found in this filter category.</p>
            {searchTerm && (
              <p className="text-[11px] text-slate-500">
                Try clearing the search query "{searchTerm}"
              </p>
            )}
          </div>
        ) : (
          filteredUsers.map((u) => {
            const statusStyle = getStatusBadge(u.status);
            const locationStr = u.territory || [u.city, u.district].filter(Boolean).join(', ');

            return (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/60 transition-all cursor-pointer space-y-3 min-w-0 max-w-full"
                style={{ overflowWrap: 'anywhere' }}
              >
                {/* Card Header: Applicant Name, Email & Status Badge */}
                <div className="flex items-start justify-between gap-2.5 min-w-0">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm break-words leading-tight">
                      {u.name}
                    </h3>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono break-all mt-0.5">
                      {u.email}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono border shrink-0 ${statusStyle.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    <span>{statusStyle.label}</span>
                  </span>
                </div>

                {/* Target Role Pill */}
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    Target Role: {u.role.replace('_', ' ')}
                  </span>
                </div>

                {/* Organization / Mandi Details (No text clipping, wraps naturally) */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 space-y-1.5 min-w-0">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Organization / Mandi
                    </span>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 break-words mt-0.5">
                      {u.organization || '—'}
                    </div>
                  </div>

                  {locationStr && (
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 min-w-0 pt-0.5 border-t border-slate-200/50 dark:border-slate-800/80">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="break-words">{locationStr}</span>
                    </div>
                  )}
                </div>

                {/* Contact and Registration Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>+91 {u.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{u.createdAt}</span>
                  </div>
                </div>

                {/* Responsive Touch Actions (~44px touch targets) */}
                <div className="flex items-stretch gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {u.status === 'pending' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        approveUser(u.id);
                      }}
                      className="flex-1 min-h-[44px] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Approve</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(u);
                    }}
                    className={`min-h-[44px] py-2.5 px-4 rounded-lg font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                      u.status === 'pending'
                        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        : 'w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>Review Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          DESKTOP PRESENTATION (>= md): FULL OPERATIONAL TABLE
          Preserved for medium, large and ultra-wide displays.
          ========================================================================= */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Applicant Name</th>
                <th className="py-2.5 px-3 font-semibold">Target Role</th>
                <th className="py-2.5 px-3 font-semibold">Organization / Mandi</th>
                <th className="py-2.5 px-3 font-semibold">Mobile Contact</th>
                <th className="py-2.5 px-3 font-semibold">Registered</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No users found in this filter category.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const statusStyle = getStatusBadge(u.status);

                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white break-words">{u.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono break-all">{u.email}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 break-words">{u.organization}</div>
                        <span className="text-[10px] text-slate-400">{u.territory || u.city}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        +91 {u.phone}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {u.createdAt}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${statusStyle.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span>{statusStyle.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status === 'pending' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                approveUser(u.id);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] cursor-pointer shadow-xs"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(u);
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium text-[11px] cursor-pointer flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Drawer */}
      <UserDetailDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
};
