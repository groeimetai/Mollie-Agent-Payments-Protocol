'use client';

import { useEffect, useState } from 'react';

interface AgentEvent {
  timestamp: string;
  agent: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

export function PaymentStatus() {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as AgentEvent;

        // Detect Mollie payment creation
        if (event.agent === 'payment' && event.data?.paymentId) {
          setPaymentId(event.data.paymentId as string);
          if (event.data.checkoutUrl) {
            setCheckoutUrl(event.data.checkoutUrl as string);
          }
          if (event.data.status) {
            setStatus(event.data.status as string);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    return () => eventSource.close();
  }, []);

  if (!paymentId) return null;

  return (
    <div className="p-4 border-t border-zinc-800">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Mollie Payment
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">ID</span>
          <span className="font-mono text-emerald-400">{paymentId}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Status</span>
          <span
            className={`font-mono ${
              status === 'paid'
                ? 'text-emerald-400'
                : status === 'canceled' || status === 'failed'
                ? 'text-red-400'
                : 'text-amber-400'
            }`}
          >
            {status || 'unknown'}
          </span>
        </div>
        {checkoutUrl && status !== 'paid' && (
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors mt-2"
          >
            Open Mollie Checkout →
          </a>
        )}
        {status === 'paid' && (
          <div className="text-center py-2 text-emerald-400 text-xs font-medium">
            ✓ Betaling geslaagd
          </div>
        )}
      </div>
    </div>
  );
}
