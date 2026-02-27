# AP2 + Mollie: Van Hackathon naar Product

## Wat we hebben gebouwd

### De eerste werkende AP2 → Mollie integratie

Wij hebben de eerste werkende implementatie van Google's Agent Payment Protocol (AP2) gebouwd die daadwerkelijk betalingen verwerkt via een echte payment provider: Mollie.

**Werkende componenten:**

| Component | Status | Beschrijving |
|---|---|---|
| AP2 Mandate Chain | ✅ Compleet | Intent → Cart → Payment mandates met JWT signing |
| Multi-Agent Systeem | ✅ Compleet | CFO Orchestrator + Shopping/Mandate/Payment agents |
| Mollie iDEAL Betaling | ✅ Compleet | Echte betalingen via Mollie test API |
| Webhook Verificatie | ✅ Compleet | Server-side payment status verificatie |
| Cryptografische Autorisatie | ✅ Compleet | JWT-signed mandate chain voor audit trail |
| Kill Switch | ✅ Compleet | Directe annulering van lopende betalingen |
| Multi-Category Shopping | ✅ Compleet | Electronics, Fashion, Boodschappen, Reizen |
| Provider-Agnostisch | ✅ Compleet | Claude, GPT-4, Gemini met één regel code |
| Real-time Dashboard | ✅ Compleet | Live agent activiteit + payment status |

**Tech stack:**
- Next.js 16 + AI SDK 6 (Vercel) — standaard voor AI app development
- @mollie/api-client — officiële Mollie SDK
- jose (JWT) — cryptografische mandate signing
- Deployed op Google Cloud Run (europe-west1)

---

## Het businessmodel

```
Consumer AI Agent (jouw CFO agent)
    ↓ "koop laptop onder €1200"
    ↓ via AP2 protocol
Merchant Agent (Bol.com, Zalando, Albert Heijn — powered by Mollie AP2)
    ↓ betaling via iDEAL/creditcard
Mollie int transactiekosten
    ↓ settlement
Merchant krijgt het geld
```

**Mollie verdient per transactie.** Hoe meer AI agents autonoom aankopen doen bij merchants, hoe meer volume er door Mollie stroomt. AP2 maakt dit mogelijk op een gestandaardiseerde, veilige manier.

**De kernpitch:**
> Jullie hebben 60.000+ merchants op jullie platform. Wij geven elk van die merchants een AP2-compatibele agent waarmee AI assistenten van consumenten direct kunnen kopen — zonder checkout friction, zonder verlaten winkelwagens, met cryptografisch bewijs van autorisatie. Elke AI agent die ooit een aankoop doet, doet dat via Mollie.

---

## Wat er nog bij moet komen

### Fase 1: Merchant SDK (3-6 maanden)

**Doel:** Mollie merchants kunnen AP2-compatible worden met minimale integratie-effort.

| Component | Prioriteit | Beschrijving |
|---|---|---|
| `@mollie/ap2-sdk` | 🔴 Kritiek | NPM package dat merchants in <10 regels code AP2-compatible maakt |
| Merchant Agent Template | 🔴 Kritiek | Plug-and-play agent die merchants kunnen deployen |
| AP2 Mandate Verification API | 🔴 Kritiek | Mollie-hosted endpoint voor mandate chain verificatie |
| Product Catalog Connector | 🟡 Belangrijk | Standaard interface voor merchant productdata |
| Mollie Dashboard AP2 Tab | 🟡 Belangrijk | AP2 transacties zichtbaar in bestaand Mollie dashboard |
| Rate Limiting & Fraud Detection | 🟡 Belangrijk | Agent-specifieke limieten en anomalie detectie |

**Merchant integratie zou er zo uitzien:**
```typescript
import { MollieAP2 } from '@mollie/ap2-sdk';

const ap2 = new MollieAP2({
  mollieApiKey: 'live_...',
  productCatalog: myProductAPI,  // Eigen product API
  mandatePolicy: {
    maxAmount: 5000,             // Maximaal bedrag per mandate
    allowedCategories: ['electronics'],
    requireUserConfirmation: true,
  },
});

// Dat is het. De SDK handelt de rest af:
// - Mandate verificatie
// - Payment creatie
// - Webhook handling
// - Audit trail
```

### Fase 2: Consumer Agent Protocol (6-12 maanden)

**Doel:** Elke AI assistant (ChatGPT, Claude, Gemini, Siri) kan via AP2 betalen bij Mollie merchants.

| Component | Prioriteit | Beschrijving |
|---|---|---|
| AP2 Discovery Protocol | 🔴 Kritiek | Agents ontdekken AP2-compatible merchants (DNS/well-known) |
| Agent Identity & Trust | 🔴 Kritiek | Hoe weet een merchant dat een agent namens een echte gebruiker handelt? |
| Multi-PSP Routing | 🟡 Belangrijk | AP2 mandates die naar de juiste PSP routen (Mollie first) |
| Consumer Agent SDK | 🟡 Belangrijk | SDK waarmee AI apps (ChatGPT plugins, etc.) AP2 mandates maken |
| Cross-border Payments | 🟢 Nice-to-have | AP2 mandates met multi-currency support |

### Fase 3: Platform & Ecosystem (12-24 maanden)

**Doel:** AP2 via Mollie wordt de standaard voor agentic commerce.

