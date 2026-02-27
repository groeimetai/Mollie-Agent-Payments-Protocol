'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CartProvider } from './components/cart-provider';
import { Header } from './components/webshop/header';
import { ProductGrid } from './components/webshop/product-grid';
import { CartSidebar } from './components/webshop/cart-sidebar';
import { CheckoutPopup } from './components/webshop/checkout-popup';
import { AgentActivity } from './components/agent-activity';
import { PaymentStatus } from './components/payment-status';
import { AutoCheckoutSettings } from './components/auto-checkout-settings';
import { KillSwitch } from './components/kill-switch';

function PaymentSuccessToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 left-1/2 lg:left-[30%] -translate-x-1/2 z-50 animate-slide-down">
      <div className="flex items-center gap-3 bg-white rounded-xl shadow-2xl border border-emerald-200 px-5 py-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">Betaling geslaagd!</div>
          <div className="text-xs text-gray-500">Verwerkt via Mollie met AP2 protocol</div>
        </div>
        <button onClick={onDismiss} className="ml-3 text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function DashboardContent({ onClose }: { onClose?: () => void }) {
  return (
    <>
      {/* Dashboard header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">
            Agent Dashboard
          </h2>
          <div className="flex items-center gap-2">
            <div className="text-xs text-zinc-600 font-mono hidden sm:block">
              AP2 Protocol v1
            </div>
            <button
              onClick={async () => {
                await fetch('/api/reset', { method: 'POST' });
                window.location.reload();
              }}
              className="text-xs text-zinc-600 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600 transition-colors"
              title="Reset server state voor demo"
            >
              Reset
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden text-zinc-500 hover:text-zinc-300 p-1 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agent Activity Feed */}
      <div className="flex-1 overflow-hidden">
        <AgentActivity />
      </div>

      {/* Payment Status */}
      <PaymentStatus />

      {/* Auto-Checkout Settings */}
      <AutoCheckoutSettings />

      {/* Kill Switch */}
      <div className="p-4 border-t border-zinc-800">
        <KillSwitch />
      </div>
    </>
  );
}

function HomeContent() {
  const [cartOpen, setCartOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('laptop');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  return (
    <CartProvider>
      {showPaymentSuccess && (
        <PaymentSuccessToast onDismiss={() => setShowPaymentSuccess(false)} />
      )}
      <div className="flex h-dvh">
        {/* Webshop — full width on mobile, 60% on desktop */}
        <div className="relative flex flex-col w-full lg:w-[60%] bg-gray-50 overflow-hidden">
          <Header
            activeCategory={activeCategory}
            onCartClick={() => setCartOpen(true)}
            onCategoryChange={setActiveCategory}
          />
          <div className="flex-1 overflow-y-auto">
            <ProductGrid activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
          <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
          <CheckoutPopup activeCategory={activeCategory} />

          {/* Mobile: floating dashboard button */}
          <button
            onClick={() => setDashboardOpen(true)}
            className="lg:hidden fixed bottom-6 left-4 w-12 h-12 bg-zinc-900 text-white rounded-full shadow-xl hover:bg-zinc-800 transition-colors flex items-center justify-center z-20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>

        {/* Desktop: Dashboard sidebar (always visible) */}
        <div className="hidden lg:flex flex-col w-[40%] bg-zinc-950 text-white border-l border-zinc-800">
          <DashboardContent />
        </div>

        {/* Mobile: Dashboard as slide-in drawer */}
        {dashboardOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setDashboardOpen(false)}
          />
        )}
        <div
          className={`lg:hidden fixed inset-y-0 right-0 w-[85vw] max-w-md bg-zinc-950 text-white z-50 flex flex-col transform transition-transform duration-300 ${
            dashboardOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <DashboardContent onClose={() => setDashboardOpen(false)} />
        </div>
      </div>
    </CartProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
