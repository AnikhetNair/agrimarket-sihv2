export interface CommodityMarketProfile {
  commodity: string;
  market: string;
  state: string;
  district: string;
  basePrice: number;
  volatility: number;
  baseArrivals: number;
  priceRange: [number, number];
  typicalArrivals: [number, number];
  primaryTrend: 'up' | 'down' | 'stable';
  trendPercent: number;
  insightTemplate: string;
}

export const COMMODITY_MARKET_PROFILES: Record<string, CommodityMarketProfile> = {
  'Carrot-Nashik APMC': {
    commodity: 'Carrot',
    market: 'Nashik APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    basePrice: 2850,
    volatility: 420,
    baseArrivals: 2400,
    priceRange: [1800, 3200],
    typicalArrivals: [1600, 3400],
    primaryTrend: 'up',
    trendPercent: 8.4,
    insightTemplate:
      'Carrot modal prices at Nashik APMC have appreciated 8.4% over the past 14 days, supported by tightening farmgate arrivals (-11%) from the Niphad and Dindori clusters.',
  },
  'Carrot-Lasalgaon APMC': {
    commodity: 'Carrot',
    market: 'Lasalgaon APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    basePrice: 2780,
    volatility: 390,
    baseArrivals: 1950,
    priceRange: [1750, 3100],
    typicalArrivals: [1400, 2800],
    primaryTrend: 'up',
    trendPercent: 6.2,
    insightTemplate:
      'Lasalgaon APMC reported strong buyer off-take for Kuroda carrots, with modal rates closing at ₹2,780/Q amid competitive institutional bidding.',
  },
  'Carrot-Pimpalgaon Baswant': {
    commodity: 'Carrot',
    market: 'Pimpalgaon Baswant',
    state: 'Maharashtra',
    district: 'Nashik',
    basePrice: 2920,
    volatility: 460,
    baseArrivals: 3100,
    priceRange: [1900, 3350],
    typicalArrivals: [2200, 4200],
    primaryTrend: 'up',
    trendPercent: 9.8,
    insightTemplate:
      'Pimpalgaon Baswant carrot terminal recorded peak Grade A premium at ₹2,920/Q; cold storage inventory remains at 82% utilization.',
  },
  'Carrot-Pune APMC (Gultekdi)': {
    commodity: 'Carrot',
    market: 'Pune APMC (Gultekdi)',
    state: 'Maharashtra',
    district: 'Pune',
    basePrice: 3150,
    volatility: 380,
    baseArrivals: 4100,
    priceRange: [2400, 3600],
    typicalArrivals: [3200, 5200],
    primaryTrend: 'up',
    trendPercent: 7.5,
    insightTemplate:
      'Urban consumption demand in Pune metro pushed carrot spot rates to ₹3,150/Q, maintaining a ₹300/Q regional arbitrage over Nashik farmgate.',
  },
  'Apple-Khanna APMC (Punjab)': {
    commodity: 'Apple',
    market: 'Khanna APMC (Punjab)',
    state: 'Punjab',
    district: 'Ludhiana',
    basePrice: 2475,
    volatility: 110,
    baseArrivals: 8500,
    priceRange: [2275, 2680],
    typicalArrivals: [6500, 11000],
    primaryTrend: 'stable',
    trendPercent: 1.2,
    insightTemplate:
      'Apple spot prices in Khanna APMC exhibit low volatility at ₹2,475/Q, anchored by robust cold-chain buffers and consistent bulk arrivals.',
  },
  'Apple-Nashik APMC': {
    commodity: 'Apple',
    market: 'Nashik APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    basePrice: 2520,
    volatility: 130,
    baseArrivals: 1800,
    priceRange: [2300, 2750],
    typicalArrivals: [1200, 2400],
    primaryTrend: 'stable',
    trendPercent: 0.8,
    insightTemplate:
      'Fresh table apple varieties trade steadily at ₹2,520/Q in Nashik with balanced retail demand and steady weekly clearances.',
  },
  'Mango-Lasalgaon APMC': {
    commodity: 'Mango',
    market: 'Lasalgaon APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    basePrice: 2280,
    volatility: 680,
    baseArrivals: 14500,
    priceRange: [1200, 3500],
    typicalArrivals: [9000, 21000],
    primaryTrend: 'down',
    trendPercent: -5.6,
    insightTemplate:
      'Mango benchmark rates at Lasalgaon eased 5.6% to ₹2,280/Q as seasonal harvest dispatches led to daily mandi arrivals of 14,500 quintals.',
  },
  'Mango-Nashik APMC': {
    commodity: 'Mango',
    market: 'Nashik APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    basePrice: 2210,
    volatility: 640,
    baseArrivals: 9800,
    priceRange: [1250, 3400],
    typicalArrivals: [6000, 14000],
    primaryTrend: 'down',
    trendPercent: -4.8,
    insightTemplate:
      'Nashik APMC mango arrivals surged 18% over the fortnight, driving modal transactions toward ₹2,210/Q for standard graded quality.',
  },
  'Potato-Agra Mandi': {
    commodity: 'Potato',
    market: 'Agra Mandi',
    state: 'Uttar Pradesh',
    district: 'Agra',
    basePrice: 1720,
    volatility: 220,
    baseArrivals: 12000,
    priceRange: [1350, 2150],
    typicalArrivals: [8000, 16000],
    primaryTrend: 'stable',
    trendPercent: 2.1,
    insightTemplate:
      'Agra cold store dispatches show steady wholesale clearing at ₹1,720/Q for processing grade 3797 potatoes with stable inter-state railway rakes.',
  },
  'Potato-Nashik APMC': {
    commodity: 'Potato',
    market: 'Nashik APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    basePrice: 1880,
    volatility: 190,
    baseArrivals: 3200,
    priceRange: [1500, 2300],
    typicalArrivals: [2000, 4500],
    primaryTrend: 'up',
    trendPercent: 3.4,
    insightTemplate:
      'Potato rates in Nashik remain resilient at ₹1,880/Q, supported by regular transit intake from northern storage corridors.',
  },
  'Banana-Indore APMC': {
    commodity: 'Banana',
    market: 'Indore APMC',
    state: 'Madhya Pradesh',
    district: 'Indore',
    basePrice: 4680,
    volatility: 310,
    baseArrivals: 7200,
    priceRange: [4100, 5200],
    typicalArrivals: [4500, 10500],
    primaryTrend: 'up',
    trendPercent: 4.5,
    insightTemplate:
      'Banana rates in Indore reached ₹4,680/Q on aggressive processing demand from retail chains and firm transit clearances.',
  },
  'Banana-Nashik APMC': {
    commodity: 'Banana',
    market: 'Nashik APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    basePrice: 4590,
    volatility: 290,
    baseArrivals: 2100,
    priceRange: [4050, 5100],
    typicalArrivals: [1200, 3200],
    primaryTrend: 'stable',
    trendPercent: 1.8,
    insightTemplate:
      'Nashik banana trade held steady at ₹4,590/Q with export-grade lots commanding a ₹75/Q premium from regional distributors.',
  },
};
