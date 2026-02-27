// Simple event system for agent activity tracking
// Used by the dashboard to show real-time agent status

export type AgentEvent = {
  timestamp: string;
  agent: 'orchestrator' | 'shopping' | 'mandate' | 'payment';
  type: 'start' | 'tool_call' | 'result' | 'error' | 'complete';
  message: string;
  data?: Record<string, unknown>;
};

// In-memory event log (SSE consumers read from this)
const events: AgentEvent[] = [];
const listeners: Set<(event: AgentEvent) => void> = new Set();

export function emitAgentEvent(event: Omit<AgentEvent, 'timestamp'>) {
  const fullEvent: AgentEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  events.push(fullEvent);
  // Keep last 100 events
  if (events.length > 100) events.shift();
  listeners.forEach((fn) => fn(fullEvent));
}

export function onAgentEvent(listener: (event: AgentEvent) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecentEvents(count = 20): AgentEvent[] {
  return events.slice(-count);
}

export function clearEvents() {
  events.length = 0;
}
