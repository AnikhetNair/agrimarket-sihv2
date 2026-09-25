import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { SEED_HISTORICAL_PRICES } from '../data/seedMarkets';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY;

export const SEED_MOCK_COMMODITIES = [
  { id: 'cmd-tomato', name: 'Tomato', variety: 'Hybrid (Abhinav)', unit: 'Quintal', category: 'Vegetable', is_active: true },
  { id: 'cmd-onion', name: 'Onion', variety: 'Garwa / Summer Red', unit: 'Quintal', category: 'Vegetable', is_active: true },
  { id: 'cmd-potato', name: 'Potato', variety: 'Jyoti / 3797', unit: 'Quintal', category: 'Tuber', is_active: true },
  { id: 'cmd-soybean', name: 'Soybean', variety: 'JS 335', unit: 'Quintal', category: 'Oilseed', is_active: true },
  { id: 'cmd-wheat', name: 'Wheat', variety: 'Lokwan / Sharbati', unit: 'Quintal', category: 'Cereal', is_active: true },
];

export const SEED_MOCK_MARKETS = [
  { id: 'mkt-lasalgaon', name: 'Lasalgaon APMC', district: 'Nashik', state: 'Maharashtra', tier: 'NEARBY', distance_km: 28, is_active: true },
  { id: 'mkt-nashik', name: 'Nashik APMC', district: 'Nashik', state: 'Maharashtra', tier: 'NEARBY', distance_km: 18, is_active: true },
  { id: 'mkt-pimpalgaon', name: 'Pimpalgaon Baswant', district: 'Nashik', state: 'Maharashtra', tier: 'NEARBY', distance_km: 22, is_active: true },
  { id: 'mkt-dindori', name: 'Dindori Sub-Mandi', district: 'Nashik', state: 'Maharashtra', tier: 'NEARBY', distance_km: 12, is_active: true },
  { id: 'mkt-narayangaon', name: 'Narayangaon Mandi', district: 'Pune', state: 'Maharashtra', tier: 'NEARBY', distance_km: 95, is_active: true },
  { id: 'mkt-pune', name: 'Pune APMC (Gultekdi)', district: 'Pune', state: 'Maharashtra', tier: 'REGIONAL', distance_km: 210, is_active: true },
  { id: 'mkt-vashi', name: 'Vashi APMC (Navi Mumbai)', district: 'Thane', state: 'Maharashtra', tier: 'REGIONAL', distance_km: 165, is_active: true },
  { id: 'mkt-rahata', name: 'Rahata Mandi', district: 'Ahmednagar', state: 'Maharashtra', tier: 'REGIONAL', distance_km: 85, is_active: true },
  { id: 'mkt-surat', name: 'Surat APMC', district: 'Surat', state: 'Gujarat', tier: 'REGIONAL', distance_km: 240, is_active: true },
  { id: 'mkt-indore', name: 'Indore APMC', district: 'Indore', state: 'Madhya Pradesh', tier: 'REGIONAL', distance_km: 410, is_active: true },
  { id: 'mkt-nagpur', name: 'Nagpur APMC', district: 'Nagpur', state: 'Maharashtra', tier: 'REGIONAL', distance_km: 650, is_active: true },
  { id: 'mkt-ahmedabad', name: 'Ahmedabad APMC', district: 'Ahmedabad', state: 'Gujarat', tier: 'REGIONAL', distance_km: 490, is_active: true },
  { id: 'mkt-azadpur', name: 'Azadpur Terminal Mandi', district: 'North Delhi', state: 'Delhi', tier: 'NATIONAL_BENCHMARK', distance_km: 1280, is_active: true },
  { id: 'mkt-kolar', name: 'Kolar APMC (Tomato Hub)', district: 'Kolar', state: 'Karnataka', tier: 'NATIONAL_BENCHMARK', distance_km: 1040, is_active: true },
  { id: 'mkt-yeshwanthpur', name: 'Yeshwanthpur APMC', district: 'Bengaluru Urban', state: 'Karnataka', tier: 'NATIONAL_BENCHMARK', distance_km: 980, is_active: true },
  { id: 'mkt-agra', name: 'Agra Mandi', district: 'Agra', state: 'Uttar Pradesh', tier: 'NATIONAL_BENCHMARK', distance_km: 1120, is_active: true },
];

