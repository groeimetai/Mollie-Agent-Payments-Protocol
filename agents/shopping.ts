import { tool, generateText, stepCountIs } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/model';
import { emitAgentEvent } from '@/lib/events';

// Multi-category product database — demonstrates AP2 across different merchant verticals
// Each category represents a different Mollie merchant segment
const PRODUCT_DATABASE = [
  // ═══════════════════════════════════════════
  // ELECTRONICS — Bol.com, Coolblue, MediaMarkt
  // ═══════════════════════════════════════════
  {
    id: 'bol-lenovo-ideapad',
    name: 'Lenovo IdeaPad Slim 5 16IRU9',
    vendor: 'Bol.com',
    price: 699.00,
    currency: 'EUR',
    category: 'laptop',
    specs: {
      processor: 'Intel Core i5-1335U',
      ram: '16GB DDR5',
      storage: '512GB SSD',
      display: '16 inch WUXGA IPS',
      battery: '71Wh',
      weight: '1.89kg',
    },
    rating: 4.3,
    reviewCount: 287,
    url: 'https://www.bol.com/nl/p/lenovo-ideapad-slim-5',
    deliveryTime: '1-2 werkdagen',
  },
  {
    id: 'coolblue-hp-pavilion',
    name: 'HP Pavilion Plus 14-ey0970nd',
    vendor: 'Coolblue',
    price: 899.00,
    currency: 'EUR',
    category: 'laptop',
    specs: {
      processor: 'Intel Core i7-1355U',
      ram: '16GB DDR4',
      storage: '512GB SSD',
      display: '14 inch 2.8K OLED',
      battery: '51Wh',
      weight: '1.4kg',
    },
    rating: 4.5,
    reviewCount: 142,
    url: 'https://www.coolblue.nl/product/hp-pavilion-plus-14',
    deliveryTime: 'Morgen in huis',
  },
  {
    id: 'mediamarkt-acer-swift',
    name: 'Acer Swift Go 14 SFG14-73-59LY',
    vendor: 'MediaMarkt',
    price: 1089.00,
    currency: 'EUR',
    category: 'laptop',
    specs: {
      processor: 'Intel Core Ultra 5 125H',
      ram: '16GB LPDDR5X',
      storage: '1TB SSD',
      display: '14 inch 2.8K OLED',
      battery: '65Wh',
      weight: '1.3kg',
    },
    rating: 4.6,
    reviewCount: 89,
    url: 'https://www.mediamarkt.nl/product/acer-swift-go-14',
    deliveryTime: '2-3 werkdagen',
  },
  {
    id: 'bol-dell-inspiron',
    name: 'Dell Inspiron 15 3530',
    vendor: 'Bol.com',
    price: 549.00,
    currency: 'EUR',
    category: 'laptop',
    specs: {
      processor: 'Intel Core i5-1335U',
      ram: '8GB DDR4',
      storage: '256GB SSD',
      display: '15.6 inch Full HD',
      battery: '54Wh',
      weight: '1.65kg',
    },
    rating: 4.0,
    reviewCount: 531,
    url: 'https://www.bol.com/nl/p/dell-inspiron-15',
    deliveryTime: '1-2 werkdagen',
  },
  {
    id: 'coolblue-asus-vivobook',
    name: 'ASUS VivoBook S 14 OLED S5406SA',
    vendor: 'Coolblue',
    price: 1149.00,
    currency: 'EUR',
    category: 'laptop',
    specs: {
      processor: 'Intel Core Ultra 7 155H',
      ram: '16GB LPDDR5X',
      storage: '1TB SSD',
      display: '14 inch 3K OLED',
      battery: '75Wh',
      weight: '1.3kg',
    },
    rating: 4.7,
    reviewCount: 203,
    url: 'https://www.coolblue.nl/product/asus-vivobook-s14',
    deliveryTime: 'Morgen in huis',
  },

  // ═══════════════════════════════════════════
  // FASHION — Zalando, Nike.nl
  // ═══════════════════════════════════════════
  {
    id: 'zalando-nike-airmax90',
    name: 'Nike Air Max 90',
    vendor: 'Zalando',
    price: 139.99,
    currency: 'EUR',
    category: 'sneakers',
    specs: {
      maat: '36-46',
      kleur: 'White/Black',
      materiaal: 'Leer en mesh',
      zool: 'Air Max demping',
      pasvorm: 'Normaal',
      weight: '0.35kg',
    },
    rating: 4.6,
    reviewCount: 1842,
    url: 'https://www.zalando.nl/nike-air-max-90',
    deliveryTime: 'Gratis bezorging, 1-3 werkdagen',
  },
  {
    id: 'nike-airforce1',
    name: 'Nike Air Force 1 \'07',
    vendor: 'Nike.nl',
    price: 119.99,
    currency: 'EUR',
    category: 'sneakers',
    specs: {
      maat: '36-48.5',
      kleur: 'White/White',
      materiaal: 'Volledig leer',
      zool: 'Air cushioning',
      pasvorm: 'Normaal',
      weight: '0.38kg',
    },
    rating: 4.8,
    reviewCount: 3210,
    url: 'https://www.nike.com/nl/t/air-force-1-07',
    deliveryTime: 'Gratis bezorging, 2-5 werkdagen',
  },
  {
    id: 'zalando-adidas-samba',
    name: 'Adidas Samba OG',
    vendor: 'Zalando',
    price: 109.95,
    currency: 'EUR',
    category: 'sneakers',
    specs: {
      maat: '36-47',
      kleur: 'Core Black / Cloud White',
      materiaal: 'Leer bovenwerk',
      zool: 'Rubber buitenzool',
      pasvorm: 'Normaal',
      weight: '0.32kg',
    },
    rating: 4.7,
    reviewCount: 2156,
    url: 'https://www.zalando.nl/adidas-samba-og',
    deliveryTime: 'Gratis bezorging, 1-3 werkdagen',
  },
  {
    id: 'zalando-nike-dunk',
    name: 'Nike Dunk Low Retro',
    vendor: 'Zalando',
    price: 109.99,
    currency: 'EUR',
    category: 'sneakers',
    specs: {
      maat: '38.5-47.5',
      kleur: 'Panda (Black/White)',
      materiaal: 'Leer',
      zool: 'Schuimrubber tussenzool',
      pasvorm: 'Normaal',
      weight: '0.34kg',
    },
    rating: 4.5,
    reviewCount: 987,
    url: 'https://www.zalando.nl/nike-dunk-low-retro',
    deliveryTime: 'Gratis bezorging, 1-3 werkdagen',
  },

  // ═══════════════════════════════════════════
  // BOODSCHAPPEN — Albert Heijn, Jumbo, Picnic
  // ═══════════════════════════════════════════
  {
    id: 'ah-boodschappenpakket-pasta',
    name: 'Pasta Carbonara Pakket',
    vendor: 'Albert Heijn',
    price: 12.47,
    currency: 'EUR',
    category: 'boodschappen',
    specs: {
      items: 'Spaghetti, spekblokjes, eieren, Parmezaanse kaas, peper',
      porties: '4 personen',
      bereidingstijd: '25 minuten',
      dieet: 'Geen restricties',
      bewaring: 'Koelkast',
      weight: '1.2kg',
    },
    rating: 4.4,
    reviewCount: 567,
    url: 'https://www.ah.nl/recepten/pasta-carbonara',
    deliveryTime: 'Vandaag bezorgd (voor 22:00 besteld)',
  },
  {
    id: 'jumbo-boodschappenpakket-pasta',
    name: 'Carbonara Maaltijdbox',
    vendor: 'Jumbo',
    price: 11.89,
    currency: 'EUR',
    category: 'boodschappen',
    specs: {
      items: 'Penne, pancetta, roomkaas, eieren, knoflook',
      porties: '4 personen',
      bereidingstijd: '20 minuten',
      dieet: 'Geen restricties',
      bewaring: 'Koelkast',
      weight: '1.1kg',
    },
    rating: 4.2,
    reviewCount: 321,
    url: 'https://www.jumbo.com/recepten/carbonara',
    deliveryTime: 'Vandaag bezorgd (voor 21:00 besteld)',
  },
  {
    id: 'picnic-boodschappen-pasta',
    name: 'Pasta Carbonara Boodschappenlijst',
    vendor: 'Picnic',
    price: 10.95,
    currency: 'EUR',
    category: 'boodschappen',
    specs: {
      items: 'Spaghetti, spekjes, eieren, kaas, roomboter',
      porties: '4 personen',
      bereidingstijd: '25 minuten',
      dieet: 'Geen restricties',
      bewaring: 'Koelkast',
      weight: '1.0kg',
    },
    rating: 4.3,
    reviewCount: 892,
    url: 'https://www.picnic.app/nl/recepten',
    deliveryTime: 'Volgende bezorgmoment beschikbaar',
  },

  // ═══════════════════════════════════════════
  // REIZEN — Booking.com, KLM
  // ═══════════════════════════════════════════
  {
    id: 'booking-amsterdam-hotel',
    name: 'NH Amsterdam Centre — Superior Kamer',
    vendor: 'Booking.com',
    price: 189.00,
    currency: 'EUR',
    category: 'hotel',
    specs: {
      locatie: 'Amsterdam Centrum, 500m van Dam',
      kamerttype: 'Superior Double',
      ontbijt: 'Inclusief ontbijtbuffet',
      wifi: 'Gratis WiFi',
      annulering: 'Gratis annuleren tot 24u voor check-in',
      weight: 'n/a',
    },
    rating: 4.3,
    reviewCount: 4521,
    url: 'https://www.booking.com/hotel/nh-amsterdam-centre',
    deliveryTime: 'Direct bevestigd',
  },
  {
    id: 'booking-amsterdam-budget',
    name: 'The Student Hotel Amsterdam City — Studio',
    vendor: 'Booking.com',
    price: 129.00,
    currency: 'EUR',
    category: 'hotel',
    specs: {
      locatie: 'Amsterdam Oost, bij Oosterpark',
      kamerttype: 'Studio voor 2 personen',
      ontbijt: 'Niet inbegrepen (€14 p.p.)',
      wifi: 'Gratis WiFi',
      annulering: 'Gratis annuleren tot 48u voor check-in',
      weight: 'n/a',
    },
    rating: 4.1,
    reviewCount: 2873,
    url: 'https://www.booking.com/hotel/student-hotel-amsterdam',
    deliveryTime: 'Direct bevestigd',
  },
  {
    id: 'booking-amsterdam-luxury',
    name: 'Pulitzer Amsterdam — Deluxe Canal View',
    vendor: 'Booking.com',
    price: 349.00,
    currency: 'EUR',
    category: 'hotel',
    specs: {
      locatie: 'Prinsengracht, hartje grachtengordel',
      kamerttype: 'Deluxe Double met grachtzicht',
      ontbijt: 'Inclusief uitgebreid ontbijt',
      wifi: 'Gratis WiFi',
      annulering: 'Gratis annuleren tot 72u voor check-in',
      weight: 'n/a',
    },
    rating: 4.7,
    reviewCount: 1987,
    url: 'https://www.booking.com/hotel/pulitzer-amsterdam',
    deliveryTime: 'Direct bevestigd',
  },
];

