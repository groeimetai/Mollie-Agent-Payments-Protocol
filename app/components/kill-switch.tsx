'use client';

import { useState } from 'react';

export function KillSwitch() {
  const [killing, setKilling] = useState(false);
  const [killed, setKilled] = useState(false);

  async function handleKill() {
    if (!confirm('Weet je zeker dat je ALLE agents wilt stoppen en betalingen wilt annuleren?')) {
      return;
    }

    setKilling(true);
    try {
      const res = await fetch('/api/kill', { method: 'POST' });
      const data = await res.json();
      if (data.killed) {
        setKilled(true);
        setTimeout(() => setKilled(false), 3000);
      }
    } catch (err) {
      console.error('Kill switch error:', err);
    } finally {
      setKilling(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleKill}
        disabled={killing}
        className={`w-full py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
          killed
            ? 'bg-red-600 text-white animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.5)]'
            : killing
            ? 'bg-red-800 text-red-200 cursor-wait'
            : 'bg-red-900/50 text-red-400 border border-red-800/50 hover:bg-red-800 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]'
        }`}
      >
        {killed ? '⚡ ALL AGENTS TERMINATED ⚡' : killing ? 'Killing...' : '🔴 Kill Switch'}
      </button>
      {killed && (
        <div className="absolute inset-0 rounded-xl bg-red-500/10 animate-ping pointer-events-none" />
      )}
    </div>
  );
}
