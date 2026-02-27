// AP2 (Agent Payment Protocol) Types
// Based on Google's AP2 open standard for agentic payments

export interface IntentMandate {
  id: string;
  description: string;
  maxBudget: number;
  currency: string;
  category?: string;
  expiration: string; // ISO timestamp
  userConfirmation: boolean;
  createdAt: string;
}

export interface CartItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  vendor: string;
  url?: string;
}

export interface CartMandate {
  id: string;
  intentMandateId: string;
  items: CartItem[];
  total: { amount: number; currency: string };
  merchantSignature: string; // JWT
  createdAt: string;
}

export interface PaymentMandate {
  id: string;
  cartMandateId: string;
  amount: { value: number; currency: string };
  paymentMethod: 'ideal' | 'creditcard' | 'bancontact';
  userAuthorization: string; // Signed mandate proof
  timestamp: string;
}

export interface AuditEntry {
  timestamp: string;
  agent: string;
  action: string;
  details: string;
  mandateId?: string;
}

export interface PaymentReceipt {
  mandateId: string;
  molliePaymentId: string; // Real tr_xxxxx ID
  amount: { value: number; currency: string };
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  auditTrail: AuditEntry[];
}

// Auto-checkout / Mollie Recurring types
export interface CustomerProfile {
  mollieCustomerId: string;
  name: string;
  email: string;
  preferredPaymentMethod: 'ideal' | 'creditcard' | 'bancontact';
  mollieMandateId: string | null;
  mandateStatus: 'pending' | 'valid' | 'invalid' | null;
  autoCheckoutEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEMO_CUSTOMER = {
  name: 'Niels van der Werf',
  email: 'niels@ap2-demo.nl',
};

// In-memory store for mandate chain (single session)
export interface MandateStore {
  intentMandates: Map<string, IntentMandate>;
  cartMandates: Map<string, CartMandate>;
  paymentMandates: Map<string, PaymentMandate>;
  receipts: Map<string, PaymentReceipt>;
  auditTrail: AuditEntry[];
  activePaymentId: string | null; // Current Mollie payment ID for kill switch
  customerProfile: CustomerProfile | null;
}

// Global singleton store
export const mandateStore: MandateStore = {
  intentMandates: new Map(),
  cartMandates: new Map(),
  paymentMandates: new Map(),
  receipts: new Map(),
  auditTrail: [],
  activePaymentId: null,
  customerProfile: null,
};

export function hasValidRecurringSetup(): boolean {
  const profile = mandateStore.customerProfile;
  return !!(
    profile &&
    profile.mollieCustomerId &&
    profile.mollieMandateId &&
    profile.mandateStatus === 'valid' &&
    profile.autoCheckoutEnabled
  );
}

export function addAuditEntry(entry: Omit<AuditEntry, 'timestamp'>) {
  const fullEntry: AuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  mandateStore.auditTrail.push(fullEntry);
  return fullEntry;
}
