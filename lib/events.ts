// Simple event system for agent activity tracking
// Used by the dashboard to show real-time agent status
//
// Uses globalThis to ensure singleton across all Next.js route handlers
// (Turbopack/HMR can re-evaluate modules, creating separate instances)

export type AgentEvent = {
  timestamp: string;
  agent: 'orchestrator' | 'shopping' | 'mandate' | 'payment';
  type: 'start' | 'tool_call' | 'result' | 'error' | 'complete';
  message: string;
  data?: Record<string, unknown>;
};

interface EventStore {
  events: AgentEvent[];
  listeners: Set<(event: AgentEvent) => void>;
}

// Singleton via globalThis — survives HMR and module re-evaluation
const g = globalThis as unknown as { __ap2EventStore?: EventStore };
if (!g.__ap2EventStore) {
  g.__ap2EventStore = {
    events: [],
    listeners: new Set(),
  };
}
const store = g.__ap2EventStore;

export function emitAgentEvent(event: Omit<AgentEvent, 'timestamp'>) {
  const fullEvent: AgentEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  store.events.push(fullEvent);
  // Keep last 100 events
  if (store.events.length > 100) store.events.shift();
  store.listeners.forEach((fn) => fn(fullEvent));
}

export function onAgentEvent(listener: (event: AgentEvent) => void) {
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

export function getRecentEvents(count = 20): AgentEvent[] {
  return store.events.slice(-count);
}

export function clearEvents() {
  store.events.length = 0;
}
