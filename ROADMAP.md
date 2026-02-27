# AP2 + Mollie: De Agent is de Checkout

## De kernvisie

**De agent zit op de productpagina of in de cart van de merchant. Niet als vergelijkingstool — gewoon als slimme checkout assistent.**

```
Gebruiker zit op bol.com, laptop in winkelwagen
    ↓
Agent popup: "Wil je dit afrekenen?
              Je hebt iDEAL als voorkeur."
    ↓
Gebruiker: "Ja doe maar"
    ↓
AP2 mandate aangemaakt + gesigned
    ↓
Mollie verwerkt betaling
    ↓
Klaar. Geen redirects, geen formulieren.
```

Dat is het. Geen aparte app. Geen chatbot die producten zoekt. De agent **vervangt de checkout**. Hij zit waar de klant al is — op de webshop — en maakt afrekenen zo simpel als "ja doe maar".

---

## Waarom dit bestaat

### Het probleem: 70% abandoned carts

Elke e-commerce merchant kent het probleem. Een klant stopt iets in de winkelwagen en dan:
- Moet een account aanmaken, of inloggen
- Moet adresgegevens invullen
- Moet een betaalmethode kiezen
- Wordt geredirect naar de bank
- Moet een verificatiecode invullen
- Wordt teruggestuurd naar de merchant

Ergens in die keten haakt 70% af. Niet omdat ze niet willen kopen — omdat het te veel stappen zijn.

### De oplossing: de agent doet het voor je

De agent kent je voorkeuren (iDEAL, bezorgadres, etc.). Als je zegt "ja doe maar", doet de agent de rest:

1. **AP2 Intent Mandate** — legt vast wat je wilt kopen en je budget
2. **AP2 Cart Mandate** — bevat de exacte cart items, cryptografisch gesigned door de merchant
3. **AP2 Payment Mandate** — autorisatie voor de betaling, gesigned door jou
4. **Mollie Payment** — verwerkt de betaling via iDEAL/creditcard
5. **Klaar** — receipt met volledige audit trail

Geen redirects. Geen formulieren. Eén zin.

---

## Wat we gebouwd hebben

### De AP2 protocol stack + Mollie integratie

Wij hebben de infrastructure gebouwd die dit mogelijk maakt. Dit is de eerste werkende implementatie van Google's Agent Payment Protocol (AP2) met een echte payment provider.

**Werkende componenten:**

| Component | Status | Beschrijving |
|---|---|---|
| AP2 Mandate Chain | ✅ Compleet | Intent → Cart → Payment mandates met JWT signing |
| Mollie iDEAL Betaling | ✅ Compleet | Echte betalingen via Mollie test API |
| Cryptografische Autorisatie | ✅ Compleet | JWT-signed mandate chain — bewijs dat de gebruiker akkoord ging |
| Webhook Verificatie | ✅ Compleet | Server-side payment status verificatie |
| Kill Switch | ✅ Compleet | Directe annulering van lopende betalingen |
| Multi-Agent Systeem | ✅ Compleet | Orchestrator + gespecialiseerde agents (AI SDK 6) |
| Multi-Category Demo | ✅ Compleet | Electronics, Fashion, Boodschappen, Reizen |
| Provider-Agnostisch | ✅ Compleet | Claude, GPT-4, Gemini — één regel code switch |
| Real-time Dashboard | ✅ Compleet | Live agent activiteit + mandate chain visualisatie |

**Tech stack:**
- Next.js 16 + AI SDK 6 (Vercel) — standaard voor AI app development
- @mollie/api-client — officiële Mollie SDK
- jose (JWT) — cryptografische mandate signing
- Deployed op Google Cloud Run (europe-west1)

**Wat de demo laat zien:**
De huidige demo is een standalone chat-agent die producten zoekt, vergelijkt, en via AP2+Mollie afrekent. Dit demonstreert de volledige protocol stack. De volgende stap is deze stack inzetten als checkout-agent op de merchant site zelf.

