import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { calculateSaleDecision } from '../../services/recommendationService';
import { generateMarketForecast } from '../../services/forecastService';
import { GOLDEN_LOT_NUMBER } from '../../data/seedLotsAndRequirements';
import {
  TrendingUp,
  Boxes,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  Handshake,
  Sparkles,
} from 'lucide-react';

export const FarmerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load farmer lots
  const farmerLots = dataStore
    .getLots()
    .filter((l) => l.seller_user_id === user?.id || l.seller_user_id === 'usr-farmer-1');
  const goldenLot = farmerLots.find((l) => l.lot_number === GOLDEN_LOT_NUMBER) || farmerLots[0];

  // Market forecast and recommendation for Carrot Nashik
  const historical = dataStore.getHistoricalPrices();
  const forecast = generateMarketForecast('Carrot', 'Nashik', historical, 7);
  const decision = calculateSaleDecision({
    commodity: 'Carrot',
    quantityQuintals: 30,
    currentMandiPrice: 2850,
    forecast,
    bestVerifiedBuyerOffer: 3100,
    distanceToMandiKm: 35,
    holdingDays: 7,
    isPerishable: true,
  });

  const modalPrice = 2850;
  const weeklyChange = 4.8;

  // Active deals for this farmer
  const activeDeals = dataStore
    .getDeals()
    .filter((d) => d.seller_id === user?.id || d.seller_id === 'usr-farmer-1');

  const getDecisionActionText = () => {
    if (decision.action === 'HOLD') {
      return 'HOLD FOR +7 DAYS';
    }
    if (decision.action === 'SELL_NOW') {
      return 'SELL NOW AT APMC';
    }
    return 'PARTIAL SALE / BUFFER';
  };

  const getTranslatedReasons = () => {
    if (decision.action === 'HOLD') {
      return [
        'Current Mandi rate (₹2,850/Q) is below 7-day forecast range (₹3,000–3,150/Q).',
        'Anticipated price gain of ₹4,500 exceeds cold-storage & holding cost of ₹1,350.',
      ];
    }
    if (decision.action === 'SELL_NOW') {
      return [
        'Immediate sale locks in ₹91,500 with zero transit loss.',
        'Drying supply forecast indicates downside risk over 48 hours.',
      ];
    }
    return ['Sell 50% immediately to ensure liquidity; hold balance for predicted price peak.'];
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome / Context Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
            {user?.name || 'Ramesh Patil'} — Farmer Operations Desk
          </h1>
          <p className="text-xs text-[#454955] mt-0.5 flex items-center space-x-2">
            <span>{user?.location || 'Dindori, Nashik, Maharashtra'}</span>
            <span>•</span>
            <span className="text-[#386641] font-medium">
              Member: Sahyadri Farmers Producer Co.
            </span>
          </p>
        </div>

        {/* Primary Quick CTAs */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/farmer/lots"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Boxes className="w-3.5 h-3.5 text-white" />
            <span>List Produce Lot</span>
          </Link>
          <Link
            to="/farmer/market"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-[#0d0a0b] rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer shadow-2xs"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#386641]" />
            <span>Market Forecasts</span>
          </Link>
        </div>
      </div>

      {/* Core Grid: Progressive Disclosure - Level 1 & Level 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Market Snapshot & Deterministic Decision */}
        <div className="lg:col-span-7 space-y-6">
          {/* Level 1: Market Snapshot */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6A994E] animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#454955]">
                  APMC Benchmark • Nashik Primary Hub
                </span>
              </div>
              <span className="text-[11px] text-[#454955]">
                Arrivals Today: 850 Quintals
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-medium text-[#454955]">
                  Commodity: Carrot (Kuroda Premium)
                </span>
                <div className="text-3xl font-extrabold text-[#0d0a0b] tracking-tight mt-0.5">
                  ₹{modalPrice.toLocaleString('en-IN')}{' '}
                  <span className="text-sm font-normal text-[#454955]">/ per Quintal</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
                  <span>↑ +{weeklyChange}%</span>
                  <span className="text-[10px] font-normal text-[#386641]">vs 7-day avg</span>
                </span>
                <div className="text-[11px] text-[#454955] mt-1">
                  Expected daily modal range: ₹2,750 - ₹2,950
                </div>
              </div>
            </div>
          </div>

          {/* Level 2: Decision Card (HOLD vs SELL) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#454955]">
                Optimal Strategy Engine
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/35">
                <Clock className="w-3 h-3 text-[#386641]" />
                <span>{getDecisionActionText()}</span>
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 bg-[#F2E8CF] rounded-lg p-3 border border-slate-200 text-xs">
              <div>
                <span className="text-[#454955] text-[11px] font-medium">
                  Expected 7-Day Market Range
                </span>
                <div className="text-base font-bold text-[#0d0a0b]">
                  ₹{forecast.forecast_low} – ₹{forecast.forecast_high} / Q
                </div>
              </div>
              <div>
                <span className="text-[#454955] text-[11px] font-medium">
                  Projected Net Extra Realisation
                </span>
                <div className="text-base font-bold text-[#386641]">
                  +₹4,500 on 30Q lot
                </div>
              </div>
            </div>

            {/* Why This Recommendation? */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-[#0d0a0b] mb-2">
                Why This Strategy? (Deterministic Rule Explainability)
              </h4>
              <ul className="space-y-2 text-xs text-[#454955]">
                {getTranslatedReasons().map((reason, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#386641] shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-[#454955]">
                Calculated deterministically using verified APMC modal & mandi spreads
              </span>
              <Link
                to="/farmer/market"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-[#386641] hover:text-[#2d5535]"
              >
                <span>Explore Price Forecasts & Model Benchmarks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Active Golden Lot & Transaction Step */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Produce Lot Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#454955]">
                Current Lot in Negotiation
              </span>
              <span className="text-xs font-mono font-bold text-[#386641] bg-[#6A994E]/15 px-2 py-0.5 rounded border border-[#6A994E]/30">
                {goldenLot ? goldenLot.lot_number : 'LOT #NK-TOM-0926'}
              </span>
            </div>

            {goldenLot ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#0d0a0b]">
                      {goldenLot.commodity} ({goldenLot.variety || 'Hybrid'})
                    </h3>
                    <div className="text-xs text-[#454955] flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#454955]" />
                      <span>{goldenLot.origin}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#0d0a0b]">{goldenLot.quantity} Q</div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
                      Grade {goldenLot.grade}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#F2E8CF] rounded-lg p-2.5 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-[#454955] font-medium">Asking Rate</span>
                    <div className="font-semibold text-[#0d0a0b]">₹{goldenLot.asking_price}/Q</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#454955] font-medium">Floor Rate</span>
                    <div className="font-semibold text-[#0d0a0b]">
                      ₹{goldenLot.minimum_acceptable_price}/Q
                    </div>
                  </div>
                </div>

                {/* Best Buyer Opportunity matching this lot */}
                <div className="p-3 bg-[#6A994E]/10 rounded-lg border border-[#6A994E]/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0d0a0b] flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#386641]" />
                      <span>Direct Institutional Buyer Match (94%)</span>
                    </span>
                    <span className="font-bold text-[#386641]">₹3,100 / Q</span>
                  </div>
                  <p className="text-[11px] text-[#454955] mt-1">
                    FreshKart Foods India • Central Distribution Hub (Pune, 190 km)
                  </p>
                </div>

                {/* Action Link to Deals / Negotiation */}
                <div className="pt-2">
                  <Link
                    to="/farmer/deals"
                    className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <Handshake className="w-3.5 h-3.5 text-white" />
                    <span>Manage Offers & Counter-Bids</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center py-6 text-xs text-[#454955]">
                No active produce lots registered. Create a lot to receive bids.
              </div>
            )}
          </div>

          {/* Active Deals Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#454955]">
                Active Commercial Contracts ({activeDeals.length})
              </span>
              <Link
                to="/farmer/deals"
                className="text-xs text-[#386641] font-semibold hover:underline"
              >
                View All
              </Link>
            </div>

            {activeDeals.length > 0 ? (
              <div className="space-y-2">
                {activeDeals.slice(0, 2).map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3 rounded-lg border border-slate-200 hover:border-[#386641] bg-[#F2E8CF]/50 transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#0d0a0b]">{deal.deal_number}</div>
                      <div className="text-[11px] text-[#454955]">
                        {deal.quantity} Q • {deal.buyer_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
                        {deal.status === 'COMPLETED' ? 'Completed' : deal.status.replace('_', ' ')}
                      </span>
                      <div className="text-[11px] font-semibold text-[#0d0a0b] mt-1">
                        ₹{deal.accepted_price}/Q
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#454955] py-3 text-center">
                No active contracts currently executing.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
