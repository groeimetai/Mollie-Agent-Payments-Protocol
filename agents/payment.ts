import { tool, generateText, stepCountIs } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/model';
import { mollieClient } from '@/lib/mollie';
import { emitAgentEvent } from '@/lib/events';
import { mandateStore, addAuditEntry, type PaymentReceipt } from '@/lib/ap2-types';

const createMolliePayment = tool({
  description: 'Create a real payment via Mollie. Returns a checkout URL where the user can complete iDEAL/creditcard payment.',
  inputSchema: z.object({
    amount: z.number().describe('Amount in EUR'),
    description: z.string().describe('Payment description shown to customer'),
    paymentMandateId: z.string().describe('AP2 Payment Mandate ID for this payment'),
    method: z.enum(['ideal', 'creditcard', 'bancontact']).optional().describe('Payment method (default: ideal)'),
  }),
  execute: async ({ amount, description, paymentMandateId, method }) => {
    emitAgentEvent({
      agent: 'payment',
      type: 'tool_call',
      message: `Mollie betaling aanmaken: €${amount.toFixed(2)} via ${method || 'ideal'}`,
    });

    // Verify payment mandate exists
    const paymentMandate = mandateStore.paymentMandates.get(paymentMandateId);
    if (!paymentMandate) {
      return { error: `Payment Mandate ${paymentMandateId} niet gevonden. Maak eerst een mandate chain aan.` };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payment = await (mollieClient.payments.create as any)({
        amount: {
          value: amount.toFixed(2),
          currency: 'EUR',
        },
        description,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment-complete?mandate=${paymentMandateId}`,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/mollie`,
        method: method || 'ideal',
        metadata: {
          paymentMandateId,
          source: 'ap2-mollie',
          protocol: 'AP2',
        },
      });

      // Store active payment ID for kill switch
      mandateStore.activePaymentId = payment.id;

      addAuditEntry({
        agent: 'PaymentAgent',
        action: 'CREATE_MOLLIE_PAYMENT',
        details: `Mollie betaling aangemaakt: ${payment.id} — €${amount.toFixed(2)}`,
        mandateId: paymentMandateId,
      });

      const checkoutUrl = payment.getCheckoutUrl();

      emitAgentEvent({
        agent: 'payment',
        type: 'result',
        message: `Mollie betaling aangemaakt: ${payment.id}`,
        data: { paymentId: payment.id, checkoutUrl, status: payment.status },
      });

      return {
        paymentId: payment.id,
        checkoutUrl,
        status: payment.status,
        method: method || 'ideal',
        amount: `€${amount.toFixed(2)}`,
        message: checkoutUrl
          ? `Betaling aangemaakt! Klik op de checkout link om te betalen via ${method || 'iDEAL'}.`
          : 'Betaling aangemaakt, maar geen checkout URL beschikbaar.',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      emitAgentEvent({
        agent: 'payment',
        type: 'error',
        message: `Mollie fout: ${message}`,
      });

      return {
        error: `Mollie API fout: ${message}`,
        suggestion: 'Controleer of de Mollie API key correct is en of het account actief is.',
      };
    }
  },
});

const checkPaymentStatus = tool({
  description: 'Check the current status of a Mollie payment. Use this to poll for payment completion.',
  inputSchema: z.object({
    paymentId: z.string().describe('Mollie payment ID (tr_xxxxx)'),
  }),
  execute: async ({ paymentId }) => {
    emitAgentEvent({
      agent: 'payment',
      type: 'tool_call',
      message: `Status check: ${paymentId}`,
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payment: any = await mollieClient.payments.get(paymentId);

      emitAgentEvent({
        agent: 'payment',
        type: 'result',
        message: `Payment status: ${payment.status}`,
        data: { paymentId, status: payment.status },
      });

      return {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        description: payment.description,
        method: payment.method,
        paidAt: payment.paidAt,
        metadata: payment.metadata,
        isPaid: payment.status === 'paid',
        isOpen: payment.status === 'open',
        isCanceled: payment.status === 'canceled',
        isExpired: payment.status === 'expired',
        isFailed: payment.status === 'failed',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: `Kon status niet ophalen: ${message}` };
    }
  },
});

const cancelPayment = tool({
  description: 'Cancel a Mollie payment. Used by the kill switch or when user wants to abort.',
  inputSchema: z.object({
    paymentId: z.string().describe('Mollie payment ID to cancel (tr_xxxxx)'),
    reason: z.string().optional().describe('Reason for cancellation'),
  }),
  execute: async ({ paymentId, reason }) => {
    emitAgentEvent({
      agent: 'payment',
      type: 'tool_call',
      message: `Betaling annuleren: ${paymentId}`,
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payment: any = await mollieClient.payments.cancel(paymentId);

      mandateStore.activePaymentId = null;

      addAuditEntry({
        agent: 'PaymentAgent',
        action: 'CANCEL_PAYMENT',
        details: `Betaling geannuleerd: ${paymentId}${reason ? ` — reden: ${reason}` : ''}`,
      });

      emitAgentEvent({
        agent: 'payment',
        type: 'result',
        message: `Betaling geannuleerd: ${paymentId}`,
      });

      return {
        paymentId: payment.id,
        status: payment.status,
        canceled: true,
        reason: reason || 'Gebruiker annulering',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      emitAgentEvent({
        agent: 'payment',
        type: 'error',
        message: `Annulering mislukt: ${message}`,
      });

      return {
        error: `Kon betaling niet annuleren: ${message}`,
        suggestion: 'De betaling is mogelijk al voltooid of verlopen.',
      };
    }
  },
});

const generateReceipt = tool({
  description: 'Generate an AP2 Payment Receipt with the Mollie payment ID and full audit trail.',
  inputSchema: z.object({
    paymentMandateId: z.string().describe('AP2 Payment Mandate ID'),
    molliePaymentId: z.string().describe('Mollie payment ID (tr_xxxxx)'),
  }),
  execute: async ({ paymentMandateId, molliePaymentId }) => {
    emitAgentEvent({
      agent: 'payment',
      type: 'tool_call',
      message: 'Betaalbewijs genereren...',
    });

    const paymentMandate = mandateStore.paymentMandates.get(paymentMandateId);
    if (!paymentMandate) {
      return { error: 'Payment Mandate niet gevonden' };
    }

    // Get actual Mollie payment status
    let mollieStatus = 'pending';
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payment: any = await mollieClient.payments.get(molliePaymentId);
      mollieStatus = payment.status === 'paid' ? 'success' : payment.status === 'failed' ? 'failed' : 'pending';
    } catch {
      // If we can't reach Mollie, mark as pending
    }

    const receipt: PaymentReceipt = {
      mandateId: paymentMandateId,
      molliePaymentId,
      amount: paymentMandate.amount,
      status: mollieStatus as 'success' | 'failed' | 'pending',
      timestamp: new Date().toISOString(),
      auditTrail: [...mandateStore.auditTrail],
    };

    mandateStore.receipts.set(molliePaymentId, receipt);

    addAuditEntry({
      agent: 'PaymentAgent',
      action: 'GENERATE_RECEIPT',
      details: `Receipt gegenereerd voor ${molliePaymentId} — status: ${mollieStatus}`,
      mandateId: paymentMandateId,
    });

    emitAgentEvent({
      agent: 'payment',
      type: 'result',
      message: `Receipt: ${molliePaymentId} — ${mollieStatus}`,
      data: { molliePaymentId, status: mollieStatus },
    });

    return {
      receipt: {
        molliePaymentId: receipt.molliePaymentId,
        amount: receipt.amount,
        status: receipt.status,
        timestamp: receipt.timestamp,
      },
      auditTrail: receipt.auditTrail,
      mandateChain: {
        paymentMandateId,
        cartMandateId: paymentMandate.cartMandateId,
      },
    };
  },
});

export const paymentTools = {
  createMolliePayment,
  checkPaymentStatus,
  cancelPayment,
  generateReceipt,
};

export async function runPaymentAgent(prompt: string): Promise<string> {
  emitAgentEvent({
    agent: 'payment',
    type: 'start',
    message: 'Payment Agent geactiveerd',
  });

  const result = await generateText({
    model: getModel(),
    system: `Je bent de Payment Agent. Je verwerkt betalingen via Mollie.

Je werkwijze:
1. Maak een Mollie betaling aan met createMolliePayment (vereist een AP2 Payment Mandate ID)
2. Geef de checkout URL aan de gebruiker zodat ze kunnen betalen
3. Check de status met checkPaymentStatus als gevraagd
4. Genereer een receipt na succesvolle betaling

BELANGRIJK:
- Gebruik ALTIJD de Payment Mandate ID die je ontvangt
- Geef de checkout URL duidelijk weer — dit is een echte Mollie betaling
- Bij annulering: gebruik cancelPayment

Communiceer in het Nederlands.`,
    tools: paymentTools,
    stopWhen: stepCountIs(5),
    prompt,
  });

  emitAgentEvent({
    agent: 'payment',
    type: 'complete',
    message: 'Payment Agent klaar',
  });

  return result.text;
}
