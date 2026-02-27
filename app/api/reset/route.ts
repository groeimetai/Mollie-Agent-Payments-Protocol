import { clearEvents } from '@/lib/events';
import { mandateStore } from '@/lib/ap2-types';

export async function POST() {
  // Clear all events
  clearEvents();

  // Reset mandate store
  mandateStore.intentMandates.clear();
  mandateStore.cartMandates.clear();
  mandateStore.paymentMandates.clear();
  mandateStore.receipts.clear();
  mandateStore.auditTrail.length = 0;
  mandateStore.activePaymentId = null;
  mandateStore.customerProfile = null;

  return Response.json({ ok: true, message: 'Server state reset' });
}
