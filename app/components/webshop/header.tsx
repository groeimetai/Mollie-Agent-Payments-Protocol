'use client';

import { useCart } from '@/lib/cart-store';
import { BRAND_THEMES, CATEGORIES } from './product-grid';

interface HeaderProps {
  activeCategory: string;
  onCartClick: () => void;
  onCategoryChange: (category: string) => void;
}

function BrandLogo({ category }: { category: string }) {
  const theme = BRAND_THEMES[category];
  if (!theme) return null;

  switch (category) {
    case 'laptop':
      return <span className="text-xl sm:text-2xl font-extrabold tracking-tight">bol<span className="text-blue-300">.com</span></span>;
    case 'sneakers':
      return <span className="text-xl sm:text-2xl font-extrabold tracking-tight uppercase">Nike</span>;
    case 'boodschappen':
      return <span className="text-xl sm:text-2xl font-extrabold tracking-tight">Thuisbezorgd<span className="text-orange-200">.nl</span></span>;
    case 'hotel':
      return <span className="text-xl sm:text-2xl font-extrabold tracking-tight">Booking<span className="text-blue-300">.com</span></span>;
    default:
      return <span className="text-xl sm:text-2xl font-extrabold tracking-tight">{theme.name}</span>;
  }
}

export function Header({ activeCategory, onCartClick, onCategoryChange }: HeaderProps) {
  const { itemCount } = useCart();
  const theme = BRAND_THEMES[activeCategory] || BRAND_THEMES.laptop;

  return (
    <header>
      {/* Main header bar */}
      <div className={`${theme.headerBg} text-white transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <BrandLogo category={activeCategory} />
              <span className={`text-xs ${theme.accentText} hidden sm:block`}>
                powered by Mollie
              </span>
            </div>

            {/* Search bar (decorative) */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder={theme.searchPlaceholder}
                  className={`w-full bg-white/10 backdrop-blur text-white placeholder-white/50 rounded-lg px-4 py-2 text-sm border border-white/20 focus:outline-none focus:bg-white/20 focus:border-white/40`}
                  readOnly
                />
                <svg
                  className="absolute right-3 top-2.5 w-4 h-4 text-white/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Cart icon */}
            <button
              onClick={onCartClick}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className={`${theme.headerBgDark} text-white/80 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-6 h-10 text-sm overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => onCategoryChange(cat.key)}
                className={`cursor-pointer transition-colors shrink-0 ${
                  activeCategory === cat.key
                    ? 'text-white font-semibold'
                    : 'hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
            <span className="hover:text-white cursor-pointer transition-colors shrink-0">
              Customer Service
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