---

## Het businessmodel

```
Klant zit op bol.com
    ↓ laptop in winkelwagen
Checkout Agent (powered by Mollie AP2)
    ↓ "Wil je afrekenen? iDEAL?"
Klant: "Ja"
    ↓ AP2 mandate chain
Mollie verwerkt betaling + int transactiekosten
    ↓ settlement
Bol.com krijgt het geld
```

**Mollie verdient per transactie.** Elke abandoned cart die de agent wél converteert, is extra omzet voor Mollie. De agent maakt het Mollie-ecosysteem waardevoller voor merchants — meer conversie, meer volume, meer revenue.

**De pitch aan Mollie:**
> Jullie hebben 60.000+ merchants. Elke merchant verliest 70% van zijn winkelwagens. Wij zetten een checkout-agent op elke merchant site die dat percentage naar beneden duwt. De agent vervangt het checkout formulier door één vraag: "Wil je afrekenen?" Elke extra conversie is een extra Mollie transactie. Dit is geen feature — dit is een nieuwe revenue stream.

---

## Van demo naar product: wat er nog bij moet komen

### Fase 1: Merchant Checkout Widget (0-3 maanden)

**Doel:** Een embeddable agent-widget die merchants op hun site plaatsen. De agent IS de checkout.

| Component | Prioriteit | Beschrijving |
|---|---|---|
| Checkout Agent Widget | 🔴 Kritiek | Embeddable JS widget voor merchant sites — de agent popup |
| Cart Detection API | 🔴 Kritiek | Agent leest cart items van de merchant pagina |
| User Preference Store | 🔴 Kritiek | Onthoudt betaalmethode, adres, voorkeuren per gebruiker |
| `@mollie/ap2-checkout` | 🔴 Kritiek | NPM package — merchant installeert, agent werkt |
| One-Click Mandate Flow | 🟡 Belangrijk | Hele mandate chain in <2 seconden na "ja doe maar" |
| Mollie Dashboard AP2 Tab | 🟡 Belangrijk | AP2 checkout conversies zichtbaar in Mollie dashboard |

**Merchant integratie — zo simpel mogelijk:**
```html
<!-- Merchant voegt dit toe aan hun site -->
<script src="https://js.mollie.com/ap2-checkout.js"></script>
<script>
  MollieAP2.init({
    profileId: 'pfl_...',      // Bestaand Mollie profiel
    position: 'bottom-right',   // Waar de agent popup verschijnt
    trigger: 'cart',            // Activeer wanneer er items in de cart zitten
  });
</script>
```

**Dat is het.** De merchant installeert één script tag. De agent verschijnt automatisch wanneer er iets in de cart zit. De hele AP2 mandate chain, Mollie betaling, en receipt handling draait op Mollie's infrastructure.

### Fase 2: Slimme Checkout Personalisatie (3-6 maanden)

**Doel:** De agent wordt slimmer — kent de klant, optimaliseert conversie.

| Component | Prioriteit | Beschrijving |
|---|---|---|
| Klantherkenning | 🔴 Kritiek | Agent herkent terugkerende klanten (cookie/account based) |
| Betaalmethode Memory | 🔴 Kritiek | "Je hebt vorige keer iDEAL gebruikt. Weer iDEAL?" |
| Smart Timing | 🟡 Belangrijk | Agent verschijnt op het juiste moment (niet te vroeg, niet te laat) |
| Conversational Upsell | 🟡 Belangrijk | "Wil je er een laptop sleeve bij? Past perfect." |
| A/B Testing Engine | 🟡 Belangrijk | Test welke agent-benadering het beste converteert |
| Abandoned Cart Recovery | 🟡 Belangrijk | Agent stuurt follow-up: "Je had nog een laptop in je cart" |

### Fase 3: Cross-Merchant Agent Ecosystem (6-12 maanden)

**Doel:** De agent werkt niet alleen op één merchant — hij werkt overal waar Mollie zit.

