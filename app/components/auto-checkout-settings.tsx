'use client';

import { useEffect, useState, useCallback } from 'react';

interface AutoCheckoutState {
  enabled: boolean;
  hasProfile: boolean;
  hasMollieMandate: boolean;
  mandateId: string | null;
  mandateStatus: string | null;
  preferredMethod: string | null;
  customerId: string | null;
  isFullyActive: boolean;
}

const METHODS = [
  { value: 'ideal', label: 'iDEAL' },
  { value: 'creditcard', label: 'Creditcard' },
  { value: 'bancontact', label: 'Bancontact' },
];

export function AutoCheckoutSettings() {
  const [state, setState] = useState<AutoCheckoutState | null>(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('ideal');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auto-checkout');
      const data = await res.json();
      setState(data);
      if (data.preferredMethod) setMethod(data.preferredMethod);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Listen for SSE events to update status in real-time
  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (
          event.data?.autoCheckoutActive ||
          event.data?.autoCheckout ||
          event.data?.autoCheckoutEnabled !== undefined
        ) {
          fetchStatus();
        }
      } catch {
        // Ignore
      }
    };
    return () => eventSource.close();
  }, [fetchStatus]);

  const handleSetup = async () => {
    setLoading(true);
    try {
      await fetch('/api/auto-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup', method }),
      });
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      await fetch('/api/auto-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleMethodChange = async (newMethod: string) => {
    setMethod(newMethod);
    if (state?.hasProfile) {
      await fetch('/api/auto-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setMethod', method: newMethod }),
      });
      await fetchStatus();
    }
  };

  // Status indicator
  const getStatusInfo = () => {
    if (!state?.hasProfile) {
      return { label: 'Niet ingesteld', color: 'text-zinc-500', dot: 'bg-zinc-500' };
    }
    if (!state.enabled) {
      return { label: 'Uitgeschakeld', color: 'text-zinc-500', dot: 'bg-zinc-500' };
    }
    if (state.isFullyActive) {
      return { label: `Actief (${state.mandateId})`, color: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' };
    }
    return { label: 'Wacht op eerste betaling...', color: 'text-amber-400', dot: 'bg-amber-400 animate-pulse' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="p-4 border-t border-zinc-800">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Auto-Checkout
      </h3>

      {!state?.hasProfile ? (
        // Setup mode
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            Activeer om betalingen automatisch te verwerken na de eerste keer.
          </p>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Betaalmethode</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {loading ? 'Instellen...' : 'Activeer Auto-Checkout'}
          </button>
        </div>
      ) : (
        // Active mode — toggle + method + status
        <div className="space-y-3">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Auto-checkout</span>
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                state.enabled ? 'bg-blue-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  state.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Method dropdown */}
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Betaalmethode</label>
            <select
              value={method}
              onChange={(e) => handleMethodChange(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
            <span className={`text-xs font-mono ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Customer ID */}
          {state.customerId && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Klant</span>
              <span className="font-mono text-zinc-400">{state.customerId}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
