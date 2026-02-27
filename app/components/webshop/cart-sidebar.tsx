'use client';

import { useCart } from '@/lib/cart-store';

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { items, removeItem, total, itemCount } = useCart();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Shopping Cart ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {items.length === 0 && (
            <div className="text-center text-gray-400 mt-12">
              <div className="text-4xl mb-3">🛒</div>
              <p className="text-sm">Your cart is empty</p>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
            >
              {/* Mini product image */}
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-2xl">💻</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {item.product.name}
                </div>
                <div className="text-xs text-gray-500">{item.product.vendor}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-gray-900">
                    €{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {item.quantity}x
                  </span>
                </div>
              </div>

              <button
                onClick={() => removeItem(item.product.id)}
                className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Footer with total */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-xl font-bold text-gray-900">
                €{total.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-center text-gray-400 mt-2">
              Use the checkout agent in the bottom right to check out
            </div>
          </div>
        )}
      </div>
    </>
  );
}
