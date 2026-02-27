import { tool, generateText, stepCountIs } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/model';
import { mollieClient } from '@/lib/mollie';
import { emitAgentEvent } from '@/lib/events';
import { mandateStore, addAuditEntry, hasValidRecurringSetup, DEMO_CUSTOMER, type PaymentReceipt } from '@/lib/ap2-types';

const setupCustomerProfile = tool({
  description: 'Set up a Mollie customer profile for auto-checkout (recurring payments). After the first payment, all subsequent payments will be processed automatically without user interaction.',
  inputSchema: z.object({
    preferredMethod: z.enum(['ideal', 'creditcard', 'bancontact']).describe('Preferred payment method for recurring payments'),
  }),
  execute: async ({ preferredMethod }) => {
    emitAgentEvent({
      agent: 'payment',
      type: 'tool_call',
      message: `Klantprofiel aanmaken voor auto-checkout via ${preferredMethod}`,
    });

    // If profile already exists, just update preferences
    if (mandateStore.customerProfile) {
      mandateStore.customerProfile.preferredPaymentMethod = preferredMethod;
      mandateStore.customerProfile.autoCheckoutEnabled = true;
      mandateStore.customerProfile.updatedAt = new Date().toISOString();

      emitAgentEvent({
        agent: 'payment',
        type: 'result',
        message: `Klantprofiel bijgewerkt: ${mandateStore.customerProfile.mollieCustomerId}`,
        data: { customerId: mandateStore.customerProfile.mollieCustomerId, autoCheckout: true },
      });

      return {
        customerId: mandateStore.customerProfile.mollieCustomerId,
        autoCheckoutEnabled: true,
        preferredMethod,
        hasMandate: !!mandateStore.customerProfile.mollieMandateId,
        message: `Auto-checkout bijgewerkt. Voorkeursmethode: ${preferredMethod}.${mandateStore.customerProfile.mollieMandateId ? ' Mandate is actief — volgende betalingen gaan automatisch.' : ' Bij de eerstvolgende betaling wordt je betaalmethode opgeslagen.'}`,
      };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customer = await (mollieClient.customers as any).create({
        name: DEMO_CUSTOMER.name,
        email: DEMO_CUSTOMER.email,
      });

      const now = new Date().toISOString();
      mandateStore.customerProfile = {
        mollieCustomerId: customer.id,
        name: DEMO_CUSTOMER.name,
        email: DEMO_CUSTOMER.email,
        preferredPaymentMethod: preferredMethod,
        mollieMandateId: null,
        mandateStatus: null,
        autoCheckoutEnabled: true,
        createdAt: now,
        updatedAt: now,
      };

      addAuditEntry({
        agent: 'PaymentAgent',
        action: 'SETUP_CUSTOMER_PROFILE',
        details: `Mollie klant aangemaakt: ${customer.id} — auto-checkout ingeschakeld met ${preferredMethod}`,
      });

      emitAgentEvent({
        agent: 'payment',
        type: 'result',
        message: `Klantprofiel aangemaakt: ${customer.id}`,
        data: { customerId: customer.id, autoCheckout: true },
      });

      return {
        customerId: customer.id,
        autoCheckoutEnabled: true,
        preferredMethod,
        hasMandate: false,
        message: `Auto-checkout ingesteld! Klant ${customer.id} aangemaakt. Bij de eerstvolgende betaling wordt je ${preferredMethod} betaalmethode opgeslagen. Daarna gaan alle betalingen automatisch.`,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      emitAgentEvent({
        agent: 'payment',
        type: 'error',
        message: `Klantprofiel fout: ${message}`,
      });
      return { error: `Kon klantprofiel niet aanmaken: ${message}` };
    }
  },
});

const createMolliePayment = tool({
  description: 'Create a real payment via Mollie. Returns a checkout URL where the user can complete iDEAL/creditcard payment. If auto-checkout is enabled with a valid mandate, the payment is processed automatically without a checkout URL.',
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
      const profile = mandateStore.customerProfile;
      const isAutoCheckout = hasValidRecurringSetup();
      const isFirstPayment = !!(profile?.autoCheckoutEnabled && profile.mollieCustomerId && !profile.mollieMandateId);

      // Build payment params based on mode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentParams: any = {
        amount: {
          value: amount.toFixed(2),
          currency: 'EUR',
        },
        description,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/mollie`,
        metadata: {
          paymentMandateId,
          source: 'ap2-mollie',
          protocol: 'AP2',
        },
      };

      if (isAutoCheckout) {
        // AUTO: Recurring payment — no checkout needed
        paymentParams.sequenceType = 'recurring';
        paymentParams.customerId = profile!.mollieCustomerId;
        paymentParams.mandateId = profile!.mollieMandateId;
        // No redirectUrl — payment is processed automatically

        emitAgentEvent({
          agent: 'payment',
          type: 'tool_call',
          message: `Auto-checkout: €${amount.toFixed(2)} via recurring mandate`,
          data: { autoCheckout: true },
        });
      } else if (isFirstPayment) {
        // FIRST: First payment with customer — captures mandate
        paymentParams.sequenceType = 'first';
        paymentParams.customerId = profile!.mollieCustomerId;
        paymentParams.method = method || profile!.preferredPaymentMethod;
        paymentParams.redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?payment=success&mandate=${paymentMandateId}`;
      } else {
        // MANUAL: Standard one-off payment (original flow)
        paymentParams.method = method || 'ideal';
        paymentParams.redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?payment=success&mandate=${paymentMandateId}`;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payment = await (mollieClient.payments.create as any)(paymentParams);

      // Store active payment ID for kill switch
      mandateStore.activePaymentId = payment.id;

      const sequenceLabel = isAutoCheckout ? 'recurring' : isFirstPayment ? 'first' : 'oneoff';
      addAuditEntry({
        agent: 'PaymentAgent',
        action: 'CREATE_MOLLIE_PAYMENT',
        details: `Mollie betaling aangemaakt: ${payment.id} — €${amount.toFixed(2)} [${sequenceLabel}]`,
        mandateId: paymentMandateId,
      });

      // For recurring payments: poll Mollie for final status
      // Recurring payments are processed async and typically settle within seconds
      let finalStatus = payment.status;
      if (isAutoCheckout) {
        for (let i = 0; i < 3; i++) {
          await new Promise(r => setTimeout(r, 2000));
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const check: any = await mollieClient.payments.get(payment.id);
            finalStatus = check.status;
            if (finalStatus === 'paid' || finalStatus === 'failed') break;
          } catch {
            // If poll fails, continue with current status
          }
        }

        // Update receipt status if paid
        if (finalStatus === 'paid') {
          const receipt = mandateStore.receipts.get(payment.id);
          if (receipt) {
            receipt.status = 'success';
          }
        }
      }

      const checkoutUrl = isAutoCheckout ? null : payment.getCheckoutUrl?.();

      emitAgentEvent({
        agent: 'payment',
        type: 'result',
        message: isAutoCheckout
          ? `Auto-checkout verwerkt: ${payment.id}`
          : `Mollie betaling aangemaakt: ${payment.id}`,
        data: {
          paymentId: payment.id,
          checkoutUrl,
          status: isAutoCheckout ? finalStatus : payment.status,
          autoCheckout: isAutoCheckout,
          isFirstPayment,
          method: isAutoCheckout ? 'recurring (via iDEAL mandaat)' : paymentParams.method || 'ideal',
        },
      });

      return {
        paymentId: payment.id,
        checkoutUrl,
        status: isAutoCheckout ? finalStatus : payment.status,
        method: isAutoCheckout ? 'SEPA Direct Debit (iDEAL mandate)' : paymentParams.method || 'ideal',
        amount: `€${amount.toFixed(2)}`,
        autoCheckout: isAutoCheckout,
        isFirstPayment,
        message: isAutoCheckout
          ? `Betaling automatisch verwerkt via SEPA Direct Debit (iDEAL mandate)! Status: ${finalStatus}. Geen checkout nodig.`
          : isFirstPayment
          ? `Eerste betaling met auto-checkout — klik op de checkout link. Na deze betaling gaan alle volgende betalingen automatisch via SEPA Direct Debit.`
          : checkoutUrl
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
  setupCustomerProfile,
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
    system: `Je bent de Payment Agent. Je verwerkt betalingen via Mollie en ondersteunt zowel handmatige als automatische checkout.

Je werkwijze:
1. Als de gebruiker auto-checkout wil: gebruik setupCustomerProfile om een Mollie klantprofiel aan te maken
2. Maak een Mollie betaling aan met createMolliePayment (vereist een AP2 Payment Mandate ID)
   - Als auto-checkout actief is met een geldige mandate: betaling gaat automatisch (geen checkout URL)
   - Als het de eerste betaling is met auto-checkout: gebruiker doorloopt checkout (mandate wordt vastgelegd)
   - Zonder auto-checkout: standaard handmatige flow met checkout URL
3. Check de status met checkPaymentStatus als gevraagd
4. Genereer een receipt na succesvolle betaling

BELANGRIJK:
- Gebruik ALTIJD de Payment Mandate ID die je ontvangt
- Bij auto-checkout: meld dat de betaling automatisch verwerkt wordt via SEPA Direct Debit
- Recurring betalingen gaan ALTIJD via SEPA Direct Debit, ook als de eerste betaling via iDEAL was. Dit is by design van Mollie — iDEAL mandates worden SEPA mandates.
- Bij eerste betaling met auto-checkout: leg uit dat dit de LAATSTE keer is dat ze handmatig moeten betalen, en dat volgende betalingen via SEPA gaan
- Bij handmatige checkout: geef de checkout URL duidelijk weer
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
