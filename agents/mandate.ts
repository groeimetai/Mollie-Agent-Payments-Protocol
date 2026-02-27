import { tool, generateText, stepCountIs } from 'ai';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { SignJWT, jwtVerify } from 'jose';
import { getModel } from '@/lib/model';
import { emitAgentEvent } from '@/lib/events';
import {
  mandateStore,
  addAuditEntry,
  type IntentMandate,
  type CartMandate,
  type PaymentMandate,
} from '@/lib/ap2-types';

// JWT signing secret — must be set in environment
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

const JWT_SECRET = /* lazy */ {
  get value() {
    return getJwtSecret();
  },
};

const createIntentMandate = tool({
  description: 'Create an AP2 Intent Mandate from the user\'s purchase intention. This is the first step in the AP2 mandate chain.',
  inputSchema: z.object({
    description: z.string().describe('What the user wants to buy, e.g. "Laptop onder €1200"'),
    maxBudget: z.number().describe('Maximum budget in EUR'),
    category: z.string().optional().describe('Product category'),
    expirationMinutes: z.number().optional().describe('How long the mandate is valid (default: 60 minutes)'),
  }),
  execute: async ({ description, maxBudget, category, expirationMinutes }) => {
    emitAgentEvent({
      agent: 'mandate',
      type: 'tool_call',
      message: `Creating Intent Mandate: "${description}" (max €${maxBudget})`,
    });

    const mandate: IntentMandate = {
      id: `intent_${uuidv4()}`,
      description,
      maxBudget,
      currency: 'EUR',
      category,
      expiration: new Date(
        Date.now() + (expirationMinutes || 60) * 60 * 1000
      ).toISOString(),
      userConfirmation: true,
      createdAt: new Date().toISOString(),
    };

    mandateStore.intentMandates.set(mandate.id, mandate);

    addAuditEntry({
      agent: 'MandateAgent',
      action: 'CREATE_INTENT_MANDATE',
      details: `Intent mandate created: ${description} (max €${maxBudget})`,
      mandateId: mandate.id,
    });

    emitAgentEvent({
      agent: 'mandate',
      type: 'result',
      message: `Intent Mandate created: ${mandate.id}`,
      data: { mandateId: mandate.id },
    });

    return {
      mandateId: mandate.id,
      type: 'IntentMandate',
      description: mandate.description,
      maxBudget: mandate.maxBudget,
      currency: mandate.currency,
      expiration: mandate.expiration,
      status: 'active',
    };
  },
});