| Component | Prioriteit | Beschrijving |
|---|---|---|
| Universal Agent Identity | 🔴 Kritiek | Eén agent-profiel dat werkt op alle Mollie merchants |
| AP2 Discovery Protocol | 🔴 Kritiek | Agent ontdekt automatisch welke merchants AP2-compatible zijn |
| Cross-Merchant Cart | 🟡 Belangrijk | "Je wilt een laptop van Coolblue en een sleeve van Bol.com — samen afrekenen?" |
| Third-Party Agent Support | 🟡 Belangrijk | ChatGPT, Claude, Siri kunnen via AP2 betalen bij Mollie merchants |
| Merchant Analytics | 🟡 Belangrijk | Dashboard: hoeveel conversies door de agent vs traditionele checkout |
| Recurring Mandates | 🟢 Nice-to-have | Subscriptions en herhaalaankopen |

### Fase 4: Platform & Scale (12-24 maanden)

**Doel:** AP2 via Mollie wordt de standaard voor checkout in de Benelux en daarbuiten.

| Component | Prioriteit | Beschrijving |
|---|---|---|
| Shopify App | 🔴 Kritiek | One-click AP2 checkout installatie voor Shopify merchants |
| WooCommerce Plugin | 🔴 Kritiek | WordPress plugin — duizenden NL merchants |
| Magento Extension | 🟡 Belangrijk | Enterprise merchants |
| Lightspeed Integratie | 🟡 Belangrijk | Benelux marktleider |
| B2B Procurement Agents | 🟡 Belangrijk | Bedrijven die inkoop delegeren aan agents |
| Open Banking (PSD3) | 🟢 Nice-to-have | Direct account-to-account via agent |

---

## Platform integraties

### Merchant-side (waar de agent op draait)

| Platform | Integratie | Waarom |
|---|---|---|
| **Shopify** | App Store plugin met AP2 checkout widget | Duizenden NL Mollie-Shopify merchants, one-click install |
| **WooCommerce** | WordPress plugin | Grootste e-commerce CMS in NL |
| **Magento/Adobe Commerce** | Extension | Enterprise merchants (Hema, Bijenkorf, etc.) |
| **Lightspeed** | Native integratie | Benelux marktleider, POS + e-commerce |
| **Bol.com** | Partner API integratie | Grootste NL marketplace — hoogste impact |
| **Thuisbezorgd/Just Eat** | Checkout agent voor food ordering | Hoog-frequent, perfect voor "ja doe maar" |
| **Custom webshops** | `<script>` tag integratie | Elk platform via universele JS widget |

### Consumer-side (welke AI agents kunnen betalen)

| Platform | Integratie | Impact |
|---|---|---|
| **Browser-native agent** | De checkout widget zelf | Direct op de merchant site, geen extra app nodig |
| **OpenAI (ChatGPT)** | GPT Action met AP2 mandate support | 200M+ gebruikers — "koop dit voor me" vanuit ChatGPT |
| **Anthropic (Claude)** | MCP Server voor AP2 payments | Claude kan direct afrekenen bij Mollie merchants |
| **Google (Gemini)** | Native AP2 (Google schreef het protocol) | Diepste integratie mogelijk |
| **Apple (Siri)** | AP2 via Apple Pay + Mollie | Premium segment, hoge conversie |
| **Banking Apps (ING, Rabo, ABN)** | AI assistant met AP2 | Direct gekoppeld aan betaalrekening — ultieme trust |

### Compliance & Regulering

| Vereiste | Status | Toelichting |
|---|---|---|
| **PSD2/PSD3 (SCA)** | 🔴 Verplicht | Strong Customer Authentication — "ja doe maar" telt als consent, mandate is het bewijs |
| **DNB Toezicht** | 🔴 Verplicht | Regulatoire goedkeuring voor agent-initiated payments |
| **GDPR/AVG** | 🔴 Verplicht | Privacy-by-design — agent preferences zijn persoonsgegevens |
| **3D Secure 2.0** | 🟡 Belangrijk | Fraud prevention, maar AP2 mandate chain biedt al sterk bewijs |
| **eIDAS 2.0** | 🟢 Relevant | EU Digital Identity Wallet — potentiële agent identity bron |

