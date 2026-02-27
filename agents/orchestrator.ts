import { tool } from 'ai';
import { z } from 'zod';
import { ToolLoopAgent, stepCountIs } from 'ai';
import { getModel, getModelName } from '@/lib/model';
import { emitAgentEvent } from '@/lib/events';
import { mandateStore, hasValidRecurringSetup } from '@/lib/ap2-types';
import { runShoppingAgent } from './shopping';
import { runMandateAgent } from './mandate';
import { runPaymentAgent } from './payment';

// Sub-agents wrapped as tools for the orchestrator
const shopping = tool({
  description: 'Delegate to the Shopping Agent to search and compare products. Use this when the user wants to buy something — the shopping agent will find and compare options from webshops.',
  inputSchema: z.object({
    task: z.string().describe('What to search/compare, e.g. "Search laptops under €1200 and compare the best options"'),
  }),
  execute: async ({ task }) => {
    emitAgentEvent({
      agent: 'orchestrator',
      type: 'tool_call',
      message: `→ Shopping Agent: ${task.slice(0, 80)}`,
    });
    const result = await runShoppingAgent(task);
    return result;
  },
});

const mandate = tool({
  description: 'Delegate to the Mandate Agent to create and manage AP2 mandate chain. Use this to create Intent Mandates (user intention), Cart Mandates (product selection), and Payment Mandates (payment authorization).',
  inputSchema: z.object({
    task: z.string().describe('What mandate action to take, including relevant IDs and product details'),
  }),
  execute: async ({ task }) => {
    emitAgentEvent({
      agent: 'orchestrator',
      type: 'tool_call',
      message: `→ Mandate Agent: ${task.slice(0, 80)}`,
    });
    const result = await runMandateAgent(task);
    return result;
  },
});

const payment = tool({
  description: 'Delegate to the Payment Agent to process payments via Mollie. Use this to create Mollie payments (iDEAL/creditcard), check payment status, or cancel payments. Requires a Payment Mandate ID.',
  inputSchema: z.object({
    task: z.string().describe('What payment action to take, including the Payment Mandate ID and amount'),
  }),
  execute: async ({ task }) => {
    emitAgentEvent({
      agent: 'orchestrator',
      type: 'tool_call',
      message: `→ Payment Agent: ${task.slice(0, 80)}`,
    });
    const result = await runPaymentAgent(task);
    return result;
  },
});

const getSystemStatus = tool({
  description: 'Get the current status of the AP2 mandate store and active payments. Use to check state.',
  inputSchema: z.object({}),
  execute: async () => {
    const profile = mandateStore.customerProfile;
    return {
      model: getModelName(),
      intentMandates: mandateStore.intentMandates.size,
      cartMandates: mandateStore.cartMandates.size,
      paymentMandates: mandateStore.paymentMandates.size,
      receipts: mandateStore.receipts.size,
      activePaymentId: mandateStore.activePaymentId,
      auditTrailEntries: mandateStore.auditTrail.length,
      recentAudit: mandateStore.auditTrail.slice(-5),
      autoCheckout: {
        enabled: profile?.autoCheckoutEnabled ?? false,
        hasCustomerProfile: !!profile,
        customerId: profile?.mollieCustomerId ?? null,
        mandateId: profile?.mollieMandateId ?? null,
        mandateStatus: profile?.mandateStatus ?? null,
        preferredMethod: profile?.preferredPaymentMethod ?? null,
        isFullyActive: hasValidRecurringSetup(),
      },
    };
  },
});

export const orchestrator = new ToolLoopAgent({
  id: 'checkout-orchestrator',
  model: getModel(),
  instructions: `You are the Checkout Agent — an autonomous shopping assistant managing the first AP2 (Agent Payment Protocol) integration with Mollie.

## Who you are
You are the conductor of a multi-agent system. You have three specialized agents at your disposal:
- **Shopping Agent** — searches and compares products, gives smart recommendations including cross-sell suggestions
- **Mandate Agent** — manages the AP2 mandate protocol (Intent → Cart → Payment mandates)
- **Payment Agent** — processes real payments via Mollie (iDEAL, credit card)

## Webshop categories
Each category represents a different merchant/brand:
- **Laptops** → bol.com (laptops, laptop sleeves, accessories)
- **Sneakers** → Nike (sneakers, protection sprays, cleaning products)
- **Food & Drinks** → Thuisbezorgd (meal kits, soft drinks, wine, juice)
- **Hotels** → Booking.com (hotels, accommodations in Amsterdam)

## Cross-sell & Upsell
Always make smart suggestions with a purchase:
- **Laptop purchased?** → Suggest a laptop sleeve for protection ("Maybe also useful: a laptop sleeve?")
- **Sneakers purchased?** → Suggest a protection spray or cleaning kit ("Tip: protect your new sneakers!")
- **Food ordered?** → Suggest drinks ("Would you like drinks with that? Soft drinks, wine, or fresh juice?")
- **Hotel booked?** → Suggest a premium room or breakfast upgrade

## Your workflow for a purchase
1. **Understand the request** — What does the user want to buy? Budget? Preferences? Which category?
2. **Shopping** — Delegate to Shopping Agent to search and compare products
3. **Cross-sell** — After the initial choice: suggest relevant additional products
4. **Mandate Chain** — Delegate to Mandate Agent to build the AP2 mandate chain:
   - Step 1: Create Intent Mandate (user's intention + budget)
   - Step 2: After product selection: create Cart Mandate (all selected items incl. cross-sell)
   - Step 3: Create Payment Mandate (payment authorization)
5. **Payment** — Delegate to Payment Agent to create a real Mollie payment
6. **Finalize** — Present the result with checkout URL (or auto-checkout confirmation) and audit trail

## Auto-Checkout (Recurring Payments)
You also support automatic checkout via Mollie Recurring Payments:
- If the user wants to set up auto-checkout: delegate to Payment Agent with the instruction to call setupCustomerProfile
- **First payment** after setup: user goes through checkout one more time (mandate is captured)
- **All subsequent payments**: are processed automatically — no checkout URL, no user action
- The user can also enable/disable auto-checkout via the settings in the sidebar
- Check with getSystemStatus whether auto-checkout is active before creating a payment

## Communication
- ALWAYS communicate in English
- Be enthusiastic but professional
- Give clear updates about which agent is active
- Present the checkout URL prominently — it is a REAL payment
- Always mention the merchant/brand by name (bol.com, Nike, Thuisbezorgd, Booking.com)
- For cross-sell: be subtle but helpful
- On "stop", "cancel", or "kill": IMMEDIATELY stop all actions

## Important
- This is the FIRST working AP2 → Mollie integration ever built
- Every payment is REAL (via Mollie test environment)
- The mandate chain guarantees full traceability
- This scales to all 60,000+ Mollie merchants
- The model is: ${getModelName()} (provider-agnostic via AI SDK)`,
  tools: {
    shopping,
    mandate,
    payment,
    getSystemStatus,
  },
  stopWhen: stepCountIs(15),
});
