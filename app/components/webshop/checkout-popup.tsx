'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart-store';
import { Chat } from '../chat';

const BRAND_CHAT: Record<string, { bg: string; bgHover: string; name: string; subtitleClass: string }> = {
  laptop: { bg: '#0000C4', bgHover: '#0000A0', name: 'bol.com', subtitleClass: 'text-blue-200' },
  sneakers: { bg: '#111111', bgHover: '#333333', name: 'Nike', subtitleClass: 'text-gray-400' },
  boodschappen: { bg: '#FF7700', bgHover: '#E56A00', name: 'Thuisbezorgd', subtitleClass: 'text-orange-200' },
  hotel: { bg: '#003580', bgHover: '#00264D', name: 'Booking.com', subtitleClass: 'text-blue-300' },
};

interface CheckoutPopupProps {
  activeCategory: string;
}

export function CheckoutPopup({ activeCategory }: CheckoutPopupProps) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<'compact' | 'large'>('compact');
  const { items, total, itemCount } = useCart();
  const prevItemCount = useRef(0);
  const [autoTriggered, setAutoTriggered] = useState(false);

  const brand = BRAND_CHAT[activeCategory] || BRAND_CHAT.laptop;

  // Track item count changes (auto-trigger disabled for demo flow)
  useEffect(() => {
    prevItemCount.current = itemCount;
  }, [itemCount]);

  // Build cart context string for auto-send
  const cartContext = items.length > 0
    ? `I'm on ${brand.name} and have the following in my cart: ${items
        .map((i) => `${i.product.name} - €${i.product.price.toFixed(2)}`)
        .join(', ')}. Total: €${total.toFixed(2)}. Help me check out.`
    : undefined;

  const isLarge = size === 'large';

  return (
    <>
      {/* Collapsed: floating chat bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute bottom-6 right-6 w-16 h-16 text-white rounded-full shadow-xl hover:shadow-2xl hover:opacity-90 transition-all flex items-center justify-center z-30 group"
          style={{ backgroundColor: brand.bg }}
        >
          <svg className="w-7 h-7 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
              {itemCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded: chat popup */}
      {open && (
        <div
          className={`absolute bg-white shadow-2xl border border-gray-200 z-30 flex flex-col overflow-hidden transition-all duration-300 ${
            isLarge
              ? 'bottom-0 right-0 w-full h-full sm:bottom-6 sm:right-6 sm:w-[600px] sm:max-w-[calc(100vw-2rem)] sm:h-[700px] sm:max-h-[calc(100vh-3rem)] sm:rounded-2xl'
              : 'bottom-0 right-0 w-full h-full sm:bottom-6 sm:right-6 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:h-[520px] sm:max-h-[calc(100vh-3rem)] sm:rounded-2xl'
          }`}
        >
          {/* Popup header */}
          <div
            className="text-white px-4 py-3 flex items-center justify-between shrink-0"
            style={{ backgroundColor: brand.bg }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
                🤖
              </div>
              <div>
                <div className="text-sm font-semibold">{brand.name} Checkout Agent</div>
                <div className={`text-xs ${brand.subtitleClass}`}>AP2 + Mollie</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Size toggle */}
              <button
                onClick={() => setSize(isLarge ? 'compact' : 'large')}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title={isLarge ? 'Smaller' : 'Larger'}
              >
                {isLarge ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-hidden">
            <Chat
              variant="popup"
              cartContext={autoTriggered ? cartContext : undefined}
              cartTotal={total}
              brandColor={brand.bg}
              brandName={brand.name}
              activeCategory={activeCategory}
            />
          </div>
        </div>
      )}
    </>
  );
}