const searchProducts = tool({
  description: 'Search for products based on criteria like category, max price, and keywords. Returns available products from Dutch webshops.',
  inputSchema: z.object({
    category: z.string().describe('Product category, e.g. "laptop", "telefoon", "tablet"'),
    maxPrice: z.number().optional().describe('Maximum price in EUR'),
    minPrice: z.number().optional().describe('Minimum price in EUR'),
    keywords: z.string().optional().describe('Additional search keywords'),
  }),
  execute: async ({ category, maxPrice, minPrice }) => {
    emitAgentEvent({
      agent: 'shopping',
      type: 'tool_call',
      message: `Zoeken naar ${category} producten${maxPrice ? ` tot €${maxPrice}` : ''}`,
    });

    let results = PRODUCT_DATABASE.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );

    if (maxPrice) {
      results = results.filter((p) => p.price <= maxPrice);
    }
    if (minPrice) {
      results = results.filter((p) => p.price >= minPrice);
    }

    emitAgentEvent({
      agent: 'shopping',
      type: 'result',
      message: `${results.length} producten gevonden`,
      data: { count: results.length },
    });

    return {
      products: results,
      totalFound: results.length,
      searchCriteria: { category, maxPrice, minPrice },
    };
  },
});

const compareProducts = tool({
  description: 'Compare a list of products on price, specs, reviews, and value for money. Returns a ranked comparison.',
  inputSchema: z.object({
    productIds: z.array(z.string()).describe('Product IDs to compare'),
    priorities: z.array(z.string()).optional().describe('What matters most: "price", "performance", "portability", "display"'),
  }),
  execute: async ({ productIds, priorities }) => {
    emitAgentEvent({
      agent: 'shopping',
      type: 'tool_call',
      message: `Vergelijken van ${productIds.length} producten`,
    });

    const products = PRODUCT_DATABASE.filter((p) =>
      productIds.includes(p.id)
    );

    // Universal scoring — works across all product categories
    const scored = products.map((p) => {
      let score = 0;
      const prioList = priorities || ['price', 'quality'];

      for (const priority of prioList) {
        switch (priority) {
          case 'price': {
            // Lower price = higher score, normalized per category
            const maxInCategory = Math.max(...products.map(pr => pr.price), p.price);
            score += ((maxInCategory - p.price) / maxInCategory) * 30;
            break;
          }
          case 'performance':
            score += p.specs.ram?.includes('16GB') ? 20 : 10;
            score += p.specs.storage?.includes('1TB') ? 15 : 8;
            break;
          case 'portability':
            score += p.specs.weight !== 'n/a' ? (2.0 - parseFloat(p.specs.weight)) * 20 : 10;
            break;
          case 'display':
            score += p.specs.display?.includes('OLED') ? 25 : 10;
            break;
          case 'quality':
            // Universal: rating * review volume
            score += p.rating * 5;
            score += Math.min(p.reviewCount / 100, 10);
            break;
          case 'delivery':
            score += p.deliveryTime.includes('Vandaag') || p.deliveryTime.includes('Morgen') || p.deliveryTime.includes('Direct') ? 20 : 8;
            break;
        }
      }
      score += p.rating * 5;
      return { ...p, score: Math.round(score * 10) / 10 };
    });

    scored.sort((a, b) => b.score - a.score);

    emitAgentEvent({
      agent: 'shopping',
      type: 'result',
      message: `Vergelijking compleet. Beste keuze: ${scored[0]?.name}`,
    });

    return {
      comparison: scored.map((p, i) => ({
        rank: i + 1,
        id: p.id,
        name: p.name,
        vendor: p.vendor,
        price: `€${p.price.toFixed(2)}`,
        score: p.score,
        specs: p.specs,
        rating: `${p.rating}/5 (${p.reviewCount} reviews)`,
        delivery: p.deliveryTime,
        url: p.url,
      })),
      recommendation: scored[0]
        ? {
            productId: scored[0].id,
            name: scored[0].name,
            vendor: scored[0].vendor,
            price: scored[0].price,
            reason: `Beste score (${scored[0].score}) op basis van ${(priorities || ['price', 'performance']).join(', ')}`,
          }
        : null,
    };
  },
});

