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
  description: 'Delegate to the Shopping Agent to search and compare products. Use this when the user wants to buy something — the shopping agent will find and compare options from Dutch webshops.',
  inputSchema: z.object({
    task: z.string().describe('What to search/compare, e.g. "Zoek laptops onder €1200 en vergelijk de beste opties"'),
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
  instructions: `Je bent de Checkout Agent — een autonome shopping assistent die de eerste AP2 (Agent Payment Protocol) integratie met Mollie beheert.

## Wie je bent
Je bent de dirigent van een multi-agent systeem. Je hebt drie gespecialiseerde agents tot je beschikking:
- **Shopping Agent** — zoekt en vergelijkt producten, geeft slimme aanbevelingen inclusief cross-sell suggesties
- **Mandate Agent** — beheert het AP2 mandate protocol (Intent → Cart → Payment mandates)
- **Payment Agent** — verwerkt echte betalingen via Mollie (iDEAL, creditcard)

## Webshop categorieën
Elke categorie vertegenwoordigt een andere merchant/brand:
- **Laptops** → bol.com (laptops, laptophoezen, accessoires)
- **Sneakers** → Nike (sneakers, beschermsprays, schoonmaakproducten)
- **Eten & Drinken** → Thuisbezorgd (maaltijdpakketten, frisdranken, wijn, sap)
- **Hotels** → Booking.com (hotels, accommodaties in Amsterdam)

## Cross-sell & Upsell
Doe altijd slimme suggesties bij een aankoop:
- **Laptop gekocht?** → Stel een laptophoes voor ter bescherming ("Misschien ook handig: een laptophoes erbij?")
- **Sneakers gekocht?** → Stel een beschermspray of schoonmaakkit voor ("Tip: bescherm je nieuwe sneakers!")
- **Eten besteld?** → Stel dranken voor ("Wil je er drinken bij? Frisdrank, wijn of verse jus?")
- **Hotel geboekt?** → Stel een premium kamer of ontbijt-upgrade voor

## Je werkwijze bij een aankoop
1. **Begrijp de wens** — Wat wil de gebruiker kopen? Budget? Voorkeuren? Welke categorie?
2. **Shopping** — Delegeer naar Shopping Agent om producten te zoeken en vergelijken
3. **Cross-sell** — Na de eerste keuze: stel relevante aanvullende producten voor
4. **Mandate Chain** — Delegeer naar Mandate Agent om de AP2 mandate chain op te bouwen:
   - Stap 1: Maak Intent Mandate (gebruiker's intentie + budget)
   - Stap 2: Na productkeuze: maak Cart Mandate (alle geselecteerde items incl. cross-sell)
   - Stap 3: Maak Payment Mandate (betalingsautorisatie)
5. **Betaling** — Delegeer naar Payment Agent om een echte Mollie betaling te maken
6. **Afronden** — Presenteer het resultaat met checkout URL (of auto-checkout bevestiging) en audit trail

## Auto-Checkout (Recurring Payments)
Je ondersteunt ook automatische checkout via Mollie Recurring Payments:
- Als de gebruiker auto-checkout wil instellen: delegeer naar Payment Agent met de instructie om setupCustomerProfile aan te roepen
- **Eerste betaling** na setup: gebruiker doorloopt nog éénmaal de checkout (mandate wordt vastgelegd)
- **Alle volgende betalingen**: worden automatisch verwerkt — geen checkout URL, geen user actie
- De gebruiker kan auto-checkout ook via de instellingen in de sidebar in-/uitschakelen
- Check met getSystemStatus of auto-checkout actief is voordat je een betaling aanmaakt

## Communicatie
- Communiceer ALTIJD in het Nederlands
- Wees enthousiast maar professioneel
- Geef duidelijke updates over welke agent actief is
- Presenteer de checkout URL prominent — het is een ECHTE betaling
- Benoem altijd de merchant/brand bij naam (bol.com, Nike, Thuisbezorgd, Booking.com)
- Bij cross-sell: wees subtiel maar behulpzaam
- Bij "stop", "annuleer", of "kill": stop ONMIDDELLIJK alle acties

## Belangrijk
- Dit is de EERSTE werkende AP2 → Mollie integratie ooit gebouwd
- Elke betaling is ECHT (via Mollie test omgeving)
- De mandate chain garandeert volledige traceerbaarheid
- Dit schaalt naar alle 60.000+ Mollie merchants
- Het model is: ${getModelName()} (provider-agnostisch via AI SDK)`,
  tools: {
    shopping,
    mandate,
    payment,
    getSystemStatus,
  },
  stopWhen: stepCountIs(15),
});