const createCartMandate = tool({
  description: 'Create an AP2 Cart Mandate after a product is selected. Links to an Intent Mandate and includes the merchant cart with JWT signature.',
  inputSchema: z.object({
    intentMandateId: z.string().describe('The Intent Mandate ID to link to'),
    items: z.array(z.object({
      name: z.string(),
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      vendor: z.string(),
      url: z.string().optional(),
    })).describe('Cart items'),
  }),
  execute: async ({ intentMandateId, items }) => {
    emitAgentEvent({
      agent: 'mandate',
      type: 'tool_call',
      message: `Creating Cart Mandate for ${items.length} item(s)`,
    });

    // Verify intent mandate exists
    const intentMandate = mandateStore.intentMandates.get(intentMandateId);
    if (!intentMandate) {
      return { error: `Intent Mandate ${intentMandateId} not found` };
    }

    // Check expiration
    if (new Date(intentMandate.expiration) < new Date()) {
      return { error: 'Intent Mandate has expired' };
    }

    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // Check budget
    if (total > intentMandate.maxBudget) {
      return {
        error: `Total €${total.toFixed(2)} exceeds budget of €${intentMandate.maxBudget.toFixed(2)}`,
      };
    }

    // Sign the cart with JWT
    const signature = await new SignJWT({
      intentMandateId,
      items,
      total,
      currency: 'EUR',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET.value);

    const cartMandate: CartMandate = {
      id: `cart_${uuidv4()}`,
      intentMandateId,
      items: items.map((item) => ({
        ...item,
        currency: 'EUR',
      })),
      total: { amount: total, currency: 'EUR' },
      merchantSignature: signature,
      createdAt: new Date().toISOString(),
    };

    mandateStore.cartMandates.set(cartMandate.id, cartMandate);

    addAuditEntry({
      agent: 'MandateAgent',
      action: 'CREATE_CART_MANDATE',
      details: `Cart mandate created: ${items.length} item(s), total €${total.toFixed(2)}`,
      mandateId: cartMandate.id,
    });

    emitAgentEvent({
      agent: 'mandate',
      type: 'result',
      message: `Cart Mandate created: ${cartMandate.id} (€${total.toFixed(2)})`,
      data: { mandateId: cartMandate.id, total },
    });

    return {
      mandateId: cartMandate.id,
      type: 'CartMandate',
      intentMandateId,
      items: cartMandate.items,
      total: cartMandate.total,
      signed: true,
      signaturePreview: signature.slice(0, 20) + '...',
      status: 'active',
    };
  },
});

const createPaymentMandate = tool({
  description: 'Create an AP2 Payment Mandate — the final authorization step before payment. Links to a Cart Mandate.',
  inputSchema: z.object({
    cartMandateId: z.string().describe('The Cart Mandate ID to link to'),
    paymentMethod: z.enum(['ideal', 'creditcard', 'bancontact']).describe('Payment method to use'),
  }),
  execute: async ({ cartMandateId, paymentMethod }) => {
    emitAgentEvent({
      agent: 'mandate',
      type: 'tool_call',
      message: `Creating Payment Mandate (${paymentMethod})`,
    });

    const cartMandate = mandateStore.cartMandates.get(cartMandateId);
    if (!cartMandate) {
      return { error: `Cart Mandate ${cartMandateId} not found` };
    }

    // Verify cart mandate signature
    try {
      await jwtVerify(cartMandate.merchantSignature, JWT_SECRET.value);
    } catch {
      return { error: 'Cart Mandate signature invalid — possible tampering' };
    }

    // Create user authorization token
    const authorization = await new SignJWT({
      cartMandateId,
      amount: cartMandate.total.amount,
      currency: cartMandate.total.currency,
      paymentMethod,
      authorizedAt: new Date().toISOString(),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30m')
      .sign(JWT_SECRET.value);

    const paymentMandate: PaymentMandate = {
      id: `pay_${uuidv4()}`,
      cartMandateId,
      amount: {
        value: cartMandate.total.amount,
        currency: cartMandate.total.currency,
      },
      paymentMethod,
      userAuthorization: authorization,
      timestamp: new Date().toISOString(),
    };

    mandateStore.paymentMandates.set(paymentMandate.id, paymentMandate);

    addAuditEntry({
      agent: 'MandateAgent',
      action: 'CREATE_PAYMENT_MANDATE',
      details: `Payment mandate created: €${cartMandate.total.amount.toFixed(2)} via ${paymentMethod}`,
      mandateId: paymentMandate.id,
    });

    emitAgentEvent({
      agent: 'mandate',
      type: 'result',
      message: `Payment Mandate created: ${paymentMandate.id}`,
      data: { mandateId: paymentMandate.id },
    });

    return {
      mandateId: paymentMandate.id,
      type: 'PaymentMandate',
      cartMandateId,
      amount: paymentMandate.amount,
      paymentMethod,
      authorized: true,
      authorizationPreview: authorization.slice(0, 20) + '...',
      status: 'ready_for_payment',
    };
  },
});

const validateMandateChain = tool({
  description: 'Validate the entire AP2 mandate chain integrity — checks signatures and links between Intent → Cart → Payment mandates.',
  inputSchema: z.object({
    paymentMandateId: z.string().describe('The Payment Mandate ID to validate the chain for'),
  }),
  execute: async ({ paymentMandateId }) => {
    emitAgentEvent({
      agent: 'mandate',
      type: 'tool_call',
      message: 'Validating mandate chain...',
    });

    const paymentMandate = mandateStore.paymentMandates.get(paymentMandateId);
    if (!paymentMandate) {
      return { valid: false, error: 'Payment Mandate not found' };
    }

    const cartMandate = mandateStore.cartMandates.get(paymentMandate.cartMandateId);
    if (!cartMandate) {
      return { valid: false, error: 'Cart Mandate not found in chain' };
    }

    const intentMandate = mandateStore.intentMandates.get(cartMandate.intentMandateId);
    if (!intentMandate) {
      return { valid: false, error: 'Intent Mandate not found in chain' };
    }

    // Verify signatures
    try {
      await jwtVerify(cartMandate.merchantSignature, JWT_SECRET.value);
    } catch {
      return { valid: false, error: 'Cart Mandate signature invalid' };
    }

    try {
      await jwtVerify(paymentMandate.userAuthorization, JWT_SECRET.value);
    } catch {
      return { valid: false, error: 'Payment Mandate authorization invalid' };
    }

    // Budget check
    if (cartMandate.total.amount > intentMandate.maxBudget) {
      return { valid: false, error: 'Amount exceeds budget' };
    }

    emitAgentEvent({
      agent: 'mandate',
      type: 'result',
      message: 'Mandate chain valid!',
    });

    return {
      valid: true,
      chain: {
        intentMandate: {
          id: intentMandate.id,
          description: intentMandate.description,
          maxBudget: intentMandate.maxBudget,
        },
        cartMandate: {
          id: cartMandate.id,
          itemCount: cartMandate.items.length,
          total: cartMandate.total,
          signatureValid: true,
        },
        paymentMandate: {
          id: paymentMandate.id,
          amount: paymentMandate.amount,
          method: paymentMandate.paymentMethod,
          authorizationValid: true,
        },
      },
      auditTrail: mandateStore.auditTrail.filter(
        (e) =>
          e.mandateId === intentMandate.id ||
          e.mandateId === cartMandate.id ||
          e.mandateId === paymentMandate.id
      ),
    };
  },
});

export const mandateTools = {
  createIntentMandate,
  createCartMandate,
  createPaymentMandate,
  validateMandateChain,
};

export async function runMandateAgent(prompt: string): Promise<string> {
  emitAgentEvent({
    agent: 'mandate',
    type: 'start',
    message: 'Mandate Agent activated',
  });

  const result = await generateText({
    model: getModel(),
    system: `You are the Mandate Agent. You manage the AP2 (Agent Payment Protocol) mandate system.

The AP2 protocol works with three layers of mandates:
1. Intent Mandate — capturing the user's purchase intention and budget
2. Cart Mandate — capturing the selected products with JWT-signed confirmation
3. Payment Mandate — payment authorization for the payment provider

Your workflow:
1. Create an Intent Mandate for the user's request
2. After product selection: create a Cart Mandate with the items
3. Create a Payment Mandate as authorization for payment
4. Validate the entire mandate chain

Communicate in English. Always return the mandate IDs.`,
    tools: mandateTools,
    stopWhen: stepCountIs(8),
    prompt,
  });

  emitAgentEvent({
    agent: 'mandate',
    type: 'complete',
    message: 'Mandate Agent done',
  });

  return result.text;
}