function buildMockPricesAndArrivals() {
  const prices: any[] = [];
  const arrivals: any[] = [];

  for (const row of SEED_HISTORICAL_PRICES) {
    const cmd = SEED_MOCK_COMMODITIES.find(
      (c) => c.name.toLowerCase() === row.commodity.toLowerCase()
    );
    const mkt = SEED_MOCK_MARKETS.find(
      (m) => m.name.toLowerCase() === row.market.toLowerCase()
    );

    const cmdId = cmd ? cmd.id : `cmd-${row.commodity.toLowerCase()}`;
    const mktId = mkt ? mkt.id : `mkt-${row.market.replace(/\s+/g, '-').toLowerCase()}`;

    const priceItem = {
      id: row.id,
      price_date: row.date,
      min_price: row.min_price,
      modal_price: row.modal_price,
      max_price: row.max_price,
      unit: row.unit || 'Quintal',
      source: row.source || 'AGMARKNET / e-NAM',
      commodity_id: cmdId,
      commodity_name: row.commodity,
      market_id: mktId,
      market_name: row.market,
      commodities: {
        id: cmdId,
        name: row.commodity,
        variety: cmd?.variety || 'Standard',
      },
      markets: {
        id: mktId,
        name: row.market,
        district: row.district,
        state: row.state,
      },
    };

    prices.push(priceItem);

    arrivals.push({
      id: `arr-${row.id}`,
      arrival_date: row.date,
      quantity: row.arrival_quantity,
      unit: row.unit || 'Quintal',
      source: row.source || 'Mandi Arrival Reporting',
      commodity_id: cmdId,
      commodity_name: row.commodity,
      market_id: mktId,
      market_name: row.market,
      commodities: {
        id: cmdId,
        name: row.commodity,
        variety: cmd?.variety || 'Standard',
      },
      markets: {
        id: mktId,
        name: row.market,
        district: row.district,
        state: row.state,
      },
    });
  }

  return { prices, arrivals };
}

const { prices: MOCK_PRICES, arrivals: MOCK_ARRIVALS } = buildMockPricesAndArrivals();

class MockQueryBuilder {
  private data: any[];

  constructor(initialData: any[]) {
    this.data = [...initialData];
  }

  select(_fields?: string) {
    return this;
  }

  eq(field: string, val: any) {
    this.data = this.data.filter((item) => {
      if (field === 'commodity_id') {
        return (
          item.commodity_id === val ||
          item.id === val ||
          item.commodity_name?.toLowerCase() === String(val).toLowerCase()
        );
      }
      if (field === 'market_id') {
        return (
          item.market_id === val ||
          item.id === val ||
          item.market_name?.toLowerCase() === String(val).toLowerCase()
        );
      }
      return item[field] === val || String(item[field]).toLowerCase() === String(val).toLowerCase();
    });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending ?? true;
    this.data.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
    return this;
  }

  async single() {
    const record = this.data[0] || null;
    return {
      data: record,
      error: record ? null : { message: 'Row not found' },
    };
  }

  then(resolve: (value: { data: any[]; error: any }) => any, reject?: (reason: any) => any) {
    return Promise.resolve({
      data: this.data,
      error: null,
    }).then(resolve, reject);
  }
}

function createMockSupabaseAdmin() {
  return {
    from(tableName: string) {
      if (tableName === 'markets') {
        return new MockQueryBuilder(SEED_MOCK_MARKETS);
      }
      if (tableName === 'commodities') {
        return new MockQueryBuilder(SEED_MOCK_COMMODITIES);
      }
      if (tableName === 'market_prices') {
        return new MockQueryBuilder(MOCK_PRICES);
      }
      if (tableName === 'market_arrivals') {
        return new MockQueryBuilder(MOCK_ARRIVALS);
      }
      return new MockQueryBuilder([]);
    },
  };
}

let clientInstance: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err: any) {
    console.warn(`[Supabase Admin] Initialization error (${err?.message}). Using in-memory fallback.`);
    clientInstance = createMockSupabaseAdmin();
  }
} else {
  console.info('[Supabase Admin] No remote credentials found. In-memory data provider active.');
  clientInstance = createMockSupabaseAdmin();
}

export const supabaseAdmin = clientInstance;

