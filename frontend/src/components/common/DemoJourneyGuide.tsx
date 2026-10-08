import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { CheckCircle2, ChevronRight, ChevronDown, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';

interface JourneyStep {
  id: number;
  role: UserRole;
  title: string;
  actor: string;
  actionDesc: string;
  targetModalOrTab: string;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 1,
    role: 'dealer',
    title: 'Order Capture',
    actor: 'Ramesh Patel (Dealer)',
    actionDesc: 'Place 400 bags Dudh Dhara 50kg (20 MT truck load)',
    targetModalOrTab: 'dealer_order',
  },
  {
    id: 2,
    role: 'dealer',
    title: 'Advance Payment',
    actor: 'Ramesh Patel (Dealer)',
    actionDesc: 'Submit advance payment with RTGS UTR proof',
    targetModalOrTab: 'dealer_payment',
  },
  {
    id: 3,
    role: 'accounts',
    title: 'Payment Verification',
    actor: 'Sunita Jain (Accounts)',
    actionDesc: 'Review UTR in payment desk drawer & verify order',
    targetModalOrTab: 'accounts_verification',
  },
  {
    id: 4,
    role: 'loading_operator',
    title: 'Truck Terminal Loading',
    actor: 'Kailash Verma (Bay 3)',
    actionDesc: 'Load 400/400 bags, check weighbridge variance & enter seal',
    targetModalOrTab: 'loading_terminal',
  },
  {
    id: 5,
    role: 'admin',
    title: 'Gate Clearance & Dispatch',
    actor: 'Rajeshwar Sharma (Admin)',
    actionDesc: 'Issue Gate Pass, LR & generate WhatsApp dispatch alert',
    targetModalOrTab: 'admin_dispatch',
  },
  {
    id: 6,
    role: 'dealer',
    title: 'Delivery & Shortage Claim',
    actor: 'Ramesh Patel (Dealer)',
    actionDesc: 'Report 392 bags received (8 bags short) with photos',
    targetModalOrTab: 'dealer_claim',
  },
  {
    id: 7,
    role: 'admin',
    title: 'Claim Review & Credit Note',
    actor: 'Rajeshwar Sharma (Admin)',
    actionDesc: 'Approve claim & generate Credit Note into distributor wallet',
    targetModalOrTab: 'admin_claims',
  },
];

export const DemoJourneyGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentRole, switchRole, openModal, orders, payments, claims, resetToDefault } = useApp();

  // Dynamic state checks for current journey progress
  const hasPendingOrLoadingOrder = orders.some((o) => o.id === 'BFEL-2026-8491');
  const order8491 = orders.find((o) => o.id === 'BFEL-2026-8491');
  const isPaymentDone = order8491?.advancePaid && order8491.advancePaid > 0;
  const isPaymentVerified = order8491?.status !== 'order_placed' && order8491?.status !== 'payment_submitted';
  const isLoadingComplete = order8491?.status === 'loading_completed' || order8491?.status === 'dispatched' || order8491?.status === 'delivered';
  const isDispatched = order8491?.status === 'dispatched' || order8491?.status === 'delivered';
  const hasClaim = claims.some((c) => c.claimType === 'shortage');
  const isClaimApproved = claims.some((c) => c.status === 'approved');

  const getStepStatus = (stepId: number): 'completed' | 'active' | 'upcoming' => {
    switch (stepId) {
      case 1:
        return hasPendingOrLoadingOrder ? 'completed' : 'active';
      case 2:
        return isPaymentDone ? 'completed' : hasPendingOrLoadingOrder ? 'active' : 'upcoming';
      case 3:
        return isPaymentVerified ? 'completed' : isPaymentDone ? 'active' : 'upcoming';
      case 4:
        return isLoadingComplete ? 'completed' : isPaymentVerified ? 'active' : 'upcoming';
      case 5:
        return isDispatched ? 'completed' : isLoadingComplete ? 'active' : 'upcoming';
      case 6:
        return hasClaim ? 'completed' : isDispatched ? 'active' : 'upcoming';
      case 7:
        return isClaimApproved ? 'completed' : hasClaim ? 'active' : 'upcoming';
      default:
        return 'upcoming';
    }
  };

  const handleStepJump = (step: JourneyStep) => {
    if (currentRole !== step.role) {
      switchRole(step.role);
    }

    switch (step.targetModalOrTab) {
      case 'dealer_order':
        openModal('dealer_order_capture');
        break;
      case 'dealer_payment':
        openModal('dealer_payment', { orderId: 'BFEL-2026-8491', amount: 556000 });
        break;
      case 'accounts_verification':
        openModal('payment_verification', { paymentId: 'PAY-8493-PENDING' });
        break;
      case 'loading_terminal':
        // already on loading operator screen
        break;
      case 'admin_dispatch':
        openModal('whatsapp_alert', { orderId: 'BFEL-2026-8488' });
        break;
      case 'dealer_claim':
        openModal('dealer_claim', { orderId: 'BFEL-2026-8485', expectedBags: 400 });
        break;
      case 'admin_claims':
        // opens claims tab on admin
        break;
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white transition-all text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Demo Journey</span>
          </div>
          <span className="hidden sm:inline text-slate-300">
            Order → Payment → Verification → Loading (Bay 3) → Gate Pass/LR → WhatsApp → Claims
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer transition-colors"
          >
            <span>{isOpen ? 'Hide Journey Steps' : 'View 7-Step Journey'}</span>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={resetToDefault}
            title="Reset to initial factory state"
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 cursor-pointer transition-colors text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset Journey</span>
          </button>
        </div>
      </div>

      {/* Expanded Journey Step Cards */}
      {isOpen && (
        <div className="border-t border-slate-800 bg-slate-950/90 px-4 py-3">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
            {JOURNEY_STEPS.map((step) => {
              const status = getStepStatus(step.id);
              const isCurrentStep = status === 'active';

              return (
                <div
                  key={step.id}
                  onClick={() => handleStepJump(step)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    status === 'completed'
                      ? 'bg-slate-900/80 border-emerald-500/40 text-slate-300 hover:border-emerald-500'
                      : isCurrentStep
                      ? 'bg-blue-950/50 border-blue-500 text-white ring-1 ring-blue-500/50 shadow-md'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-slate-400">Step {step.id}</span>
                    {status === 'completed' ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Done
                      </span>
                    ) : isCurrentStep ? (
                      <span className="text-[10px] font-semibold text-blue-400 animate-pulse">Ready</span>
                    ) : null}
                  </div>

                  <h4 className="font-semibold text-xs leading-snug line-clamp-1">{step.title}</h4>
                  <p className="text-[10px] text-amber-400/90 font-medium mt-0.5">{step.actor}</p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{step.actionDesc}</p>

                  <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-medium text-blue-400">
                    <span>Switch &amp; Run</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
