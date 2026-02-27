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
  const [autoCheckout, setAutoCheckout] = useState(false);
  const [isFirstPayment, setIsFirstPayment] = useState(false);
  const [autoCheckoutActive, setAutoCheckoutActive] = useState(false);
  const [method, setMethod] = useState<string | null>(null);

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
          } else {
            setCheckoutUrl(null);
          }
          if (event.data.status) {
            setStatus(event.data.status as string);
          }
          if (event.data.autoCheckout !== undefined) {
            setAutoCheckout(event.data.autoCheckout as boolean);
          }
          if (event.data.isFirstPayment !== undefined) {
            setIsFirstPayment(event.data.isFirstPayment as boolean);
          }
          if (event.data.method) {
            setMethod(event.data.method as string);
          }
        }

        // Detect auto-checkout becoming active
        if (event.data?.autoCheckoutActive) {
          setAutoCheckoutActive(true);
        }
      } catch {
        // Ignore parse errors
      }
    };

    return () => eventSource.close();
  }, []);

  if (!paymentId) return null;

  const modeLabel = autoCheckout ? 'Automatisch' : 'Handmatig';
  const modeColor = autoCheckout ? 'text-blue-400' : 'text-zinc-400';

  return (
    <div className="p-4 border-t border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Mollie Payment
        </h3>
        {(autoCheckout || autoCheckoutActive) && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-blue-400">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Auto-checkout actief
          </span>
        )}
      </div>
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
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Modus</span>
          <span className={`font-mono ${modeColor}`}>{modeLabel}</span>
        </div>
        {method && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Methode</span>
            <span className="font-mono text-zinc-300">{method}</span>
          </div>
        )}

        {/* First payment info */}
        {isFirstPayment && checkoutUrl && status !== 'paid' && (
          <div className="text-xs text-amber-400/80 py-1">
            Eerste betaling — na deze keer gaat alles automatisch
          </div>
        )}

        {/* Manual/first checkout button */}
        {checkoutUrl && !autoCheckout && status !== 'paid' && (
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors mt-2"
          >
            Open Mollie Checkout →
          </a>
        )}

        {/* Auto-checkout success */}
        {autoCheckout && status === 'paid' && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-emerald-400 text-xs font-medium">
            <span>⚡</span> Automatische betaling geslaagd
          </div>
        )}

        {/* Manual success */}
        {!autoCheckout && status === 'paid' && (
          <div className="text-center py-2 text-emerald-400 text-xs font-medium">
            ✓ Betaling geslaagd
          </div>
        )}
      </div>
    </div>
  );
}
