# AP2 + Mollie: The Agent Handles the Payment

The first working integration of Google's **Agent-to-Agent Payment Protocol (AP2)** with a Payment Service Provider. An AI checkout agent that eliminates traditional checkout friction — approve once, then fully automatic.

**[Live Demo](https://ap2-mollie-webshop-mollie-agent-payments-protocol.europe-west1.run.app)** · **[Demo Video](https://storage.googleapis.com/ap2-mollie-demo-assets/demo.mp4)**

## The Problem

70% of online shopping carts are abandoned. That's **€82 billion** in lost revenue per year in Europe alone. The cause: too many steps between "I want this" and "I paid for it" — account creation, address forms, payment selection, bank redirects, verification codes.

## The Solution

An AI agent that **handles the entire payment flow**:

1. **First purchase**: Customer talks to the checkout agent and approves the payment **once**
2. **Every purchase after**: The agent pays **fully automatically** — no human interaction needed
3. **Cryptographic security**: Every step is JWT-signed using Google's AP2 mandate chain

## How It Works

```
Customer: "I want to buy this laptop"
    ↓
Agent reads cart → creates AP2 Intent Mandate
    ↓
Customer approves → Payment Mandate (JWT-signed)
    ↓
Mollie processes payment (iDEAL, credit card, etc.)
    ↓
Done. Next time → fully automatic.
```

### Multi-Agent Architecture

| Agent | Role |
|-------|------|
| **Orchestrator** | Directs the multi-agent system, delegates to sub-agents |
| **Shopping Agent** | Reads cart, searches products, compares options |
| **Mandate Agent** | Creates and manages AP2 JWT-signed mandate chain |
| **Payment Agent** | Processes payments through Mollie API |

### AP2 Mandate Chain

Every payment follows Google's AP2 protocol with cryptographic proof at each step:

```
Intent Mandate → Cart Mandate → Payment Mandate → Mollie Payment → Done
     (JWT)           (JWT)           (JWT)          (iDEAL/CC)    (audit trail)
```

## Demo Flows

The demo showcases three scenarios on example merchant webshops:

1. **First Purchase (Manual Approval)** — Customer buys a laptop, approves the payment once through the agent
2. **Repeat Purchase (Fully Automatic)** — Same customer, new purchase — agent pays automatically, zero clicks
3. **Food Order + Upsell (Automatic)** — Agent orders on Thuisbezorgd, suggests add-ons, pays automatically

## Why Mollie

- **60,000+ merchants** can activate this checkout agent
- **Every recovered abandoned cart** = an extra Mollie transaction
- **One script tag to install** — works with Shopify, WooCommerce, custom webshops
- **Provider-agnostic AI** — supports Claude, GPT-4, Gemini with a single config switch
- **Kill switch** — instant cancellation by merchant or customer at any time

## Tech Stack

- **Next.js 16** — Full-stack React framework
- **AI SDK 6** — Multi-provider AI integration (Anthropic, OpenAI, Google)
- **Mollie API** — Payment processing (iDEAL, credit card, recurring)
- **jose** — JWT signing for AP2 mandate chain
- **Google Cloud Run** — Production deployment (europe-west1)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: ANTHROPIC_API_KEY, MOLLIE_API_KEY, JWT_SECRET, NEXT_PUBLIC_APP_URL

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key (primary AI provider) |
| `OPENAI_API_KEY` | OpenAI API key (optional fallback) |
| `MOLLIE_API_KEY` | Mollie API key for payment processing |
| `JWT_SECRET` | Secret for signing AP2 mandate JWTs |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application |
| `AGENT_MODEL` | AI provider: `anthropic`, `openai`, or `google` |

## Deployment

```bash
# Deploy to Google Cloud Run
gcloud run deploy ap2-mollie \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌──────────────┐  ┌─────────────────────────┐  │
│  │   Webshop    │  │    Agent Dashboard       │  │
│  │  (60% left)  │  │     (40% right)          │  │
│  │              │  │  - Agent Activity Feed    │  │
│  │  Products    │  │  - Payment Status         │  │
│  │  Cart        │  │  - Auto-Checkout Settings │  │
│  │  Chat Agent  │  │  - Kill Switch            │  │
│  └──────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────────┐
│              Next.js API Routes                  │
│  /api/chat    /api/auto-checkout   /api/webhook  │
└─────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐   ┌──────────────────────────┐
│  AI Agents (AP2) │   │     Mollie API           │
│  - Orchestrator  │──▶│  - Create Payment        │
│  - Shopping      │   │  - Recurring (mandate)   │
│  - Mandate (JWT) │   │  - Webhook callbacks     │
│  - Payment       │   └──────────────────────────┘
└──────────────────┘
```

---

Built for the **Mollie Hackathon 2025** by [GroeimetAI](https://github.com/groeimetai)
