import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, ShoppingCart, CreditCard, PlusCircle, MapPin, MoreHorizontal } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSidebar: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSidebar,
}) => {
  const { currentRole, openModal } = useApp();
  const { currentUser, adminPreviewRole } = useAuth();

  const effectiveRole = (currentUser?.role === 'admin' && adminPreviewRole)
    ? adminPreviewRole
    : (currentUser?.role || currentRole);

  if (effectiveRole !== 'dealer' && effectiveRole !== 'sales_agent') {
    return null;
  }

  const isDealer = effectiveRole === 'dealer';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around h-14">
      {/* Tab 1: Home/Overview */}
      <button
        onClick={() => setActiveTab('overview')}
        className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer ${
          activeTab === 'overview' ? 'text-amber-600 dark:text-amber-500 font-semibold' : 'text-slate-500'
        }`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Home</span>
      </button>

      {/* Tab 2: Orders or Visits */}
      {isDealer ? (
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer ${
            activeTab === 'orders' ? 'text-amber-600 dark:text-amber-500 font-semibold' : 'text-slate-500'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Orders</span>
        </button>
      ) : (
        <button
          onClick={() => setActiveTab('visits')}
          className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer ${
            activeTab === 'visits' ? 'text-amber-600 dark:text-amber-500 font-semibold' : 'text-slate-500'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Visits</span>
        </button>
      )}

      {/* Tab 3: Primary Quick Action */}
      <button
        onClick={() => setActiveTab(isDealer ? 'place_order' : 'create_order')}
        className="flex flex-col items-center justify-center flex-1 py-1 cursor-pointer text-amber-600 hover:text-amber-700"
      >
        <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
          <PlusCircle className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 font-bold text-slate-900 dark:text-white">Order</span>
      </button>

      {/* Tab 4: Payments or Collections */}
      {isDealer ? (
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer ${
            activeTab === 'payments' ? 'text-amber-600 dark:text-amber-500 font-semibold' : 'text-slate-500'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Payments</span>
        </button>
      ) : (
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer ${
            activeTab === 'collections' ? 'text-amber-600 dark:text-amber-500 font-semibold' : 'text-slate-500'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Collections</span>
        </button>
      )}

      {/* Tab 5: More (opens sidebar drawer) */}
      <button
        onClick={onOpenSidebar}
        className="flex flex-col items-center justify-center flex-1 py-1 cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      >
        <MoreHorizontal className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">More</span>
      </button>
    </nav>
  );
};
