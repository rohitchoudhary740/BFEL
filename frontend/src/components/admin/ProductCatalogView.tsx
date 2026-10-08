import React, { useState } from 'react';
import { useApp, formatINR } from '../../context/AppContext';
import { Product } from '../../types';
import { PageHeader } from '../common/PageHeader';
import {
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Tag,
  Scale,
} from 'lucide-react';

interface ProductCatalogViewProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
}

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({ onNavigateToTab }) => {
  const { products, openModal, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Master Data', onClick: () => onNavigateToTab?.('command_center') },
          { label: 'Product Catalog' },
        ]}
        title="BFEL Cattle Feed Product Catalog"
        subtitle="Centralized feed bag formulations, proximate analysis nutrient specifications, factory inventory and proforma pricing."
        badge={{ text: `${products.length} Active Formulations`, variant: 'emerald' }}
        primaryAction={{
          label: '+ Place Order with Product',
          icon: Package,
          onClick: () => onNavigateToTab ? onNavigateToTab('place_order') : openModal('dealer_order_capture'),
          variant: 'primary',
        }}
      />

      {/* Search Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs flex items-center justify-between text-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Feed Formulation Name, SKU, Category..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>
        <div className="text-[11px] text-slate-500 hidden sm:block">
          All bags standardized at <strong className="text-slate-800 dark:text-slate-200">50 kg net weight</strong>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedProduct(p)}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    {p.sku} · {p.category}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {p.name}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {p.description}
              </p>

              {/* Nutrition & Specs Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-center font-mono text-[11px]">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Crude Protein</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{p.proteinPercent}%</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Crude Fat</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{p.fatPercent}%</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Bag Net Wt</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{p.bagWeightKg} kg</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Ex-Factory Price</span>
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatINR(p.pricePerBag)}
                  <span className="text-[10px] text-slate-400 font-sans font-normal ml-0.5">/ bag</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {p.stockAvailableBags.toLocaleString()} Bags In Stock
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-[10px] text-amber-500 font-bold uppercase">{selectedProduct.sku}</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{selectedProduct.name}</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedProduct.description}
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Ex-Factory Proforma Rate:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(selectedProduct.pricePerBag)} / bag</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Full 20 MT Truckload (400 Bags):</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatINR(selectedProduct.pricePerBag * 400)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Full 25 MT Truckload (500 Bags):</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatINR(selectedProduct.pricePerBag * 500)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Finished Goods Inventory:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedProduct.stockAvailableBags.toLocaleString()} bags in Manglia Silos</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  if (onNavigateToTab) {
                    onNavigateToTab('place_order');
                  } else {
                    openModal('dealer_order_capture');
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
              >
                Book Consignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
