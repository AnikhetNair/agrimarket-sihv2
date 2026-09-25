import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getMarketData } from '../../services/marketData';
import {
  TrendingUp,
  Info,
} from 'lucide-react';

export const FarmerMarketPage: React.FC = () => {
  const [selectedCommodity, setSelectedCommodity] = useState('Carrot');
  const [selectedLocation, setSelectedLocation] = useState('Nashik');

  const commodities = ['Carrot', 'Mango', 'Potato', 'Banana', 'Apple'];
  const locations = ['Nashik', 'Pune', 'Mumbai', 'Nagpur'];

  // Retrieve deterministic market profile based on crop + location
  const marketProfile = useMemo(() => {
    const marketName =
      selectedCommodity === 'Apple' && selectedLocation === 'Punjab'
        ? 'Khanna APMC (Punjab)'
        : `${selectedLocation} APMC`;
    return getMarketData(selectedCommodity, marketName);
  }, [selectedCommodity, selectedLocation]);

  // Derive historical data from market profile (last 14 points formatted nicely)
  const historicalData = useMemo(() => {
    return marketProfile.historicalPrices.slice(-14).map((p, idx, arr) => ({
      month: p.date.substring(5), // MM-DD
      price: p.price,
      forecast: idx >= arr.length - 3 ? Math.round(p.price * (marketProfile.trend === 'up' ? 1.05 : 0.97)) : null,
    }));
  }, [marketProfile]);

  // Market comparison across corridors showing raw price vs net realization
  const marketComparisons = useMemo(() => {
    const base = marketProfile.currentPrice;
    return [
      {
        market: `${selectedLocation} APMC (Primary Hub)`,
        state: 'Maharashtra',
        distanceKm: 18,
        modalPrice: base,
        transportDeduction: 60,
        storageHandling: 30,
        netRealisation: base - 90,
        badge: 'Lowest Logistics Overhead',
      },
      {
        market: 'Pimpalgaon Baswant',
        state: 'Maharashtra',
        distanceKm: 28,
        modalPrice: base + 30,
        transportDeduction: 80,
        storageHandling: 30,
        netRealisation: base - 80,
        badge: 'Best Local Net Advantage',
      },
      {
        market: 'Pune Market Yard',
        state: 'Maharashtra',
        distanceKm: 190,
        modalPrice: base + 200,
        transportDeduction: 280,
        storageHandling: 40,
        netRealisation: base - 120,
        badge: 'High Headline Price, Higher Freight',
      },
      {
        market: 'Vashi APMC (Navi Mumbai)',
        state: 'Maharashtra',
        distanceKm: 175,
        modalPrice: base + 280,
        transportDeduction: 290,
        storageHandling: 50,
        netRealisation: base - 60,
        badge: 'Urban Demand Corridor',
      },
      {
        market: 'Azadpur Mandi (Delhi)',
        state: 'Delhi (NCR)',
        distanceKm: 1250,
        modalPrice: base + 550,
        transportDeduction: 750,
        storageHandling: 90,
        netRealisation: base - 290,
        badge: 'Negative Advantage due to Distance',
      },
    ];
  }, [marketProfile, selectedLocation]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
            APMC Market Intelligence & Predictive Spreads
          </h1>
          <p className="text-xs text-[#454955] mt-0.5">
            Transparent mandi benchmark analytics, historical trends, and net spatial realisation
          </p>
        </div>

        {/* Filters: Commodity & Benchmark Hub */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1 bg-[#F2E8CF] p-1 rounded-lg border border-slate-200">
            {commodities.map((cmd) => (
              <button
                key={cmd}
                onClick={() => setSelectedCommodity(cmd)}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  selectedCommodity === cmd
                    ? 'bg-[#386641] text-white shadow-xs'
                    : 'text-[#454955] hover:text-[#0d0a0b]'
                }`}
              >
                {cmd}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 bg-[#F2E8CF] p-1 rounded-lg border border-slate-200">
            {locations.map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  selectedLocation === loc
                    ? 'bg-[#386641] text-white shadow-xs'
                    : 'text-[#454955] hover:text-[#0d0a0b]'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: 12-Month Price Trend & Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Historical Trend Chart (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-[#0d0a0b]">
                Historical Price Trend & Near-Term Forecast
              </h2>
              <span className="text-[11px] text-[#454955]">
                Modal Price History • {selectedLocation} APMC Hub
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#386641] bg-[#6A994E]/15 px-2 py-0.5 rounded border border-[#6A994E]/30">
              Current Benchmark: ₹{marketProfile.currentPrice.toLocaleString('en-IN')}/Q
            </span>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#386641" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#386641" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6A994E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6A994E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#454955" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#454955"
                  fontSize={11}
                  domain={[
                    Math.round(marketProfile.minPrice * 0.9),
                    Math.round(marketProfile.maxPrice * 1.1),
                  ]}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                  }}
                  formatter={(val: any) => [`₹${val}/Q`, 'Price']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#386641"
                  strokeWidth={2.5}
                  fill="url(#priceGradient)"
                  name="Historical Modal Price"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#6A994E"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  fill="url(#forecastGradient)"
                  name="Predictive Corridor"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-[#454955] border-t border-slate-100 pt-3">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-1 bg-[#386641] inline-block rounded"></span>
                <span>Historical Modal Rates</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-1 bg-[#6A994E] inline-block rounded"></span>
                <span>AI Predictive Corridor</span>
              </span>
            </div>
            <span className="italic">
              Current Trading Volume: {marketProfile.arrivalVolume.toLocaleString('en-IN')} Quintals
            </span>
          </div>
        </div>

        {/* Prototype Forecast Card (4 Columns) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-[#454955]">
              Algorithmic Outlook
            </span>
            <span className="text-[10px] uppercase font-bold text-[#386641] bg-[#6A994E]/15 px-2 py-0.5 rounded border border-[#6A994E]/30">
              Predictive Corridor
            </span>
          </div>

          <div className="bg-[#F2E8CF] rounded-lg p-3.5 border border-slate-200 text-xs space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[#454955]">Short-Term Direction</span>
              <span
                className={`font-bold flex items-center space-x-1 ${
                  marketProfile.trend === 'up'
                    ? 'text-[#386641]'
                    : marketProfile.trend === 'down'
                    ? 'text-red-700'
                    : 'text-[#454955]'
                }`}
              >
                <span>
                  {marketProfile.trend === 'up'
                    ? `↑ Bullish (+${marketProfile.priceChangePercent}%)`
                    : marketProfile.trend === 'down'
                    ? `↓ Easing (${marketProfile.priceChangePercent}%)`
                    : `→ Stable (+${marketProfile.priceChangePercent}%)`}
                </span>
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[#454955]">Forecast Range</span>
              <span className="font-extrabold text-[#0d0a0b] text-sm">
                ₹{Math.round(marketProfile.currentPrice * 0.96).toLocaleString('en-IN')} – ₹
                {Math.round(marketProfile.currentPrice * 1.08).toLocaleString('en-IN')} / Q
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[#454955]">Optimal Sale Window</span>
              <span className="font-semibold text-[#0d0a0b]">Next 5–7 Days</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#454955]">
            <h4 className="font-semibold text-[#0d0a0b] text-[11px] uppercase tracking-wider">
              Market Intelligence Commentary
            </h4>
            <div className="p-2.5 bg-[#F2E8CF] rounded-lg border border-slate-200 text-[#0d0a0b] leading-relaxed text-[11px]">
              {marketProfile.insight}
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-[11px]">
              Benchmarked against official APMC electronic daily auction records.
            </span>
          </div>
        </div>
      </div>

      {/* Market Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#0d0a0b]">
              Inter-Mandi Realization & Spatial Arbitrage Matrix
            </h2>
            <p className="text-xs text-[#454955] mt-0.5">
              Evaluating gross headline mandi price against localized freight and transit handling costs
            </p>
          </div>
          <span className="text-xs font-semibold text-[#386641] bg-[#6A994E]/15 px-2.5 py-1 rounded-md border border-[#6A994E]/30 self-start">
            Optimal Farmgate Net Realization
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[#454955] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Mandi / Destination</th>
                <th className="py-2.5 px-3 text-right">Distance</th>
                <th className="py-2.5 px-3 text-right">Modal Price</th>
                <th className="py-2.5 px-3 text-right">Est. Freight</th>
                <th className="py-2.5 px-3 text-right">Dock/Handling</th>
                <th className="py-2.5 px-3 text-right font-bold text-[#0d0a0b]">Net Realisation</th>
                <th className="py-2.5 px-3">Strategic Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {marketComparisons.map((c, i) => (
                <tr key={i} className="hover:bg-[#F2E8CF]/70 transition">
                  <td className="py-3 px-3 font-semibold text-[#0d0a0b]">
                    <div>{c.market}</div>
                    <div className="text-[10px] text-[#454955] font-normal">{c.state}</div>
                  </td>
                  <td className="py-3 px-3 text-right text-[#454955] font-mono">
                    {c.distanceKm} km
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#0d0a0b] font-mono">
                    ₹{c.modalPrice.toLocaleString('en-IN')}/Q
                  </td>
                  <td className="py-3 px-3 text-right text-red-600 font-mono">
                    -₹{c.transportDeduction}
                  </td>
                  <td className="py-3 px-3 text-right text-[#454955] font-mono">
                    -₹{c.storageHandling}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-sm text-[#386641] bg-[#6A994E]/10">
                    ₹{c.netRealisation.toLocaleString('en-IN')}/Q
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#F2E8CF] text-[#454955] border border-slate-200">
                      {c.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
