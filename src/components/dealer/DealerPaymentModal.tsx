import React, { useState } from 'react';
import { useApp, formatINR } from '../../context/AppContext';
import { PaymentMode } from '../../types';
import { X, Building, Copy, Check, Upload, ShieldCheck, ArrowRight } from 'lucide-react';

export const DealerPaymentModal: React.FC = () => {
  const { activeModalData, currentUser, orders, submitPayment, closeModal, showToast } = useApp();

  const orderId = activeModalData?.orderId || (orders[0]?.id ?? 'BFEL-2026-8491');
  const targetOrder = orders.find((o) => o.id === orderId);
  const defaultAmount = activeModalData?.amount || targetOrder?.advancePayable || 556000;

  const [mode, setMode] = useState<PaymentMode>('RTGS');
  const [utr, setUtr] = useState<string>('PUNBR520261002' + Math.floor(10000 + Math.random() * 90000));
  const [bankName, setBankName] = useState<string>('Punjab National Bank, Dewas Branch');
  const [copied, setCopied] = useState(false);
  const [receiptName, setReceiptName] = useState<string>('bank_payment_slip_signed.pdf');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Bank details copied to clipboard', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr.trim()) {
      showToast('Please enter valid UTR / Transaction Reference number', 'error');
      return;
    }

    submitPayment({
      orderId,
      dealerName: currentUser.name,
      dealerAgency: currentUser.entityName,
      amount: defaultAmount,
      mode,
      utr,
      bankName,
      receiptUrl: '/receipts/sample_pnb_rtgs.png',
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
              Payment Submission
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Submit Advance Payment for {orderId}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Amount Due Card */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <div>
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                Advance Amount Required:
              </span>
              <div className="text-xl font-bold font-mono text-emerald-950 dark:text-white">
                {formatINR(defaultAmount)}
              </div>
            </div>
            <div className="text-right text-[11px] text-emerald-800 dark:text-emerald-400 font-mono">
              Status: <span className="font-bold underline">Pending Verification</span>
            </div>
          </div>

          {/* Official BFEL Bank Account Details */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                Official BFEL Collection Account
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard('398200110009412 - SBIN0001398')}
                className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Account'}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px]">Beneficiary Name</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Bharat Feeds &amp; Extractions Ltd
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Bank &amp; Branch</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  SBI Industrial Finance, Indore
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Account Number</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white">
                  398200110009412
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">IFSC Code</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white">
                  SBIN0001398
                </p>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Transfer Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['RTGS', 'NEFT', 'IMPS'] as PaymentMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    mode === m
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* UTR Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bank Reference / UTR Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. PUNBR52026100299841"
              className="w-full px-3 py-2 font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              16 or 22-character unique transaction reference generated by your bank.
            </span>
          </div>

          {/* Remitting Bank */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Remitting Bank &amp; Branch
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. Punjab National Bank, Dewas Branch"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          {/* Receipt Upload Simulator */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Upload Payment Receipt / Counterfoil
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <Upload className="w-4 h-4 text-slate-400" />
              <div className="flex-1 text-[11px] truncate text-slate-600 dark:text-slate-300">
                {receiptName}
              </div>
              <button
                type="button"
                onClick={() => setReceiptName(`receipt_${Date.now()}.pdf`)}
                className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Notice banner */}
          <div className="flex items-start gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Payment will be queued for Central Accounts Desk verification. Truck loading authorization is issued immediately upon UTR approval.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={closeModal}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md cursor-pointer transition-all"
            >
              <span>Submit for Verification</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
