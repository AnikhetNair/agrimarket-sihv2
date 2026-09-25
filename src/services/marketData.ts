import { COMMODITY_MARKET_PROFILES, CommodityMarketProfile } from '../data/marketProfiles';

export interface MarketHistoricalPoint {
  date: string;
  price: number;
  arrivals?: number;
}

export interface MarketData {
  commodity: string;
  market: string;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivalVolume: number;
  historicalPrices: MarketHistoricalPoint[];
  priceChangePercent: number;
  trend: 'up' | 'down' | 'stable';
  insight: string;
}

/**
 * Deterministic string hash function
 */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Linear Congruential Generator for deterministic pseudo-random sequences
 */
function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Retrieves deterministic market intelligence data for any commodity + market combination
 */
export function getMarketData(commodity: string, market: string): MarketData {
  const profileKey = `${commodity}-${market}`;
  const baseProfile = COMMODITY_MARKET_PROFILES[profileKey];

  // Default fallback if arbitrary custom market is selected
  const defaultProfile: CommodityMarketProfile = {
    commodity,
    market,
    state: 'Maharashtra',
    district: market.includes('Nashik') ? 'Nashik' : 'Pune',
    basePrice: commodity === 'Carrot' ? 2800 : commodity === 'Mango' ? 2200 : commodity === 'Banana' ? 4600 : commodity === 'Apple' ? 2500 : 1800,
    volatility: commodity === 'Carrot' ? 400 : commodity === 'Mango' ? 600 : commodity === 'Banana' ? 300 : commodity === 'Apple' ? 120 : 200,
    baseArrivals: commodity === 'Carrot' ? 2200 : commodity === 'Mango' ? 12000 : commodity === 'Banana' ? 7000 : commodity === 'Apple' ? 8000 : 3500,
    priceRange: [2000, 3200],
    typicalArrivals: [1500, 5000],
    primaryTrend: 'up',
    trendPercent: 5.4,
    insightTemplate: `${commodity} transactions in ${market} exhibit healthy volumes with steady wholesale clearing.`,
  };

  const profile = baseProfile || defaultProfile;
  const seed = hash(profileKey);
  const rand = createPrng(seed);

  // Generate 30 consecutive daily historical points ending at reference date (2026-09-07)
  const baseDate = new Date('2026-09-07T00:00:00Z');
  const historicalPrices: MarketHistoricalPoint[] = [];

  let runningPrice = profile.basePrice;
  const trendStep = (profile.trendPercent / 100) * (profile.basePrice / 30);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Seasonal cyclic perturbation + trend step
    const cycle = Math.sin((i / 7) * Math.PI) * (profile.volatility * 0.35);
    const noise = (rand() - 0.5) * (profile.volatility * 0.25);
    const price = Math.round(
      Math.max(
        profile.priceRange[0],
        Math.min(profile.priceRange[1], runningPrice - i * trendStep + cycle + noise)
      ) / 10
    ) * 10;

    // Inversely correlated arrivals
    const arrivalNoise = (rand() - 0.5) * (profile.baseArrivals * 0.2);
    const arrivals = Math.round(
      Math.max(
        profile.typicalArrivals[0],
        Math.min(profile.typicalArrivals[1], profile.baseArrivals - (cycle * 2.5) + arrivalNoise)
      )
    );

    historicalPrices.push({
      date: dateStr,
      price,
      arrivals,
    });
  }

  const latestPoint = historicalPrices[historicalPrices.length - 1];
  const firstPoint = historicalPrices[0];
  const allPrices = historicalPrices.map((p) => p.price);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const currentPrice = latestPoint.price;
  const modalPrice = currentPrice;
  const arrivalVolume = latestPoint.arrivals || profile.baseArrivals;

  const actualChangePercent = parseFloat(
    (((currentPrice - firstPoint.price) / firstPoint.price) * 100).toFixed(1)
  );

  const trend: 'up' | 'down' | 'stable' =
    actualChangePercent > 2 ? 'up' : actualChangePercent < -2 ? 'down' : 'stable';

  const insight = profile.insightTemplate;

  return {
    commodity,
    market,
    currentPrice,
    minPrice,
    maxPrice,
    modalPrice,
    arrivalVolume,
    historicalPrices,
    priceChangePercent: actualChangePercent,
    trend,
    insight,
  };
}

/**
 * Returns available markets grouped by commodity
 */
export function getAvailableMarketsForCommodity(commodity: string): string[] {
  const defaults = [
    'Nashik APMC',
    'Lasalgaon APMC',
    'Pimpalgaon Baswant',
    'Pune APMC (Gultekdi)',
  ];

  if (commodity === 'Apple') {
    return ['Khanna APMC (Punjab)', 'Nashik APMC', 'Pune APMC (Gultekdi)'];
  }
  if (commodity === 'Potato') {
    return ['Agra Mandi', 'Nashik APMC', 'Pune APMC (Gultekdi)'];
  }
  if (commodity === 'Banana') {
    return ['Indore APMC', 'Nashik APMC', 'Lasalgaon APMC'];
  }

  return defaults;
}
