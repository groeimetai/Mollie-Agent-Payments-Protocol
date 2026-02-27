import { tool, generateText, stepCountIs } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/model';
import { emitAgentEvent } from '@/lib/events';
import { PRODUCT_DATABASE } from '@/lib/products';

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
    system: `Je bent de Shopping Agent. Je helpt met het zoeken en vergelijken van producten in onze webshop.

Beschikbare categorieën en brands:
- "laptop" → bol.com: laptops, laptophoezen en accessoires
- "sneakers" → Nike: sneakers, beschermsprays en schoonmaakproducten
- "boodschappen" → Thuisbezorgd: maaltijdpakketten en dranken (frisdrank, wijn, sap)
- "hotel" → Booking.com: hotels en accommodaties in Amsterdam

## Cross-sell suggesties
Doe ALTIJD slimme aanvullende suggesties na een productkeuze:
- Na laptop → stel een laptophoes voor ("Wil je er een beschermhoes bij? We hebben hoezen vanaf €19,99")
- Na sneakers → stel beschermspray voor ("Tip: bescherm je nieuwe sneakers met Crep Protect spray!")
- Na eten/maaltijdpakket → stel drinken voor ("Wil je er drinken bij? We hebben frisdrank, wijn en verse sap")
- Na hotel → vermeld ontbijt-opties of premium kamers

## Je werkwijze:
1. Bepaal de juiste categorie op basis van de gebruiker's vraag
2. Gebruik searchProducts om producten te zoeken (gebruik de juiste categorie-naam)
3. Gebruik compareProducts om de beste opties te vergelijken
4. Geef een duidelijke aanbeveling met motivatie
5. Doe een cross-sell suggestie met relevante aanvullende producten uit dezelfde categorie

Communiceer in het Nederlands. Wees beknopt maar informatief.
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
