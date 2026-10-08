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
        (u.applicationId && u.applicationId.toLowerCase().includes(term))
      );
    });

  return (
    <div className="space-y-4 text-xs">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            User Management &amp; Access Approval Desk
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cryptographic RBAC enforcement · Public signups must be vetted by Admin before dashboard grant.
          </p>
        </div>
      </div>

      {/* Segmented Status Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {(
            [
              { id: 'pending', label: `Pending Review (${pendingUsers.length})` },
              { id: 'active', label: `Active (${activeUsers.length})` },
              { id: 'rejected', label: `Rejected (${rejectedUsers.length})` },
              { id: 'suspended', label: `Suspended (${suspendedUsers.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, firm, phone, ID..."
            className="w-full bg-transparent outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Applicant Name</th>
                <th className="py-2.5 px-3">Target Role</th>
                <th className="py-2.5 px-3">Organization / Mandi</th>
                <th className="py-2.5 px-3">Mobile Contact</th>
                <th className="py-2.5 px-3">Registered</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No users found in this filter category.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{u.organization}</div>
                      <span className="text-[10px] text-slate-400">{u.territory || u.city}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      +91 {u.phone}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {u.createdAt}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : u.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'active'
                              ? 'bg-emerald-500'
                              : u.status === 'pending'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span>{u.status}</span>
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
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] cursor-pointer"
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
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium text-[11px] cursor-pointer flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
