import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Info,
  ArrowRight,
  Shield,
  Sparkles,
  Calculator,
  Calendar,
  Truck,
  Building,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { dataStore } from '../services/dataStore';
import { getMarketComparisonsForCommodity } from '../data/seedMarkets';
import { generateMarketForecast } from '../services/forecastService';
import { calculateSaleDecision } from '../services/recommendationService';
import { calculateNetRealisation } from '../services/netRealisationEngine';
import { getAiExplanation } from '../services/aiService';
import { getMarketData, getAvailableMarketsForCommodity } from '../services/marketData';

export const MarketTerminal: React.FC = () => {
  const [selectedCommodity, setSelectedCommodity] = useState<string>('Carrot');
  const [selectedMarket, setSelectedMarket] = useState<string>('Nashik APMC');
  const [lotQuantity, setLotQuantity] = useState<number>(30); // 30 Quintals default (Golden Lot)
  const [activeTierFilter, setActiveTierFilter] = useState<'ALL' | 'NEARBY' | 'REGIONAL' | 'NATIONAL_BENCHMARK'>('ALL');

  // AI explanation state
  const [aiExplanation, setAiExplanation] = useState<{ source: string; text: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Available markets for current commodity
  const availableMarkets = useMemo(() => {
    return getAvailableMarketsForCommodity(selectedCommodity);
  }, [selectedCommodity]);

  // Deterministic Market Intelligence Data
  const marketData = useMemo(() => {
    return getMarketData(selectedCommodity, selectedMarket);
  }, [selectedCommodity, selectedMarket]);

  // Load historical data for commodity
  const historicalPrices = useMemo(() => {
    return dataStore.getHistoricalPrices(selectedCommodity);
  }, [selectedCommodity]);

  // Current spot modal price from deterministic market data
  const currentPrice = marketData.currentPrice;

  // Multi-tier market comparisons
  const comparisons = useMemo(() => {
    const list = getMarketComparisonsForCommodity(selectedCommodity, 'Nashik', lotQuantity);
    if (activeTierFilter === 'ALL') return list;
    return list.filter((m) => m.tier === activeTierFilter);
  }, [selectedCommodity, lotQuantity, activeTierFilter]);

  // Deterministic Forecast
  const forecast = useMemo(() => {
    return generateMarketForecast(selectedCommodity, selectedMarket, historicalPrices, 7);
  }, [selectedCommodity, selectedMarket, historicalPrices]);

  // Verified buyer offers available in platform for this commodity
  const bestBuyerOffer = useMemo(() => {
    const reqs = dataStore
      .getRequirements()
      .filter((r) => r.commodity.toLowerCase() === selectedCommodity.toLowerCase() && r.status === 'OPEN');
    if (reqs.length === 0) return undefined;
    return Math.max(...reqs.map((r) => r.target_price));
  }, [selectedCommodity]);

  // Recommendation Decision
  const decision = useMemo(() => {
    return calculateSaleDecision({
      commodity: selectedCommodity,
      quantityQuintals: lotQuantity,
      currentMandiPrice: currentPrice,
      forecast,
      bestVerifiedBuyerOffer: bestBuyerOffer,
      distanceToMandiKm: 25,
      holdingDays: 7,
      isPerishable: selectedCommodity === 'Carrot' || selectedCommodity === 'Mango' || selectedCommodity === 'Banana' || selectedCommodity === 'Potato',
    });
  }, [selectedCommodity, lotQuantity, currentPrice, forecast, bestBuyerOffer]);

  // Chart data: 30 daily historical points from deterministic service
  const chartData = useMemo(() => {
    return marketData.historicalPrices.map((p) => ({
      date: p.date.substring(5), // MM-DD
      modalPrice: p.price,
      arrivals: p.arrivals,
    }));
  }, [marketData]);

  // Net Realisation Interactive Calculator State
  const [calcUnitPrice, setCalcUnitPrice] = useState<number>(3100);
  const [calcTransport, setCalcTransport] = useState<number>(2700);
  const [calcStorage, setCalcStorage] = useState<number>(900);
  const [calcServiceFee, setCalcServiceFee] = useState<number>(465);

  const customNetRealisation = useMemo(() => {
    return calculateNetRealisation({
      quantity: lotQuantity,
      unitPrice: calcUnitPrice,
      transportCost: calcTransport,
      storageCost: calcStorage,
      serviceFee: calcServiceFee,
    });
  }, [lotQuantity, calcUnitPrice, calcTransport, calcStorage, calcServiceFee]);

  const handleRequestAiExplanation = async () => {
    setLoadingAi(true);
    const res = await getAiExplanation({
      type: 'SALE_RECOMMENDATION',
      contextData: {
        commodity: selectedCommodity,
        currentMandiPrice: currentPrice,
        forecastRange: `₹${forecast.forecast_low} - ₹${forecast.forecast_high}/Q`,
        bestBuyerOffer,
        recommendedAction: decision.action,
        sellNowNetValue: decision.sellNowValue,
        holdNetValue: decision.holdValue,
        confidence: `${forecast.confidence_score}% (${forecast.confidence_label})`,
      },
    });
    setAiExplanation(res);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Commodity & Market Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Commodity Benchmark:
          </span>
          {['Carrot', 'Mango', 'Potato', 'Banana', 'Apple'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                setSelectedCommodity(cmd);
                const mkts = getAvailableMarketsForCommodity(cmd);
                setSelectedMarket(mkts[0] || 'Nashik APMC');
                setAiExplanation(null);
                if (cmd === 'Carrot') setCalcUnitPrice(3100);
                else if (cmd === 'Mango') setCalcUnitPrice(2300);
                else if (cmd === 'Banana') setCalcUnitPrice(4650);
                else if (cmd === 'Potato') setCalcUnitPrice(1850);
                else setCalcUnitPrice(2500);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                selectedCommodity === cmd
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cmd}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Baseline Market:</span>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            >
              {availableMarkets.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Batch Qty:</span>
            <input
              type="number"
              min="1"
              value={lotQuantity}
              onChange={(e) => setLotQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-slate-800 border border-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-mono text-right"
            />
            <span className="text-slate-400">Quintals</span>
          </div>
        </div>
      </div>

      {/* Hero Analytical Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Current Modal Benchmark */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Current Modal Benchmark</div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">₹{currentPrice.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-400">/ Quintal</span>
          </div>
          <div
            className={`mt-2 flex items-center space-x-1 text-xs ${
              marketData.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {marketData.priceChangePercent >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>
              {marketData.priceChangePercent >= 0 ? `+${marketData.priceChangePercent}%` : `${marketData.priceChangePercent}%`}{' '}
              trend vs 30-day baseline
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Source: {selectedMarket} (AGMARKNET verified)</div>
        </div>

        {/* Metric 2: 7-Day Prototype Forecast */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">7-Day Forecast Range</div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ₹{forecast.forecast_low.toLocaleString('en-IN')}–₹{forecast.forecast_high.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">/Q</span>
          </div>
          <div className="mt-2 flex items-center space-x-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300 font-medium">Midpoint: ₹{forecast.forecast_mid.toLocaleString('en-IN')}/Q</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
              {forecast.confidence_label} Conf ({forecast.confidence_score}%)
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Prototype analytical momentum projection</div>
        </div>

        {/* Metric 3: Best Verified Buyer Offer */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Best Verified Buyer Demand</div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-blue-400">
              {bestBuyerOffer ? `₹${bestBuyerOffer.toLocaleString('en-IN')}` : 'No Open Bid'}
            </span>
            {bestBuyerOffer && <span className="text-xs text-slate-400">/ Quintal</span>}
          </div>
          <div className="mt-2 text-xs text-slate-300">
            {bestBuyerOffer ? (
              <span className="text-emerald-400 font-semibold">
                +₹{bestBuyerOffer - currentPrice}/Q above mandi spot
              </span>
            ) : (
              <span className="text-slate-400">Waiting for verified procurement bids</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Institutional Buyer (FreshKart Foods / Pune Hub)</div>
        </div>

        {/* Metric 4: Decision Engine Recommendation */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Decision Engine Action</div>
          <div className="mt-1">
            <span
              className={`inline-block px-2.5 py-1 rounded text-sm font-bold tracking-wide font-mono ${
                decision.action === 'SELL_NOW'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                  : decision.action === 'HOLD'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                  : 'bg-blue-950 text-blue-300 border border-blue-700/50'
              }`}
            >
              {decision.action === 'SELL_NOW'
                ? 'RECOMMEND: SELL NOW'
                : decision.action === 'HOLD'
                ? 'RECOMMEND: HOLD'
                : 'RECOMMEND: SELL PARTIAL (60/40)'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-300 font-medium">
            Net Realisation: ₹{decision.sellNowValue.toLocaleString('en-IN')} immediate
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Accounts for storage & buyer offer (Rule 36)</div>
        </div>
      </div>

      {/* Recommendation Detailed Banner with AI Explanation Toggle */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-700/80 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white">
                DECISION INTELLIGENCE
              </span>
              <span className="text-xs font-mono text-slate-400">
                Recommended Sale Window: {decision.recommendedSaleWindow.start} to {decision.recommendedSaleWindow.end}
              </span>
            </div>
            <h3 className="text-base font-semibold text-white mt-1.5">
              {decision.action === 'SELL_NOW' && 'Sell immediately to lock in verified buyer offer at favorable net realization'}
              {decision.action === 'HOLD' && 'Hold produce for 5–7 days to capture expected supply squeeze upside'}
              {decision.action === 'SELL_PARTIAL' && 'Execute staggered sale (60% immediate / 40% held in cold storage)'}
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {decision.reasons?.map((r, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="shrink-0 flex flex-col items-end space-y-2">
            <button
              onClick={handleRequestAiExplanation}
              disabled={loadingAi}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 rounded-md text-xs font-medium transition shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{loadingAi ? 'Analyzing platform data...' : 'Explain with Gemini AI'}</span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono">Strictly grounded in platform data</span>
          </div>
        </div>

        {aiExplanation && (
          <div className="mt-4 pt-4 border-t border-slate-700/60 bg-slate-950/60 rounded p-3 text-xs text-slate-200">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Grounded Explanation ({aiExplanation.source})</span>
              </span>
              <span className="text-[10px] font-mono">Anti-Hallucination Safe</span>
            </div>
            <p className="leading-relaxed">{aiExplanation.text}</p>
          </div>
        )}
      </div>

      {/* Main Charts & Net Realisation Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Historical 12-Month Price Trend */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white">12-Month Mandi Price Movement</h4>
              <p className="text-xs text-slate-400">Monthly modal rate (₹/Q) across Maharashtra benchmark mandis</p>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
              {selectedCommodity} / Nashik District
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${val}/Q`, 'Modal Price']}
                />
                <Area type="monotone" dataKey="modalPrice" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#priceColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-400 pt-3 border-t border-slate-800">
            <div>
              <div className="text-[10px] uppercase font-mono">30-Day Floor</div>
              <div className="font-semibold text-slate-200">₹{marketData.minPrice.toLocaleString('en-IN')}/Q</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono">30-Day Peak</div>
              <div className="font-semibold text-slate-200">₹{marketData.maxPrice.toLocaleString('en-IN')}/Q</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono">Daily Mandi Arrivals</div>
              <div className="font-semibold text-emerald-400 font-mono">
                {marketData.arrivalVolume.toLocaleString('en-IN')} Quintals
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-slate-950 rounded border border-slate-800 text-slate-300 text-xs leading-relaxed">
            <span className="font-bold text-emerald-400 font-mono text-[11px] uppercase block mb-1">
              Market Intelligence Insight
            </span>
            {marketData.insight}
          </div>
        </div>

        {/* Right Column (5 cols): Deterministic Net Realisation Engine */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-white">Net Realisation Engine</h4>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                Mandatory Formula
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Net Realisation = Gross Value − Transport − Storage − Service Fees
            </p>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Quantity:</span>
                <span className="font-mono font-semibold text-white">{lotQuantity} Quintals</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Agreed Unit Price:</span>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400">₹</span>
                  <input
                    type="number"
                    value={calcUnitPrice}
                    onChange={(e) => setCalcUnitPrice(parseInt(e.target.value) || 0)}
                    className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-slate-100"
                  />
                  <span className="text-slate-400">/Q</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400 font-mono">Gross Produce Value:</span>
                <span className="font-mono font-bold text-white">₹{customNetRealisation.grossValue.toLocaleString('en-IN')}</span>
              </div>

              {/* Deductions inputs */}
              <div className="bg-slate-950 p-2.5 rounded space-y-2 border border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Deductions Breakdown</div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Transport Freight:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-400 font-mono">-₹</span>
                    <input
                      type="number"
                      value={calcTransport}
                      onChange={(e) => setCalcTransport(parseInt(e.target.value) || 0)}
                      className="w-16 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-right font-mono text-red-300"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Storage / Holding:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-400 font-mono">-₹</span>
                    <input
                      type="number"
                      value={calcStorage}
                      onChange={(e) => setCalcStorage(parseInt(e.target.value) || 0)}
                      className="w-16 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-right font-mono text-red-300"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Facilitation Fee (0.5%):</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-400 font-mono">-₹</span>
                    <input
                      type="number"
                      value={calcServiceFee}
                      onChange={(e) => setCalcServiceFee(parseInt(e.target.value) || 0)}
                      className="w-16 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-right font-mono text-red-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 bg-emerald-950/40 p-3 rounded border border-emerald-800/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-emerald-400 font-semibold">Net Expected In Hand</div>
                <div className="text-2xl font-bold font-mono text-white">
                  ₹{customNetRealisation.netRealisation.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-mono">Effective Rate</div>
                <div className="text-sm font-semibold font-mono text-emerald-300">
                  ₹{customNetRealisation.effectivePricePerQuintal.toLocaleString('en-IN')}/Q
                </div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-emerald-300/80 font-mono">
              Demo Formula Check: 30Q x ₹3,100 - ₹2,700 - ₹900 - ₹465 = ₹88,935
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Level Market Comparison Table (15+ Indian Mandis) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Multi-Tier Mandi Realization Comparison</h4>
            <p className="text-xs text-slate-400">
              Comparing Local, Regional, and Terminal markets by Expected Net Realisation (incorporating transport & transit impact)
            </p>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 mr-1">Filter Tier:</span>
            {(['ALL', 'NEARBY', 'REGIONAL', 'NATIONAL_BENCHMARK'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setActiveTierFilter(tier)}
                className={`px-2.5 py-1 rounded transition text-xs ${
                  activeTierFilter === tier
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tier === 'NATIONAL_BENCHMARK' ? 'National' : tier}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase bg-slate-950/50">
                <th className="py-2.5 px-3">Market</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Distance</th>
                <th className="py-2.5 px-3 text-right">Modal Quoted</th>
                <th className="py-2.5 px-3 text-right">Arrival Volume</th>
                <th className="py-2.5 px-3 text-right">Est. Logistics/Q</th>
                <th className="py-2.5 px-3 text-right">Net Realisation/Q</th>
                <th className="py-2.5 px-3 text-right">Net Advantage vs Local</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {comparisons.map((c) => (
                <tr key={c.marketName} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-sans font-medium text-white flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.marketName}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({c.district}, {c.state})</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        c.tier === 'NEARBY'
                          ? 'bg-blue-950 text-blue-300'
                          : c.tier === 'REGIONAL'
                          ? 'bg-purple-950 text-purple-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {c.tier}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{c.distanceKm} km</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-100">
                    ₹{c.modalPrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{c.arrivalQuantity} Q</td>
                  <td className="py-2.5 px-3 text-right text-red-400">-₹{c.estimatedLogistics}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    ₹{c.estimatedNetRealisation.toLocaleString('en-IN')}/Q
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        c.netAdvantage >= 0 ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {c.netAdvantage > 0 ? `+₹${c.netAdvantage}/Q` : `${c.netAdvantage}/Q`}
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