| Component | Prioriteit | Beschrijving |
|---|---|---|
| Mollie AP2 Marketplace | 🟡 Belangrijk | Directory van AP2-compatible merchants |
| Agent Analytics Dashboard | 🟡 Belangrijk | Insights voor merchants: welke agents kopen wat? |
| Recurring AP2 Mandates | 🟡 Belangrijk | Subscriptions en herhaalaankopen via agents |
| B2B Agent Procurement | 🟢 Nice-to-have | Bedrijven die inkoop delegeren aan agents |
| Open Banking Integratie | 🟢 Nice-to-have | PSD2/PSD3 compliance voor agent-initiated payments |

---

## Benodigde integraties met platformen

### Merchant-side (aanbod)

| Platform | Type integratie | Impact |
|---|---|---|
| **Shopify** | App/plugin die AP2 endpoint toevoegt aan Shopify stores | Duizenden NL Mollie-Shopify merchants direct AP2-compatible |
| **WooCommerce** | WordPress plugin met AP2 support | Grootste e-commerce CMS in NL |
| **Magento/Adobe Commerce** | Extension voor AP2 mandate handling | Enterprise merchants |
| **Lightspeed** | POS + e-commerce AP2 integratie | Benelux marktleider |
| **Bol.com Partner API** | AP2 laag bovenop bestaande partner API | Grootste NL marketplace |
| **Thuisbezorgd/Just Eat** | AP2 voor food ordering agents | Hoog-frequente, lage-waarde transacties |

### Consumer-side (vraag)

| Platform | Type integratie | Impact |
|---|---|---|
| **OpenAI (ChatGPT)** | GPT Action / Plugin met AP2 mandate support | 200M+ gebruikers met koopintentie |
| **Anthropic (Claude)** | MCP Server voor AP2 payments via Mollie | Claude kan direct aankopen doen |
| **Google (Gemini)** | Native AP2 support (Google is AP2 auteur) | Diepste integratie mogelijk |
| **Apple (Siri/Apple Intelligence)** | AP2 via Apple Pay + Mollie | Premium gebruikers, hoge conversie |
| **Banking Apps (ING, Rabo, ABN)** | AI assistant in banking app met AP2 | Direct gekoppeld aan betaalrekening |
| **Comparison Sites (Tweakers, Kieskeurig)** | Agent die zoekt + direct koopt | Van vergelijken naar kopen in één stap |

### Infra & Compliance

| Component | Noodzaak | Toelichting |
|---|---|---|
| **PSD2/PSD3 Compliance** | 🔴 Verplicht | Strong Customer Authentication (SCA) voor agent-initiated payments |
| **DNB Toezicht** | 🔴 Verplicht | Regulatoire goedkeuring voor autonome betalingen |
| **GDPR/AVG** | 🔴 Verplicht | Privacy-by-design voor agent purchase history |
| **3D Secure 2.0** | 🟡 Belangrijk | Fraud prevention voor agent transactions |
| **ISO 20022** | 🟢 Nice-to-have | Interoperabiliteit met banking messaging standaard |

---

## Marktpotentieel

### Het abandoned cart probleem

| Metric | Waarde | Bron |
|---|---|---|
| Abandoned cart rate (gemiddeld) | ~70% | Baymard Institute |
| E-commerce omzet Nederland (2025) | €35 miljard | Thuiswinkel.org |
| Gemiste omzet door abandoned carts | ~€24 miljard/jaar | Berekend |
| **Als AI agents 10% daarvan converteren** | **€2.4 miljard extra omzet** | Conservatieve schatting |
| Mollie transactiefee (~1.5% gemiddeld) | **€36 miljoen extra revenue** | Op die 10% conversie |

### Waarom dit nu relevant is

1. **Google publiceerde AP2** (2025) — het protocol bestaat, maar niemand heeft het met een echte PSP verbonden
2. **AI agents worden mainstream** — ChatGPT, Claude, Gemini hebben honderden miljoenen gebruikers
3. **Mollie is de #1 PSP in de Benelux** — 60.000+ merchants, perfecte positie
4. **First mover advantage** — wie de AP2 standaard zet, bezit de markt

### Concurrentie-analyse

| Speler | AP2 Status | Onze voorsprong |
|---|---|---|
| Stripe | Geen AP2 support | Wij hebben werkende implementatie |
| Adyen | Geen AP2 support | Wij zijn first mover |
| PayPal | Geen AP2 support | Wij hebben multi-agent architectuur |
| Google Pay | AP2 auteur, geen PSP | Wij koppelen AP2 aan echte PSP (Mollie) |
| **Mollie + AP2 (ons project)** | **Eerste werkende integratie** | **Volledige mandate chain + echte betaling** |

---

## Samenvatting

**Wat we hebben:** De eerste werkende proof-of-concept van AP2 met een echte betaalprovider. Multi-agent systeem, cryptografische mandate chain, echte Mollie betalingen, provider-agnostisch.

**Wat we nodig hebben:** Merchant SDK, consumer agent protocol, platform integraties, regulatory compliance.

**Waarom Mollie:** 60.000+ merchants in de Benelux, sterk developer platform, perfecte positie om de standaard te zetten voor agentic payments in Europa.

**De opportunity:** AI agents die autonoom aankopen doen worden mainstream. Elke transactie heeft een payment provider nodig. Wie nu de AP2 infrastructure bouwt, bezit de agentic commerce markt. Dat kan Mollie zijn.
