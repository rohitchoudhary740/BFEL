import React, { useState } from 'react';
import { useApp, BAG_WEIGHT_KG, TRUCK_LIMITS, bagsToKg, bagsToMT, formatINR } from '../../context/AppContext';
import { TruckCapacityType } from '../../types';
import { TruckCapacityBar } from '../common/TruckCapacityBar';
import { X, Check, Truck, AlertTriangle, ShieldCheck, Tag, ArrowRight } from 'lucide-react';

export const DealerOrderCaptureModal: React.FC = () => {
  const { products, currentUser, createOrder, closeModal, openModal } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0].id);
  const [truckCapacity, setTruckCapacity] = useState<TruckCapacityType>('20_MT');
  const [bags, setBags] = useState<number>(400); // Default to standard 20 MT load
  const [destination, setDestination] = useState<string>('Dewas Mandi Yard, MP');
  const [notes, setNotes] = useState<string>('Priority morning dispatch requested for local dairy unions.');
  const [step, setStep] = useState<'select' | 'review'>('select');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const maxLimit = TRUCK_LIMITS[truckCapacity].maxBags;
  const isExceeded = bags > maxLimit;

  // Scheme Engine calculation
  let schemeDiscount = 0;
  let schemeName = '';
  if (bags >= 400) {
    schemeDiscount = bags * 30; // ₹30/bag for 400+ bags
    schemeName = 'BFEL Volume Slab: 400+ Bags (₹30/bag off)';
  }

  const subtotal = bags * selectedProduct.pricePerBag;
  const netTotal = subtotal - schemeDiscount;
  const advancePayable = netTotal;

  const handleTruckChange = (type: TruckCapacityType) => {
    setTruckCapacity(type);
    if (type === '20_MT' && bags > 400) {
      setBags(400);
    } else if (type === '25_MT' && bags === 400) {
      setBags(500);
    }
  };

  const handleCreateAndPay = () => {
    if (isExceeded) return;

    try {
      const created = createOrder({
        dealerId: currentUser.id,
        dealerName: currentUser.name,
        dealerPhone: currentUser.phone,
        dealerAgency: currentUser.entityName,
        destination,
        truckCapacity,
        productId: selectedProduct.id,
        bags,
        notes,
      });

      closeModal();
      // Jump directly to Advance Payment modal with newly created order
      openModal('dealer_payment', {
        orderId: created.id,
        amount: created.advancePayable,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
              BFEL Plant Direct Dispatch
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {step === 'select' ? 'Place Cattle Feed Order' : 'Review & Confirm Order'}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {step === 'select' ? (
            <>
              {/* Product Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  1. Select Cattle Feed Product
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {products.map((p) => {
                    const isSelected = p.id === selectedProductId;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProductId(p.id)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-bold">{p.name}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              <span>Protein: {p.proteinPercent}%</span>
                              <span>·</span>
                              <span>Fat: {p.fatPercent}%</span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            {formatINR(p.pricePerBag)}
                            <span className="text-[10px] text-slate-400 font-normal"> / bag</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-1">
                          {p.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Truck Capacity Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  2. Select Truck Load Capacity
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTruckChange('20_MT')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      truckCapacity === '20_MT'
                        ? 'bg-blue-500/10 border-blue-600 ring-1 ring-blue-600 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">20 MT Truck</span>
                      {truckCapacity === '20_MT' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Standard Load · Max 400 Bags (20,000 kg)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTruckChange('25_MT')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      truckCapacity === '25_MT'
                        ? 'bg-blue-500/10 border-blue-600 ring-1 ring-blue-600 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">25 MT Truck</span>
                      {truckCapacity === '25_MT' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Heavy Load · Max 500 Bags (25,000 kg)
                    </div>
                  </button>
                </div>
              </div>

              {/* Quantity Selector with Strict Limit Enforcement */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Order Quantity (50 kg Bags)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBags(truckCapacity === '20_MT' ? 400 : 500)}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded cursor-pointer hover:bg-amber-200"
                    >
                      Fill Full Truck ({truckCapacity === '20_MT' ? '400' : '500'} bags)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={maxLimit}
                    value={bags}
                    onChange={(e) => setBags(parseInt(e.target.value) || 0)}
                    className={`w-32 px-3 py-2 text-base font-bold font-mono text-center rounded-lg border ${
                      isExceeded
                        ? 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                    }`}
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBags((b) => Math.max(1, b - 50))}
                      className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded cursor-pointer hover:bg-slate-100"
                    >
                      −50
                    </button>
                    <button
                      type="button"
                      onClick={() => setBags((b) => b + 10)}
                      className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded cursor-pointer hover:bg-slate-100"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => setBags((b) => b + 50)}
                      className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded cursor-pointer hover:bg-slate-100"
                    >
                      +50
                    </button>
                  </div>
                </div>

                {/* Visual Capacity Indicator */}
                <TruckCapacityBar capacityType={truckCapacity} currentBags={bags} />

                {/* Over-capacity Blocking Warning */}
                {isExceeded && (
                  <div className="flex items-start gap-2 p-2.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Truck capacity exceeded.</strong> A {truckCapacity.replace('_', ' ')} truck supports a maximum of {maxLimit} standard 50 kg bags ({bagsToMT(maxLimit)} MT). Please reduce quantity.
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Destination */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Delivery Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Dewas Mandi Yard, MP"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </>
          ) : (
            /* Review Step */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Product</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bag Quantity</span>
                  <span className="font-mono font-bold">{bags} Bags (50 kg each)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Net Weight</span>
                  <span className="font-mono font-bold">
                    {bagsToKg(bags).toLocaleString()} kg ({bagsToMT(bags).toFixed(1)} MT)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Truck Assigned</span>
                  <span className="font-semibold">{truckCapacity.replace('_', ' ')} Dedicated Load</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rate per Bag</span>
                  <span className="font-mono">{formatINR(selectedProduct.pricePerBag)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-mono font-bold">{formatINR(subtotal)}</span>
                </div>

                {schemeDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-800">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {schemeName}
                    </span>
                    <span className="font-mono">−{formatINR(schemeDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-300 dark:border-slate-600">
                  <span>Net Total</span>
                  <span className="font-mono text-base text-amber-600 dark:text-amber-400">
                    {formatINR(netTotal)}
                  </span>
                </div>
              </div>

              {/* Advance Payable Banner */}
              <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      100% Advance Payable for Plant Clearance
                    </span>
                  </div>
                  <span className="font-mono text-base font-extrabold text-amber-700 dark:text-amber-300">
                    {formatINR(advancePayable)}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1">
                  Once order is created, submit RTGS / NEFT / IMPS reference for Accounts verification.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          {step === 'select' ? (
            <>
              <div className="text-xs">
                <span className="text-slate-500">Estimated Total: </span>
                <strong className="font-mono text-sm text-slate-900 dark:text-white">
                  {formatINR(netTotal)}
                </strong>
              </div>
              <button
                type="button"
                disabled={isExceeded || bags <= 0}
                onClick={() => setStep('review')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  isExceeded || bags <= 0
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md'
                }`}
              >
                <span>Review Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleCreateAndPay}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md cursor-pointer transition-all"
              >
                <span>Confirm &amp; Proceed to Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
