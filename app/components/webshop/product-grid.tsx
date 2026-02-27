'use client';

import { useCart } from '@/lib/cart-store';
import { getProductsByCategory, type Product } from '@/lib/products';

export interface BrandTheme {
  name: string;
  headerBg: string;
  headerBgDark: string;
  buttonBg: string;
  buttonHover: string;
  accentText: string;
  searchPlaceholder: string;
  tabActiveBg: string;
}

export const CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: 'laptop', label: 'Laptops', emoji: '💻' },
  { key: 'sneakers', label: 'Sneakers', emoji: '👟' },
  { key: 'boodschappen', label: 'Eten', emoji: '🍕' },
  { key: 'hotel', label: 'Hotels', emoji: '🏨' },
];

export const BRAND_THEMES: Record<string, BrandTheme> = {
  laptop: {
    name: 'bol.com',
    headerBg: 'bg-[#0000C4]',
    headerBgDark: 'bg-[#0000A0]',
    buttonBg: 'bg-[#0000C4]',
    buttonHover: 'hover:bg-[#0000A0]',
    accentText: 'text-blue-200',
    searchPlaceholder: 'Zoek in bol.com...',
    tabActiveBg: 'bg-[#0000C4]',
  },
  sneakers: {
    name: 'Nike',
    headerBg: 'bg-[#111111]',
    headerBgDark: 'bg-[#000000]',
    buttonBg: 'bg-[#111111]',
    buttonHover: 'hover:bg-[#333333]',
    accentText: 'text-gray-400',
    searchPlaceholder: 'Zoek in Nike...',
    tabActiveBg: 'bg-[#111111]',
  },
  boodschappen: {
    name: 'Thuisbezorgd',
    headerBg: 'bg-[#FF7700]',
    headerBgDark: 'bg-[#E56A00]',
    buttonBg: 'bg-[#FF7700]',
    buttonHover: 'hover:bg-[#E56A00]',
    accentText: 'text-orange-200',
    searchPlaceholder: 'Zoek in Thuisbezorgd...',
    tabActiveBg: 'bg-[#FF7700]',
  },
  hotel: {
    name: 'Booking.com',
    headerBg: 'bg-[#003580]',
    headerBgDark: 'bg-[#00264D]',
    buttonBg: 'bg-[#003580]',
    buttonHover: 'hover:bg-[#00264D]',
    accentText: 'text-blue-300',
    searchPlaceholder: 'Zoek in Booking.com...',
    tabActiveBg: 'bg-[#003580]',
  },
};

const CATEGORY_GRADIENTS: Record<string, { from: string; to: string }> = {
  laptop: { from: 'from-blue-500', to: 'to-indigo-600' },
  sneakers: { from: 'from-gray-800', to: 'to-black' },
  boodschappen: { from: 'from-orange-400', to: 'to-orange-600' },
  hotel: { from: 'from-blue-700', to: 'to-blue-900' },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">({rating})</span>
    </div>
  );
}

function getSpecsSummary(product: Product): string[] {
  const s = product.specs;
  // Laptophoezen
  if (s.formaat) {
    return [s.formaat, s.materiaal, s.bescherming].filter(Boolean) as string[];
  }
  // Sneaker verzorgingsproducten
  if (s.sprayType) {
    return [s.sprayType, s.inhoud, s.geschiktVoor].filter(Boolean) as string[];
  }
  // Dranken
  if (s.type && ['Frisdranken', 'Wijn', 'Sap'].includes(s.type)) {
    return [s.type, s.inhoud, s.items].filter(Boolean) as string[];
  }
  switch (product.category) {
    case 'laptop':
      return [s.processor, `${s.ram} · ${s.storage}`, s.display].filter(Boolean) as string[];
    case 'sneakers':
      return [s.kleur, `Maat ${s.maat}`, s.materiaal].filter(Boolean) as string[];
    case 'boodschappen':
      return [s.items, `${s.porties} · ${s.bereidingstijd}`].filter(Boolean) as string[];
    case 'hotel':
      return [s.locatie, s.kamerttype, s.ontbijt].filter(Boolean) as string[];
    default:
      return [];
  }
}

function getCategoryEmoji(product: Product): string {
  if (product.specs.formaat) return '💼'; // laptophoes
  if (product.specs.sprayType) return '🧴'; // beschermspray/cleaning kit
  if (product.specs.type && ['Frisdranken', 'Wijn', 'Sap'].includes(product.specs.type)) return '🥤'; // dranken
  const cat = CATEGORIES.find((c) => c.key === product.category);
  return cat?.emoji || '📦';
}

interface ProductCardProps {
  product: Product;
  theme: BrandTheme;
}

function ProductCard({ product, theme }: ProductCardProps) {
  const { addItem } = useCart();
  const gradient = CATEGORY_GRADIENTS[product.category] || { from: 'from-gray-400', to: 'to-gray-600' };
  const specs = getSpecsSummary(product);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Product image placeholder */}
      <div className={`h-36 bg-gradient-to-br ${gradient.from} ${gradient.to} flex items-center justify-center`}>
        <span className="text-4xl opacity-80">{getCategoryEmoji(product)}</span>
      </div>

      {/* Product info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
          {product.name}
        </h3>

        <StarRating rating={product.rating} />

        <div className="mt-2 text-xs text-gray-500 space-y-0.5">
          {specs.map((spec, i) => (
            <div key={i} className="truncate">{spec}</div>
          ))}
        </div>

        <div className="mt-3">
          <div className="text-xl font-bold text-gray-900">
            €{product.price.toFixed(2)}
          </div>
          <div className="text-xs text-green-600 font-medium">
            {product.deliveryTime}
          </div>
        </div>

        <button
          onClick={() => addItem(product)}
          className={`mt-3 w-full ${theme.buttonBg} ${theme.buttonHover} text-white rounded-lg py-2.5 text-sm font-semibold transition-colors`}
        >
          In winkelwagen
        </button>
      </div>
    </div>
  );
}

interface ProductGridProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function ProductGrid({ activeCategory, onCategoryChange }: ProductGridProps) {
  const products = getProductsByCategory(activeCategory);
  const theme = BRAND_THEMES[activeCategory] || BRAND_THEMES.laptop;

  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Category tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
              activeCategory === cat.key
                ? `${theme.tabActiveBg} text-white`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {products.length} producten gevonden
        </p>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} theme={theme} />
        ))}
      </div>
    </div>
  );
}
