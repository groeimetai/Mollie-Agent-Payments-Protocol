'use client';

import { useEffect, useState } from 'react';

interface AgentEvent {
  timestamp: string;
  agent: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

const AGENT_COLORS: Record<string, string> = {
  orchestrator: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  shopping: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  mandate: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  payment: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

const AGENT_ICONS: Record<string, string> = {
  orchestrator: '🎯',
  shopping: '🛒',
  mandate: '📜',
  payment: '💳',
};

const AGENT_DESCRIPTIONS: Record<string, { name: string; role: string; tools: string[] }> = {
  orchestrator: {
    name: 'CFO Orchestrator',
    role: 'Dirigeert het multi-agent systeem. Delegeert taken naar de juiste sub-agent.',
    tools: ['shopping', 'mandate', 'payment', 'getSystemStatus'],
  },
  shopping: {
    name: 'Shopping Agent',
    role: 'Zoekt en vergelijkt producten. Gebruikt demo-data van NL webshops.',
    tools: ['searchProducts', 'compareProducts'],
  },
  mandate: {
    name: 'Mandate Agent (AP2)',
    role: 'Beheert het AP2 mandate protocol. Maakt JWT-signed mandates aan.',
    tools: ['createIntentMandate', 'createCartMandate', 'createPaymentMandate', 'validateMandateChain'],
  },
  payment: {
    name: 'Payment Agent (Mollie)',
    role: 'Verwerkt echte betalingen via de Mollie API.',
    tools: ['createMolliePayment', 'checkPaymentStatus', 'cancelPayment', 'generateReceipt'],
  },
};

const TYPE_INDICATORS: Record<string, string> = {
  start: '▶',
  tool_call: '⚙',
  result: '✓',
  error: '✗',
  complete: '●',
};

export function AgentActivity() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => setConnected(true);

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as AgentEvent;
        setEvents((prev) => [...prev.slice(-50), event]);
      } catch {
        // Ignore parse errors (heartbeats etc)
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => eventSource.close();
  }, []);

  // Determine which agents are currently active
  const activeAgents = new Set<string>();
  for (const event of events.slice(-20)) {
    if (event.type === 'start' || event.type === 'tool_call') {
      activeAgents.add(event.agent);
    }
    if (event.type === 'complete' || event.type === 'error') {
      activeAgents.delete(event.agent);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">
            Agent Activity
          </h2>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span className="text-xs text-zinc-500">
              {connected ? 'Live' : 'Verbinden...'}
            </span>
          </div>
        </div>

        {/* Agent cards — click to expand */}
        <div className="grid grid-cols-2 gap-1.5 mt-3">
          {(['orchestrator', 'shopping', 'mandate', 'payment'] as const).map((agent) => {
            const desc = AGENT_DESCRIPTIONS[agent];
            const isActive = activeAgents.has(agent);
            const isExpanded = expandedAgent === agent;

            return (
              <button
                key={agent}
                onClick={() => setExpandedAgent(isExpanded ? null : agent)}
                className={`text-left px-2.5 py-2 rounded-lg text-xs border transition-all duration-300 ${
                  isActive
                    ? AGENT_COLORS[agent]
                    : 'text-zinc-500 bg-zinc-800/30 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {AGENT_ICONS[agent]} {desc.name.split(' ')[0]}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded agent detail */}
        {expandedAgent && (
          <div className={`mt-2 p-3 rounded-lg border text-xs ${AGENT_COLORS[expandedAgent]}`}>
            <div className="font-semibold mb-1">
              {AGENT_ICONS[expandedAgent]} {AGENT_DESCRIPTIONS[expandedAgent].name}
            </div>
            <p className="text-zinc-400 mb-2">
              {AGENT_DESCRIPTIONS[expandedAgent].role}
            </p>
            <div className="text-zinc-500">
              <span className="text-zinc-600">Tools: </span>
              {AGENT_DESCRIPTIONS[expandedAgent].tools.map((t, i) => (
                <span key={t}>
                  <code className="text-zinc-400">{t}</code>
                  {i < AGENT_DESCRIPTIONS[expandedAgent].tools.length - 1 && ', '}
                </span>
              ))}
            </div>
            {expandedAgent === 'shopping' && (
              <div className="mt-2 px-2 py-1 rounded bg-cyan-900/20 border border-cyan-800/30 text-cyan-400">
                ⓘ Gebruikt demo-data (5 laptops van Bol.com, Coolblue, MediaMarkt)
              </div>
            )}
            {expandedAgent === 'payment' && (
              <div className="mt-2 px-2 py-1 rounded bg-emerald-900/20 border border-emerald-800/30 text-emerald-400">
                ⓘ Echte Mollie API — betalingen in test-modus
              </div>
            )}
            {expandedAgent === 'mandate' && (
              <div className="mt-2 px-2 py-1 rounded bg-amber-900/20 border border-amber-800/30 text-amber-400">
                ⓘ AP2 mandate chain met JWT-signing (Intent → Cart → Payment)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Agent flow visualization */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className={activeAgents.has('shopping') ? 'text-cyan-400 font-semibold' : 'text-zinc-600'}>
              🛒 Shop
            </span>
            <span className={activeAgents.has('shopping') || activeAgents.has('mandate') ? 'text-zinc-400' : 'text-zinc-700'}>→</span>
            <span className={activeAgents.has('mandate') ? 'text-amber-400 font-semibold' : 'text-zinc-600'}>
              📜 Mandate
            </span>
            <span className={activeAgents.has('mandate') || activeAgents.has('payment') ? 'text-zinc-400' : 'text-zinc-700'}>→</span>
            <span className={activeAgents.has('payment') ? 'text-emerald-400 font-semibold' : 'text-zinc-600'}>
              💳 Pay
            </span>
          </div>
          <span className="text-zinc-600 font-mono">{events.length} events</span>
        </div>
      </div>

      {/* Event feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {events.length === 0 && (
          <div className="text-center text-zinc-600 text-xs mt-8 space-y-2">
            <p>Wacht op agent activiteit...</p>
            <p className="text-zinc-700">Klik op een agent hierboven voor details</p>
          </div>
        )}

        {events.map((event, i) => (
          <div
            key={i}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
              event.type === 'error'
                ? 'bg-red-900/20 border-red-800/30 text-red-400'
                : event.type === 'start'
                ? `${AGENT_COLORS[event.agent]} font-semibold`
                : 'bg-zinc-800/50 border-zinc-800 text-zinc-400'
            } ${i === events.length - 1 ? 'animate-fade-in' : ''}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-zinc-600 shrink-0">
                {new Date(event.timestamp).toLocaleTimeString('nl-NL', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className={AGENT_COLORS[event.agent]?.split(' ')[0] || 'text-zinc-500'}>
                {TYPE_INDICATORS[event.type] || '·'}
              </span>
              <span className="break-all">{event.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
