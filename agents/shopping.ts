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
      message: `Searching for ${category} products${maxPrice ? ` up to €${maxPrice}` : ''}`,
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
      message: `${results.length} products found`,
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
      message: `Comparing ${productIds.length} products`,
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
      message: `Comparison complete. Best choice: ${scored[0]?.name}`,
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
            reason: `Best score (${scored[0].score}) based on ${(priorities || ['price', 'performance']).join(', ')}`,
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
    message: 'Shopping Agent activated',
  });

  const result = await generateText({
    model: getModel(),
    system: `You are the Shopping Agent. You help search and compare products in our webshop.

Available categories and brands:
- "laptop" → bol.com: laptops, laptop sleeves and accessories
- "sneakers" → Nike: sneakers, protection sprays and cleaning products
- "boodschappen" → Thuisbezorgd: meal kits and drinks (soft drinks, wine, juice)
- "hotel" → Booking.com: hotels and accommodations in Amsterdam

## Cross-sell suggestions
ALWAYS make smart additional suggestions after a product choice:
- After laptop → suggest a laptop sleeve ("Would you like a protective sleeve? We have sleeves from €19.99")
- After sneakers → suggest protection spray ("Tip: protect your new sneakers with Crep Protect spray!")
- After food/meal kit → suggest drinks ("Would you like drinks with that? We have soft drinks, wine and fresh juice")
- After hotel → mention breakfast options or premium rooms

## Your workflow:
1. Determine the right category based on the user's question
2. Use searchProducts to search for products (use the correct category name)
3. Use compareProducts to compare the best options
4. Give a clear recommendation with reasoning
5. Make a cross-sell suggestion with relevant additional products from the same category

Communicate in English. Be concise but informative.
Always return the product ID of your recommendation so other agents can continue with it.`,
    tools: shoppingTools,
    stopWhen: stepCountIs(5),
    prompt,
  });

  emitAgentEvent({
    agent: 'shopping',
    type: 'complete',
    message: 'Shopping Agent done',
  });

  return result.text;
}
