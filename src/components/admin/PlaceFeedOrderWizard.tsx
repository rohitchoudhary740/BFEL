import React, { useState } from 'react';
import { useApp, BAG_WEIGHT_KG, TRUCK_LIMITS, bagsToKg, bagsToMT, formatINR } from '../../context/AppContext';
import { TruckCapacityType, PaymentMode } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { TruckCapacityBar } from '../common/TruckCapacityBar';
import {
  Package,
  Layers,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Building,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface PlaceFeedOrderWizardProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
  onOrderCompleted?: (orderId: string) => void;
}

export const PlaceFeedOrderWizard: React.FC<PlaceFeedOrderWizardProps> = ({
  onNavigateToTab,
  onOrderCompleted,
}) => {
  const { products, createOrder, submitPayment, showToast } = useApp();

  // 5 Clean Steps
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || 'prod-dudh-dhara');
  const [bagsCount, setBagsCount] = useState<number>(400);
  const [capacityType, setCapacityType] = useState<TruckCapacityType>('20_MT');
  const [destination, setDestination] = useState<string>('Dewas Mandi Yard, MP');
  const [dealerAgency, setDealerAgency] = useState<string>('Patel Agro Agency');
  const [dealerName, setDealerName] = useState<string>('Ramesh Patel');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('RTGS');
  const [utr, setUtr] = useState<string>(`SBI-RTGS-${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [bankName, setBankName] = useState<string>('State Bank of India');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const maxBagsAllowed = (TRUCK_LIMITS[capacityType] || TRUCK_LIMITS['20_MT']).maxBags;
  const unitPrice = selectedProduct?.pricePerBag || 1420;
  const totalAmount = (bagsCount || 0) * unitPrice;
  const isOverCapacity = (bagsCount || 0) > maxBagsAllowed;

  const steps = [
    { number: 1, label: 'Product', icon: Package },
    { number: 2, label: 'Quantity', icon: Layers },
    { number: 3, label: 'Delivery', icon: MapPin },
    { number: 4, label: 'Payment', icon: CreditCard },
    { number: 5, label: 'Confirmation', icon: CheckCircle2 },
  ];

  const handleNext = () => {
    if (currentStep === 2) {
      if (bagsCount <= 0) {
        showToast('Please specify a valid quantity of bags.', 'error');
        return;
      }
      if (isOverCapacity) {
        showToast(`Exceeds capacity! Maximum for ${capacityType.replace('_', ' ')} is ${maxBagsAllowed} bags.`, 'error');
        return;
      }
    }
    if (currentStep === 4) {
      if (!utr.trim()) {
        showToast('Please enter the bank UTR reference number for advance payment.', 'error');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(steps.length, prev + 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinalSubmit = () => {
    if (isOverCapacity) {
      showToast(`Cannot submit: ${bagsCount} bags exceeds ${capacityType.replace('_', ' ')} capacity of ${maxBagsAllowed} bags.`, 'error');
      return;
    }

    if (!utr.trim()) {
      showToast('Please enter the bank UTR reference number.', 'error');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // 1. Create Order
      const newOrder = createOrder({
        dealerId: 'user-dealer-1',
        dealerName,
        dealerAgency,
        dealerPhone: '+91 98260 41290',
        destination,
        truckCapacity: capacityType,
        productId: selectedProduct?.id || 'prod-dudh-dhara',
        bags: bagsCount,
      });

      // 2. Submit Advance Payment
      submitPayment({
        orderId: newOrder.id,
        dealerName,
        dealerAgency,
        amount: totalAmount,
        mode: paymentMode,
        utr,
        bankName,
        receiptUrl: '/receipts/sample_pnb_rtgs.png',
      });

      setIsSubmitting(false);
      showToast(`Consignment ${newOrder.id} booked with 100% advance payment! Released to Accounts Desk.`, 'success');

      if (onOrderCompleted) {
        onOrderCompleted(newOrder.id);
      } else if (onNavigateToTab) {
        onNavigateToTab('orders', { orderId: newOrder.id });
      }
    }, 450);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Workspaces', onClick: () => onNavigateToTab?.('overview') },
          { label: 'Orders', onClick: () => onNavigateToTab?.('orders') },
          { label: 'Place Feed Order' },
        ]}
        title="Place Direct Factory Feed Consignment"
        subtitle="Book bulk cattle feed in standard 50 kg HDPE bags with mandatory 100% advance payment clearance."
        secondaryAction={{
          label: 'Cancel & Return to Orders',
          onClick: () => onNavigateToTab?.('orders'),
        }}
      />

      {/* Clean 5-Step Stepper */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex items-center justify-between overflow-x-auto gap-2">
          {steps.map((s, idx) => {
            const isDone = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <div key={s.number} className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? '✓' : s.number}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
                {idx < steps.length - 1 && (
                  <div className="w-8 sm:w-16 h-0.5 bg-slate-200 dark:bg-slate-800 hidden sm:block ml-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Box */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-6 text-xs">
        {/* STEP 1: Product */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 1: Select Cattle Feed Product
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                All formulations packed in standard 50 kg HDPE tamper-evident bags manufactured at Indore Plant.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map((p) => {
                const isSelected = selectedProductId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                          {p.sku} · 50 kg HDPE
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white block">
                          {formatINR(p.pricePerBag)}
                        </span>
                        <span className="text-[10px] text-slate-400">per 50 kg bag</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">{p.description}</p>
                    <div className="flex items-center gap-3 font-mono text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>Protein: <strong>{p.proteinPercent}%</strong></span>
                      <span>Fat: <strong>{p.fatPercent}%</strong></span>
                      <span>Plant Stock: <strong>{p.stockAvailableBags} bags</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Quantity & Truck Capacity */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 2: Specify Quantity &amp; Truck Capacity
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Standard BFEL dedicated truckloads: <strong>20 MT = 400 bags</strong> or <strong>25 MT = 500 bags</strong>.
              </p>
            </div>

            {/* Capacity Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => {
                  setBagsCount(400);
                  setCapacityType('20_MT');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  capacityType === '20_MT' && bagsCount === 400
                    ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">20 MT Standard Load</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">400 Bags</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  400 bags × 50 kg = 20,000 kg (20 MT). Standard 6-wheel commercial carrier.
                </p>
              </div>

              <div
                onClick={() => {
                  setBagsCount(500);
                  setCapacityType('25_MT');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  capacityType === '25_MT' && bagsCount === 500
                    ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">25 MT Heavy Load</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">500 Bags</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  500 bags × 50 kg = 25,000 kg (25 MT). Multi-axle long-haul carrier.
                </p>
              </div>
            </div>

            {/* Custom Input & Weight Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Custom Bag Count (50 kg / bag)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={bagsCount}
                    onChange={(e) => setBagsCount(parseInt(e.target.value) || 0)}
                    className="w-full text-lg font-bold font-mono p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Truck Capacity Type
                  </label>
                  <select
                    value={capacityType}
                    onChange={(e) => setCapacityType(e.target.value as TruckCapacityType)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium text-xs"
                  >
                    <option value="20_MT">20 MT (Max 400 Bags)</option>
                    <option value="25_MT">25 MT (Max 500 Bags)</option>
                  </select>
                </div>
              </div>

              {/* Truck Capacity Visualizer */}
              <div className="pt-2">
                <TruckCapacityBar
                  capacityType={capacityType}
                  truckCapacity={capacityType}
                  currentBags={bagsCount || 0}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <span className="text-slate-500">Total Net Consignment Weight:</span>
                <strong className="text-slate-900 dark:text-white">
                  {bagsToKg(bagsCount || 0).toLocaleString()} kg ({bagsToMT(bagsCount || 0)} MT)
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Delivery */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 3: Delivery Destination &amp; Consignee Details
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Specify authorized receiving dealership and physical unloading mandi yard or godown.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receiving Dealership / Agency Name
                </label>
                <input
                  type="text"
                  value={dealerAgency}
                  onChange={(e) => setDealerAgency(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Proprietor / Contact Person
                </label>
                <input
                  type="text"
                  value={dealerName}
                  onChange={(e) => setDealerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unloading Destination Mandi Yard / Godown Address
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                Dispatch Origin: <strong>Bharat Feeds &amp; Extractions Ltd, Manglia Bay 3, Indore (M.P.)</strong>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Payment */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 4: 100% Advance Payment Remittance
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                BFEL standard policy requires 100% advance payment verification prior to factory bay loading release.
              </p>
            </div>

            {/* Total Advance Due Banner */}
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                  100% Advance Payable Amount
                </span>
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {formatINR(totalAmount)}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  ({bagsCount} bags × {formatINR(unitPrice)}/bag)
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono text-xs font-bold border border-amber-300 dark:border-amber-700">
                100% ADVANCE GATE
              </span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-medium"
                  >
                    <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                    <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                    <option value="IMPS">IMPS Instant Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Remitting Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank UTR Reference Number *
                </label>
                <input
                  type="text"
                  required
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="e.g. SBIN2026100299881"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Verified by BFEL Accounts Desk against State Bank of India Indore Commercial Branch statement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Confirmation */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 5: Order &amp; Remittance Confirmation Summary
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Verify all operational details before clearing consignment into the factory DMS queue.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Product Formulation:</span>
                <strong className="text-slate-900 dark:text-white">{selectedProduct?.name || 'BFEL Cattle Feed 50kg'}</strong>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Bag Count &amp; Packing:</span>
                <strong className="text-slate-900 dark:text-white">
                  {bagsCount} Bags ({bagsToMT(bagsCount || 0)} MT) · 50 kg HDPE
                </strong>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Carrier Capacity:</span>
                <strong className="text-slate-900 dark:text-white">
                  {capacityType.replace('_', ' ')} Dedicated Carrier (Max {maxBagsAllowed} Bags)
                </strong>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Destination Yard:</span>
                <strong className="text-slate-900 dark:text-white font-sans">{destination}</strong>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Advance Payment UTR:</span>
                <strong className="text-emerald-600">{utr} ({paymentMode} - {bankName})</strong>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold">
                <span className="text-slate-700 dark:text-slate-300 font-sans">Total Advance Remitted:</span>
                <strong className="text-slate-900 dark:text-white text-base">{formatINR(totalAmount)}</strong>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                Once confirmed, this consignment moves to the Accounts Desk for immediate UTR credit matching.
              </span>
            </div>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md flex items-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirm Order &amp; Release to Accounts</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