export const shoppingTools = { searchProducts, compareProducts };

// Shopping agent as a callable function for orchestrator
export async function runShoppingAgent(prompt: string): Promise<string> {
  emitAgentEvent({
    agent: 'shopping',
    type: 'start',
    message: 'Shopping Agent geactiveerd',
  });

  const result = await generateText({
    model: getModel(),
    system: `Je bent de Shopping Agent. Je helpt met het zoeken en vergelijken van producten bij Nederlandse webshops en merchants.

Beschikbare categorieën:
- "laptop" — Bol.com, Coolblue, MediaMarkt
- "sneakers" — Zalando, Nike.nl
- "boodschappen" — Albert Heijn, Jumbo, Picnic
- "hotel" — Booking.com

Je werkwijze:
1. Bepaal de juiste categorie op basis van de gebruiker's vraag
2. Gebruik searchProducts om producten te zoeken (gebruik de juiste categorie-naam)
3. Gebruik compareProducts om de beste opties te vergelijken
4. Geef een duidelijke aanbeveling met motivatie

Communiceer in het Nederlands. Wees beknopt maar informatief.
Benoem altijd de vendor/merchant bij naam.
Geef altijd de product-ID van je aanbeveling terug zodat andere agents ermee verder kunnen.`,
    tools: shoppingTools,
    stopWhen: stepCountIs(5),
    prompt,
  });

  emitAgentEvent({
    agent: 'shopping',
    type: 'complete',
    message: 'Shopping Agent klaar',
  });

  return result.text;
}