---

## Marktpotentieel

### Het abandoned cart probleem in cijfers

| Metric | Waarde | Bron |
|---|---|---|
| Abandoned cart rate (gemiddeld) | ~70% | Baymard Institute |
| E-commerce omzet Nederland (2025) | €35 miljard | Thuiswinkel.org |
| Totaal in winkelwagens geplaatst | ~€117 miljard/jaar | Berekend (35B / 0.3) |
| Gemiste omzet door abandoned carts | ~€82 miljard/jaar | 70% van €117 miljard |
| **Als de checkout-agent 5% daarvan converteert** | **€4.1 miljard extra omzet** | Conservatieve schatting |
| Mollie transactiefee (~1.5% gemiddeld) | **€61 miljoen extra revenue** | Per jaar, alleen Nederland |
| **Benelux + EU schaal** | **€500M+ potentieel** | Bij 60.000+ merchants |

### Waarom de timing perfect is

1. **Google publiceerde AP2** (2025) — het protocol bestaat, er is een standaard, maar niemand heeft het met een echte PSP verbonden
2. **AI agents worden mainstream** — ChatGPT, Claude, Gemini hebben honderden miljoenen actieve gebruikers die gewend raken aan "doe dit voor mij"
3. **Checkout friction is het #1 probleem** — merchants investeren miljoenen in UX maar de abandoned cart rate daalt niet
4. **Mollie zit perfect gepositioneerd** — 60.000+ merchants, sterk developer platform, Europese focus
5. **Regulatory momentum** — PSD3 en eIDAS 2.0 creëren het framework voor agent-initiated payments

### Concurrentie

| Speler | Checkout Agent? | AP2? | Onze positie |
|---|---|---|---|
| Stripe | Nee — optimized checkout links | Nee | Wij vervangen de checkout zelf |
| Adyen | Nee — drop-in components | Nee | Wij zijn conversationeel, niet formulier-based |
| PayPal | Nee — redirect-based | Nee | Wij elimineren redirects |
| Klarna | Deels — "smooth checkout" | Nee | Klarna is BNPL, wij zijn agent-first |
| Google Pay | AP2 auteur, geen PSP | Ja, maar geen PSP | Wij koppelen AP2 aan echte betalingen |
| **Mollie + AP2** | **Ja — de agent IS de checkout** | **Eerste werkende integratie** | **First mover, volledige stack** |

Geen enkele concurrent heeft een checkout-agent die op de merchant site zit, de cart leest, en via een cryptografisch gesigned mandate chain afrekent. Dit is greenfield.

---

## Samenvatting

**De visie:** De agent vervangt de checkout. Hij zit op de merchant site, leest de cart, vraagt "wil je afrekenen?", en handelt de rest af via AP2 + Mollie. Geen redirects, geen formulieren, geen abandoned carts.

**Wat we hebben:** De eerste werkende AP2 → Mollie protocol stack. Mandate chain met JWT signing, echte Mollie betalingen, multi-agent systeem, provider-agnostisch.

**Wat we bouwen:** Een embeddable checkout-agent widget die elke Mollie merchant in één script tag kan installeren.

**Waarom Mollie:** 60.000+ merchants, sterke developer experience, perfecte positie om de standaard te zetten. De agent maakt het Mollie-ecosysteem waardevoller — meer conversie voor merchants, meer transacties voor Mollie.

**De opportunity:** Checkout friction kost Nederlandse e-commerce ~€82 miljard per jaar aan gemiste omzet. Een agent die dat probleem oplost met één zin — "ja doe maar" — verandert de hele payment industry. Wie dat als eerste bouwt, bezit de markt. Dat kan Mollie zijn.
