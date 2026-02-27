import { NextResponse } from 'next/server';
import { mollieClient } from '@/lib/mollie';
import { mandateStore, addAuditEntry, DEMO_CUSTOMER, hasValidRecurringSetup } from '@/lib/ap2-types';
import { emitAgentEvent } from '@/lib/events';

export async function GET() {
  const profile = mandateStore.customerProfile;
  return NextResponse.json({
    enabled: profile?.autoCheckoutEnabled ?? false,
    hasProfile: !!profile,
    hasMollieMandate: !!profile?.mollieMandateId,
    mandateId: profile?.mollieMandateId ?? null,
    mandateStatus: profile?.mandateStatus ?? null,
    preferredMethod: profile?.preferredPaymentMethod ?? null,
    customerId: profile?.mollieCustomerId ?? null,
    isFullyActive: hasValidRecurringSetup(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, method } = body;

    if (action === 'toggle') {
      if (!mandateStore.customerProfile) {
        return NextResponse.json({ error: 'Geen klantprofiel. Gebruik action: "setup" eerst.' }, { status: 400 });
      }
      mandateStore.customerProfile.autoCheckoutEnabled = !mandateStore.customerProfile.autoCheckoutEnabled;
      mandateStore.customerProfile.updatedAt = new Date().toISOString();

      addAuditEntry({
        agent: 'Settings',
        action: 'TOGGLE_AUTO_CHECKOUT',
        details: `Auto-checkout ${mandateStore.customerProfile.autoCheckoutEnabled ? 'ingeschakeld' : 'uitgeschakeld'}`,
      });

      emitAgentEvent({
        agent: 'payment',
        type: 'result',
        message: `Auto-checkout ${mandateStore.customerProfile.autoCheckoutEnabled ? 'ingeschakeld' : 'uitgeschakeld'}`,
        data: { autoCheckoutEnabled: mandateStore.customerProfile.autoCheckoutEnabled },
      });

      return NextResponse.json({
        enabled: mandateStore.customerProfile.autoCheckoutEnabled,
        isFullyActive: hasValidRecurringSetup(),
      });
    }

    if (action === 'setMethod') {
      if (!mandateStore.customerProfile) {
        return NextResponse.json({ error: 'Geen klantprofiel.' }, { status: 400 });
      }
      if (!['ideal', 'creditcard', 'bancontact'].includes(method)) {
        return NextResponse.json({ error: 'Ongeldige betaalmethode.' }, { status: 400 });
      }
      mandateStore.customerProfile.preferredPaymentMethod = method;
      mandateStore.customerProfile.updatedAt = new Date().toISOString();

      return NextResponse.json({
        preferredMethod: method,
      });
    }

    if (action === 'setup') {
      const preferredMethod = method || 'ideal';
      if (!['ideal', 'creditcard', 'bancontact'].includes(preferredMethod)) {
        return NextResponse.json({ error: 'Ongeldige betaalmethode.' }, { status: 400 });
      }

      // If profile already exists, just enable
      if (mandateStore.customerProfile) {
        mandateStore.customerProfile.autoCheckoutEnabled = true;
        mandateStore.customerProfile.preferredPaymentMethod = preferredMethod;
        mandateStore.customerProfile.updatedAt = new Date().toISOString();

        return NextResponse.json({
          enabled: true,
          customerId: mandateStore.customerProfile.mollieCustomerId,
          isFullyActive: hasValidRecurringSetup(),
        });
      }

      // Create Mollie customer
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
        agent: 'Settings',
        action: 'SETUP_AUTO_CHECKOUT',
        details: `Klantprofiel aangemaakt via settings: ${customer.id} — methode: ${preferredMethod}`,
      });

      emitAgentEvent({
        agent: 'payment',
        type: 'result',
        message: `Auto-checkout ingesteld: ${customer.id}`,
        data: { customerId: customer.id, autoCheckout: true },
      });

      return NextResponse.json({
        enabled: true,
        customerId: customer.id,
        preferredMethod,
        isFullyActive: false,
      });
    }

    return NextResponse.json({ error: 'Onbekende actie.' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Auto-checkout error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
