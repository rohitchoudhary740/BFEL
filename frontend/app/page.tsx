'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the App to ensure safe client-side hydration for localStorage state
const BfelFlowApp = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm font-bold tracking-wider text-slate-300">
          INITIALIZING BFEL FLOW SYSTEM...
        </div>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return <BfelFlowApp />;
}
