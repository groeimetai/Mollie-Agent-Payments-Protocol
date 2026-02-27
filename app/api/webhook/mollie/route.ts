import { NextResponse } from 'next/server';
import { mollieClient } from '@/lib/mollie';
import { mandateStore, addAuditEntry } from '@/lib/ap2-types';
import { emitAgentEvent } from '@/lib/events';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const paymentId = params.get('id');

    // Validate payment ID format (Mollie uses tr_ prefix)
    if (!paymentId || !/^tr_[A-Za-z0-9]+$/.test(paymentId)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    // Fetch payment from Mollie to verify status (acts as sender verification)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payment: any = await mollieClient.payments.get(paymentId);

    addAuditEntry({
      agent: 'Webhook',
      action: 'MOLLIE_WEBHOOK',
      details: `Webhook ontvangen: ${paymentId} — status: ${payment.status}`,
    });

    emitAgentEvent({
      agent: 'payment',
      type: 'result',
      message: `Webhook: ${paymentId} → ${payment.status}`,
      data: { paymentId, status: payment.status },
    });

    // If payment is completed, update receipt
    if (payment.status === 'paid') {
      const receipt = mandateStore.receipts.get(paymentId);
      if (receipt) {
        receipt.status = 'success';
      }
      mandateStore.activePaymentId = null;
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
