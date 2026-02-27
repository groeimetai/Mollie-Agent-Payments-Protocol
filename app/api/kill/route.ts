import { NextResponse } from 'next/server';
import { mollieClient } from '@/lib/mollie';
import { mandateStore, addAuditEntry } from '@/lib/ap2-types';
import { emitAgentEvent, clearEvents } from '@/lib/events';

export async function POST() {
  emitAgentEvent({
    agent: 'orchestrator',
    type: 'error',
    message: '🔴 KILL SWITCH GEACTIVEERD — ALLE AGENTS GESTOPT',
  });

  const results: { paymentCanceled?: boolean; paymentId?: string; error?: string } = {};

  // Cancel active Mollie payment if exists
  if (mandateStore.activePaymentId) {
    try {
      await mollieClient.payments.cancel(mandateStore.activePaymentId);
      results.paymentCanceled = true;
      results.paymentId = mandateStore.activePaymentId;

      addAuditEntry({
        agent: 'KillSwitch',
        action: 'KILL_SWITCH',
        details: `Betaling geannuleerd: ${mandateStore.activePaymentId}`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      results.paymentCanceled = false;
      results.error = message;
    }
    mandateStore.activePaymentId = null;
  }

  addAuditEntry({
    agent: 'KillSwitch',
    action: 'KILL_SWITCH',
    details: 'Kill switch geactiveerd — alle agents gestopt',
  });

  return NextResponse.json({
    killed: true,
    timestamp: new Date().toISOString(),
    ...results,
  });
}
