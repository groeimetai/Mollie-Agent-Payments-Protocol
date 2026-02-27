// Shared product database — used by both agent (server) and UI (client)
// Keep in sync: agents/shopping.ts imports from here

export interface ProductSpecs {
  [key: string]: string | undefined;
  weight: string;
}

export interface Product {
  id: string;
  name: string;
  vendor: string;
  price: number;
  currency: string;
  category: string;
  specs: ProductSpecs;
  rating: number;
  reviewCount: number;
  url: string;
  deliveryTime: string;
}

export const PRODUCT_DATABASE: Product[] = [
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
  // LAPTOP HOEZEN — bol.com
  // ═══════════════════════════════════════════
  {
    id: 'bol-case-logic-sleeve-14',
    name: 'Case Logic Laptop Sleeve 14 inch',
    vendor: 'Bol.com',
    price: 19.99,
    currency: 'EUR',
    category: 'laptop',
    specs: {
      formaat: '14 inch',
      materiaal: 'Nylon met fleece voering',
      bescherming: 'Schokbestendig, waterafstotend',
      sluiting: 'Rits',
      kleur: 'Zwart',
      weight: '0.2kg',
    },
    rating: 4.4,
    reviewCount: 1243,
    url: 'https://www.bol.com/nl/p/case-logic-sleeve-14',
    deliveryTime: '1-2 werkdagen',
  },
  {
    id: 'bol-tomtoc-hardshell-16',
    name: 'Tomtoc Hardshell Laptophoes 16 inch',
    vendor: 'Bol.com',
    price: 34.95,
    currency: 'EUR',
    category: 'laptop',
    specs: {
      formaat: '16 inch',
      materiaal: 'Hardshell EVA + Oxford stof',
      bescherming: 'Militaire valtest, waterdicht',
      sluiting: 'YKK rits',
      kleur: 'Navy Blauw',
      weight: '0.35kg',
    },
    rating: 4.7,
    reviewCount: 876,
    url: 'https://www.bol.com/nl/p/tomtoc-hardshell-16',
    deliveryTime: '1-2 werkdagen',
  },
  {
    id: 'bol-thule-gauntlet-15',
    name: 'Thule Gauntlet 4.0 Laptop Sleeve 15"',
    vendor: 'Bol.com',
    price: 44.99,
    currency: 'EUR',
    category: 'laptop',
    specs: {
      formaat: '15 inch',
      materiaal: 'Hardshell met zachte voering',
      bescherming: 'Rigide constructie, hoekbescherming',
      sluiting: 'Rits met kabelbescherming',
      kleur: 'Zwart',
      weight: '0.3kg',
    },
    rating: 4.6,
    reviewCount: 654,
    url: 'https://www.bol.com/nl/p/thule-gauntlet-15',
    deliveryTime: 'Morgen in huis',
  },

  // ═══════════════════════════════════════════
  // FASHION — Nike.nl
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
    name: "Nike Air Force 1 '07",
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
  // DRANKEN — Thuisbezorgd (boodschappen)
  // ═══════════════════════════════════════════
  {
    id: 'ah-drankenpakket-cola',
    name: 'Coca-Cola, Fanta & Sprite Pakket (6-pack)',
    vendor: 'Albert Heijn',
    price: 7.49,
    currency: 'EUR',
    category: 'boodschappen',
    specs: {
      items: 'Coca-Cola 2×1.5L, Fanta 2×1.5L, Sprite 2×1.5L',
      inhoud: '6 × 1.5L (9 liter totaal)',
      type: 'Frisdranken',
      bewaring: 'Koel serveren',
      weight: '9.2kg',
    },
    rating: 4.5,
    reviewCount: 1432,
    url: 'https://www.ah.nl/producten/frisdranken-pakket',
    deliveryTime: 'Vandaag bezorgd (voor 22:00 besteld)',
  },
  {
    id: 'jumbo-huiswijn-rood',
    name: "Huiswijn Merlot — Pays d'Oc (0.75L)",
    vendor: 'Jumbo',
    price: 5.99,
    currency: 'EUR',
    category: 'boodschappen',
    specs: {
      items: 'Merlot rode wijn, Zuid-Frankrijk',
      inhoud: '0.75L (1 fles)',
      type: 'Wijn',
      bewaring: 'Op kamertemperatuur, na openen koelen',
      weight: '1.2kg',
    },
    rating: 4.0,
    reviewCount: 876,
    url: 'https://www.jumbo.com/producten/huiswijn-merlot',
    deliveryTime: 'Vandaag bezorgd (voor 21:00 besteld)',
  },
  {
    id: 'picnic-verse-jus',
    name: "Verse Jus d'Orange (2L)",
    vendor: 'Picnic',
    price: 4.29,
    currency: 'EUR',
    category: 'boodschappen',
    specs: {
      items: 'Vers geperste sinaasappelsap, niet uit concentraat',
      inhoud: '2L (1 pak)',
      type: 'Sap',
      bewaring: 'Koelkast, 3 dagen houdbaar na openen',
      weight: '2.1kg',
    },
    rating: 4.6,
    reviewCount: 2134,
    url: 'https://www.picnic.app/nl/producten/jus-dorange',
    deliveryTime: 'Volgende bezorgmoment beschikbaar',
  },

  // ═══════════════════════════════════════════
  // SNEAKER VERZORGING — Nike / Zalando
  // ═══════════════════════════════════════════
  {
    id: 'zalando-crep-protect',
    name: 'Crep Protect Beschermspray',
    vendor: 'Zalando',
    price: 14.95,
    currency: 'EUR',
    category: 'sneakers',
    specs: {
      sprayType: 'Invisible beschermspray',
      inhoud: '200ml',
      geschiktVoor: 'Alle materialen (leer, suede, canvas, mesh)',
      bescherming: 'Water- en vuilafstotend',
      werkingsduur: 'Tot 4 weken per behandeling',
      weight: '0.25kg',
    },
    rating: 4.4,
    reviewCount: 3456,
    url: 'https://www.zalando.nl/crep-protect-spray',
    deliveryTime: 'Gratis bezorging, 1-3 werkdagen',
  },
  {
    id: 'nike-cleaning-kit',
    name: 'Jason Markk Essential Sneaker Cleaning Kit',
    vendor: 'Nike.nl',
    price: 19.99,
    currency: 'EUR',
    category: 'sneakers',
    specs: {
      sprayType: 'Schoonmaakset + bescherming',
      inhoud: '118ml oplossing + premium borstel',
      geschiktVoor: 'Alle sneakers en schoenmaterialen',
      bescherming: 'Reinigt en beschermt',
      werkingsduur: 'Ca. 100 schoonmaakbeurten',
      weight: '0.3kg',
    },
    rating: 4.6,
    reviewCount: 1876,
    url: 'https://www.nike.com/nl/cleaning-kit',
    deliveryTime: 'Gratis bezorging, 2-5 werkdagen',
  },

  // ═══════════════════════════════════════════
  // REIZEN — Booking.com
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

export function getProductsByCategory(category: string): Product[] {
  return PRODUCT_DATABASE.filter(
    (p) => p.category.toLowerCase() === category.toLowerCase()
  );
}
