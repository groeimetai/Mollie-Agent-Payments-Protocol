'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function PaymentCompleteContent() {
  const searchParams = useSearchParams();
  const mandateId = searchParams.get('mandate');

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Success animation */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center animate-bounce">
            <svg
              className="w-10 h-10 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Betaling Geslaagd!
        </h1>
        <p className="text-zinc-400 mb-6">
          Je betaling is verwerkt via Mollie met het AP2 protocol.
        </p>

        {mandateId && (
          <div className="bg-zinc-900 rounded-xl p-4 mb-6 border border-zinc-800 text-left">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              AP2 Mandate Chain
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Payment Mandate</span>
                <span className="text-emerald-400">{mandateId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Protocol</span>
                <span className="text-amber-400">AP2 v1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Provider</span>
                <span className="text-blue-400">Mollie</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Status</span>
                <span className="text-emerald-400">Verified</span>
              </div>
            </div>
          </div>
        )}

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          ← Terug naar Agent Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function PaymentComplete() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-zinc-500">Laden...</div>
        </div>
      }
    >
      <PaymentCompleteContent />
    </Suspense>
  );
}
