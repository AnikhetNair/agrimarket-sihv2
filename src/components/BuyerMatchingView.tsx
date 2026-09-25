import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  ChevronRight,
  ArrowUpDown,
  Truck,
  Handshake,
  X,
  Loader2,
} from 'lucide-react';
import { ProduceLot, BuyerRequirement, User } from '../types/domain';
import { dataStore } from '../services/dataStore';
import { calculateMatch } from '../services/matchingService';
import { GOLDEN_LOT_NUMBER } from '../data/seedLotsAndRequirements';

export type BuyerSortOption =
  | 'match'
  | 'price_asc'
  | 'price_desc'
  | 'distance'
  | 'date';

interface BuyerMatchingViewProps {
  activeUser: User;
  selectedLot?: ProduceLot;
  onSelectLot: (lot: ProduceLot) => void;
  onInitiateDeal: (lot: ProduceLot, requirement: BuyerRequirement) => void;
}

export const BuyerMatchingView: React.FC<BuyerMatchingViewProps> = ({
  activeUser,
  selectedLot,
  onSelectLot,
  onInitiateDeal,
}) => {
  const navigate = useNavigate();
  const lots = dataStore.getLots();
  const requirements = dataStore.getRequirements();

  // Modal State for Initiate Deal
  const [biddingLot, setBiddingLot] = useState<ProduceLot | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock Submission Handler for Initiate Deal (Frontend-Only Demo Flow)
  const handleMockSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!biddingLot || !offerPrice || isSubmitting) return;

    const numPrice = Number(offerPrice);
    if (isNaN(numPrice) || numPrice <= 0) return;

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const mockDeal = {
          id: `DEAL-MOCK-${Date.now().toString().slice(-6)}`,
          lot: biddingLot,
          initialOffer: numPrice,
          status: 'PENDING',
          timestamp: new Date().toISOString(),
        };

        const existingDeals = JSON.parse(
          localStorage.getItem('mock_buyer_deals') || '[]'
        );

        localStorage.setItem(
          'mock_buyer_deals',
          JSON.stringify([mockDeal, ...existingDeals])
        );

        // Safe frontend in-memory update for negotiation thread
        try {
          dataStore.createOffer({
            lotId: biddingLot.id,
            buyerId: activeUser.id,
            senderId: activeUser.id,
            offerPrice: numPrice,
            quantity: biddingLot.quantity,
            message: `Initial procurement offer of ₹${numPrice.toLocaleString('en-IN')}/Q for ${biddingLot.quantity}Q ${biddingLot.commodity}.`,
          });
        } catch {
          // safe fallback
        }

        setIsSubmitting(false);
        setBiddingLot(null);
        setOfferPrice('');

        navigate('/buyer/deals');
      } catch {
        setIsSubmitting(false);
      }
    }, 800);
  };

  // Mode: BUYER matching available lots for their procurement demand
  const [viewMode, setViewMode] = useState<'MATCH_LOTS_FOR_DEMAND' | 'EVALUATE_DEMANDS_FOR_LOT'>('MATCH_LOTS_FOR_DEMAND');

  // Selected requirement (defaults to FreshKart's Carrot 30Q requirement or first available)
  const defaultReq =
    requirements.find((r) => r.commodity === 'Carrot' && r.buyer_org_name.includes('FreshKart')) ||
    requirements[0];
  const [selectedReqId, setSelectedReqId] = useState<string>(defaultReq?.id || '');

  // Selected lot for reverse view
  const currentLot = selectedLot || lots.find((l) => l.lot_number === GOLDEN_LOT_NUMBER) || lots[0];

  // Compact Sorting Control for Available Lots
  const [sortBy, setSortBy] = useState<BuyerSortOption>('match');

  const activeRequirement = useMemo(() => {
    return requirements.find((r) => r.id === selectedReqId) || defaultReq;
  }, [requirements, selectedReqId, defaultReq]);

  // Evaluated Lots matching the active requirement
  const evaluatedLots = useMemo(() => {
    if (!activeRequirement) return [];
    return lots.map((lot) => ({
      lot,
      match: calculateMatch(lot, activeRequirement),
    }));
  }, [lots, activeRequirement]);

  // Sorted Available Lots based on active sort option
  const sortedLots = useMemo(() => {
    const list = [...evaluatedLots];
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.lot.asking_price ?? 0) - (b.lot.asking_price ?? 0);
        case 'price_desc':
          return (b.lot.asking_price ?? 0) - (a.lot.asking_price ?? 0);
        case 'distance':
          return (a.match.estimatedDistanceKm ?? 0) - (b.match.estimatedDistanceKm ?? 0);
        case 'date':
          return (
            new Date(a.lot.available_from || a.lot.harvest_date || 0).getTime() -
            new Date(b.lot.available_from || b.lot.harvest_date || 0).getTime()
          );
        case 'match':
        default:
          if (a.match.eligible !== b.match.eligible) {
            return a.match.eligible ? -1 : 1;
          }
          return (b.match.overallScore ?? 0) - (a.match.overallScore ?? 0);
      }
    });
  }, [evaluatedLots, sortBy]);

  // Evaluated Requirements matching currentLot (Supplier view)
  const evaluatedDemands = useMemo(() => {
    if (!currentLot) return [];
    return requirements.map((req) => ({
      requirement: req,
      match: calculateMatch(currentLot, req),
    })).sort((a, b) => (b.match.overallScore ?? 0) - (a.match.overallScore ?? 0));
  }, [currentLot, requirements]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header with Compact Sort Control */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-[#0d0a0b] flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#386641]" />
              <span>Available Lots & Two-Stage Compatibility Match</span>
            </h3>
            <span className="text-xs bg-[#6A994E]/15 text-[#386641] px-2 py-0.5 rounded font-mono border border-[#6A994E]/30 font-semibold">
              Stage 1: Hard Rules • Stage 2: Weighted 100-Point Scoring
            </span>
          </div>
          <p className="text-xs text-[#454955] mt-1">
            Matching certified farmer & FPO lots against institutional buyer demand with verifiable scoring breakdown
          </p>
        </div>

        {/* View mode toggle & sorting */}
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'MATCH_LOTS_FOR_DEMAND' ? (
            <>
              {/* Procurement Demand Selector */}
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-[#454955]">Demand Target:</span>
                <select
                  value={selectedReqId}
                  onChange={(e) => setSelectedReqId(e.target.value)}
                  className="bg-[#F2E8CF] border border-slate-300 text-[#0d0a0b] rounded px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-[#386641]"
                >
                  {requirements.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.buyer_org_name}: {r.quantity}Q {r.commodity} (Grade {r.grade} @ ₹{r.target_price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Compact Sorting Control */}
              <div className="flex items-center space-x-1.5 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#386641]" />
                <span className="text-[#454955]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as BuyerSortOption)}
                  className="bg-[#F2E8CF] border border-slate-300 text-[#0d0a0b] rounded px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-[#386641]"
                >
                  <option value="match">Match Score</option>
                  <option value="price_asc">Price — Low to High</option>
                  <option value="price_desc">Price — High to Low</option>
                  <option value="distance">Distance — Nearest</option>
                  <option value="date">Date Available — Earliest</option>
                </select>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[#454955]">Match Target Lot:</span>
              <select
                value={currentLot?.id}
                onChange={(e) => {
                  const found = lots.find((l) => l.id === e.target.value);
                  if (found) onSelectLot(found);
                }}
                className="bg-[#F2E8CF] border border-slate-300 text-[#0d0a0b] rounded px-2.5 py-1.5 font-mono text-xs focus:ring-1 focus:ring-[#386641]"
              >
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.lot_number} - {l.commodity} ({l.quantity}Q @ ₹{l.asking_price})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Perspective switch button */}
          <button
            onClick={() =>
              setViewMode((prev) =>
                prev === 'MATCH_LOTS_FOR_DEMAND' ? 'EVALUATE_DEMANDS_FOR_LOT' : 'MATCH_LOTS_FOR_DEMAND'
              )
            }
            className="px-2.5 py-1.5 bg-[#F2E8CF] hover:bg-slate-200 text-[#0d0a0b] rounded-lg text-xs border border-slate-300 transition cursor-pointer font-medium"
          >
            {viewMode === 'MATCH_LOTS_FOR_DEMAND' ? 'Switch to Lot Perspective' : 'Switch to Demand Perspective'}
          </button>
        </div>
      </div>

      {/* Target Summary Banner */}
      {viewMode === 'MATCH_LOTS_FOR_DEMAND' && activeRequirement && (
        <div className="bg-[#F2E8CF] border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Active Requirement</span>
            <span className="font-bold text-[#0d0a0b] font-mono truncate block">{activeRequirement.buyer_org_name}</span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Commodity & Grade</span>
            <span className="font-medium text-[#0d0a0b]">
              {activeRequirement.commodity} (Grade {activeRequirement.grade})
            </span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Volume & Target Price</span>
            <span className="font-bold text-[#386641] font-mono">
              {activeRequirement.quantity}Q @ ₹{activeRequirement.target_price}/Q
            </span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Delivery Dock</span>
            <span className="font-medium text-[#0d0a0b] truncate block">{activeRequirement.delivery_location}</span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Required By</span>
            <span className="font-medium text-[#0d0a0b] font-mono">{activeRequirement.required_by}</span>
          </div>
        </div>
      )}

      {viewMode === 'EVALUATE_DEMANDS_FOR_LOT' && currentLot && (
        <div className="bg-[#F2E8CF] border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Selected Lot</span>
            <span className="font-bold text-[#0d0a0b] font-mono">{currentLot.lot_number}</span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Produce</span>
            <span className="font-medium text-[#0d0a0b]">
              {currentLot.commodity} (Grade {currentLot.grade})
            </span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Volume & Asking</span>
            <span className="font-bold text-[#386641] font-mono">
              {currentLot.quantity}Q @ ₹{currentLot.asking_price}/Q
            </span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Origin</span>
            <span className="font-medium text-[#0d0a0b]">{currentLot.origin}</span>
          </div>
          <div>
            <span className="text-[#454955] text-[10px] uppercase font-mono block">Delivery Term</span>
            <span className="font-medium text-[#0d0a0b] font-mono">
              {currentLot.simple_delivery_mode === 'supplier_delivery' ? 'Supplier Delivery' : 'Buyer Pickup'}
            </span>
          </div>
        </div>
      )}

      {/* Main Results List */}
      {viewMode === 'MATCH_LOTS_FOR_DEMAND' ? (
        /* AVAILABLE LOTS LIST FOR BUYER */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#0d0a0b] uppercase tracking-wider">
              Available Supplier Lots ({sortedLots.filter((m) => m.match.eligible).length} Compatible Batches)
            </h4>
            <span className="text-xs text-[#454955]">
              Scored by: Volume (25%) + Quality (20%) + Location (20%) + Price (15%) + Delivery & Reliability (20%)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {sortedLots.map(({ lot, match }) => {
              const isGoldenLot = lot.lot_number === GOLDEN_LOT_NUMBER;
              return (
                <div
                  key={lot.id}
                  className={`bg-white border rounded-xl p-5 shadow-2xs transition ${
                    match.eligible
                      ? isGoldenLot
                        ? 'border-[#386641] bg-[#6A994E]/5 shadow-sm ring-1 ring-[#386641]/30'
                        : 'border-slate-200 hover:border-[#386641]'
                      : 'border-slate-200 opacity-65 bg-[#F2E8CF]/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Lot Details */}
                    <div className="space-y-2 lg:max-w-md">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#0d0a0b] text-sm font-mono">{lot.lot_number}</span>
                        <span className="text-xs text-[#454955]">({lot.fpo_name || 'Farmer Direct'})</span>
                        {isGoldenLot && (
                          <span className="text-[10px] bg-[#6A994E]/15 text-[#386641] px-2 py-0.5 rounded border border-[#6A994E]/30 font-mono font-bold">
                            GOLDEN LOT • VERIFIED
                          </span>
                        )}
                        {lot.is_pooled && (
                          <span className="text-[10px] bg-[#F2E8CF] text-[#0d0a0b] px-1.5 py-0.5 rounded border border-slate-300 font-mono">
                            FPO POOLED (3 FARMERS)
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#454955]">
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Available Batch:</span>
                          <span className="font-semibold text-[#0d0a0b] font-mono">
                            {lot.quantity}Q {lot.commodity}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Asking Price:</span>
                          <span className="font-semibold text-[#386641] font-mono">
                            ₹{lot.asking_price}/Q
                          </span>
                        </div>
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Grade:</span>
                          <span className="font-semibold text-[#0d0a0b]">Grade {lot.grade}</span>
                        </div>
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Origin / Corridor:</span>
                          <span className="text-[#0d0a0b] truncate">{lot.origin}</span>
                        </div>
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Available From:</span>
                          <span className="text-[#0d0a0b] font-mono">{lot.available_from || lot.harvest_date}</span>
                        </div>
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Delivery Logistics:</span>
                          <span className="text-[#0d0a0b] flex items-center space-x-1">
                            <Truck className="w-3 h-3 text-[#386641]" />
                            <span>
                              {lot.simple_delivery_mode === 'supplier_delivery' ? 'Delivered' : 'Pickup'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stage 1 & Stage 2 Scoring Breakdown */}
                    <div className="bg-[#F2E8CF] border border-slate-200 rounded-xl p-3 lg:w-96 text-xs">
                      {match.eligible ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-[#0d0a0b] flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#386641]" />
                              <span>Stage 1: ELIGIBLE</span>
                            </span>
                            <span className="text-lg font-bold font-mono text-[#386641]">
                              {match.overallScore} / 100
                            </span>
                          </div>

                          {/* Factor Score Bars */}
                          <div className="space-y-1 text-[11px] font-mono text-[#454955]">
                            <div className="flex justify-between items-center">
                              <span>Volume Fulfillment (25%):</span>
                              <span className="text-[#0d0a0b]">{match.componentScores.quantity} / 25</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Quality Grade (20%):</span>
                              <span className="text-[#0d0a0b]">{match.componentScores.quality} / 20</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Location & Distance (20%):</span>
                              <span className="text-[#0d0a0b]">
                                {match.componentScores.location} / 20 ({match.estimatedDistanceKm} km)
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Price Spread (15%):</span>
                              <span className="text-[#0d0a0b]">{match.componentScores.price} / 15</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Delivery & Reliability (20%):</span>
                              <span className="text-[#0d0a0b]">
                                {match.componentScores.delivery + match.componentScores.reliability} / 20
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[#454955] space-y-1">
                          <div className="flex items-center space-x-1 text-red-600 font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Stage 1 Filter: REJECTED</span>
                          </div>
                          <p className="text-[11px] text-[#454955] leading-snug">
                            Reason: {match.ineligibilityReason}
                          </p>
                          <div className="text-[10px] text-[#454955] mt-1">
                            Hard eligibility gates prevent incompatible grades or volume misalignments.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col items-end justify-center space-y-2">
                      {match.eligible ? (
                        <button
                          onClick={() => {
                            setBiddingLot(lot);
                            setOfferPrice('');
                          }}
                          className="w-full lg:w-36 py-2 px-3 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
                        >
                          <span>Initiate Deal</span>
                          <ChevronRight className="w-3.5 h-3.5 text-white" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#454955] font-mono px-3 py-1 bg-slate-200 rounded">
                          Incompatible
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* DEMANDS LIST FOR SUPPLIER / FPO */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#0d0a0b] uppercase tracking-wider">
              Evaluated Buyer Demands ({evaluatedDemands.filter((m) => m.match.eligible).length} Eligible Matches)
            </h4>
            <span className="text-xs text-[#454955]">
              Scored by: Volume (25%) + Quality (20%) + Location (20%) + Price (15%) + Delivery (10%) + Reliability (10%)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {evaluatedDemands.map(({ requirement, match }) => {
              const isFreshKart = requirement.buyer_org_name.includes('FreshKart');
              return (
                <div
                  key={requirement.id}
                  className={`bg-white border rounded-xl p-5 shadow-2xs transition ${
                    match.eligible
                      ? isFreshKart
                        ? 'border-[#386641] bg-[#6A994E]/5 shadow-sm'
                        : 'border-slate-200 hover:border-[#386641]'
                      : 'border-slate-200 opacity-70 bg-[#F2E8CF]/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Buyer & Requirement Details */}
                    <div className="space-y-2 lg:max-w-md">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-[#454955]" />
                        <span className="font-bold text-[#0d0a0b] text-sm">{requirement.buyer_org_name}</span>
                        <span className="text-xs text-[#454955] font-mono">({requirement.buyer_name})</span>
                        {isFreshKart && (
                          <span className="text-[10px] bg-[#6A994E]/15 text-[#386641] px-1.5 py-0.2 rounded border border-[#6A994E]/30 font-mono font-semibold">
                            GOLDEN MATCH
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#454955]">
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Demand Target:</span>
                          <span className="font-semibold text-[#0d0a0b] font-mono">
                            {requirement.quantity}Q {requirement.commodity}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Target Price:</span>
                          <span className="font-semibold text-[#386641] font-mono">
                            ₹{requirement.target_price}/Q
                          </span>
                        </div>
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Min Grade:</span>
                          <span className="font-semibold text-[#0d0a0b]">Grade {requirement.grade}</span>
                        </div>
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Delivery Dock:</span>
                          <span className="text-[#0d0a0b] truncate">{requirement.delivery_location}</span>
                        </div>
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Required By:</span>
                          <span className="text-[#0d0a0b]">{requirement.required_by}</span>
                        </div>
                        <div>
                          <span className="text-[#454955] text-[10px] block font-medium">Reliability Track:</span>
                          <span className="text-[#386641] font-semibold">{requirement.reliability_score}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage 1 & Stage 2 Scoring Breakdown */}
                    <div className="bg-[#F2E8CF] border border-slate-200 rounded-xl p-3 lg:w-96 text-xs">
                      {match.eligible ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-[#0d0a0b] flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#386641]" />
                              <span>Stage 1 Filter: ELIGIBLE</span>
                            </span>
                            <span className="text-lg font-bold font-mono text-[#386641]">
                              {match.overallScore} / 100
                            </span>
                          </div>

                          {/* Factor Score Bars */}
                          <div className="space-y-1.5 text-[11px] font-mono text-[#454955]">
                            <div className="flex justify-between items-center">
                              <span>Volume Fulfillment (25%):</span>
                              <span className="text-[#0d0a0b]">{match.componentScores.quantity} / 25</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Quality & Grade (20%):</span>
                              <span className="text-[#0d0a0b]">{match.componentScores.quality} / 20</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Corridor Proximity (20%):</span>
                              <span className="text-[#0d0a0b]">{match.componentScores.location} / 20</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Price Spread (15%):</span>
                              <span className="text-[#0d0a0b]">{match.componentScores.price} / 15</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Delivery & Reliability (20%):</span>
                              <span className="text-[#0d0a0b]">
                                {match.componentScores.delivery + match.componentScores.reliability} / 20
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[#454955] space-y-1">
                          <div className="flex items-center space-x-1 text-red-600 font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Stage 1 Hard Filter: REJECTED</span>
                          </div>
                          <p className="text-[11px] text-[#454955] leading-snug">
                            Reason: {match.ineligibilityReason}
                          </p>
                          <div className="text-[10px] text-[#454955] mt-1">
                            Hard eligibility gates prevent incompatible grades or volume misalignments.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col items-end justify-center space-y-2">
                      {match.eligible ? (
                        <button
                          onClick={() => onInitiateDeal(currentLot, requirement)}
                          className="w-full lg:w-36 py-2 px-3 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
                        >
                          <span>Open Bids</span>
                          <ChevronRight className="w-3.5 h-3.5 text-white" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#454955] font-mono px-3 py-1 bg-slate-200 rounded">
                          Incompatible
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Initiate Procurement Deal Modal (Frontend Mock) */}
      {biddingLot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto font-sans"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setBiddingLot(null);
              setOfferPrice('');
            }
          }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-[#0d0a0b]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F2E8CF]">
              <div>
                <h3 className="text-base font-bold text-[#0d0a0b] flex items-center space-x-2">
                  <Handshake className="w-5 h-5 text-[#386641]" />
                  <span>Initiate Procurement Deal</span>
                </h3>
                <p className="text-xs text-[#454955] mt-0.5">
                  Submit your initial commercial bid to start bilateral negotiations
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setBiddingLot(null);
                  setOfferPrice('');
                }}
                className="text-[#454955] hover:text-[#0d0a0b] p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleMockSubmit} className="p-6 space-y-5">
              {/* Read-only lot information */}
              <div className="bg-[#F2E8CF] border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono font-bold text-[#386641] bg-white px-2 py-0.5 rounded border border-slate-200">
                      {biddingLot.lot_number}
                    </span>
                    <span className="text-xs text-[#454955]">
                      ({biddingLot.fpo_name || 'Farmer Direct'})
                    </span>
                  </div>
                  <span className="text-xs text-[#454955] truncate max-w-[180px]">
                    {biddingLot.origin || biddingLot.district}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#454955] text-[10px] block font-medium uppercase tracking-wider">
                      Commodity
                    </span>
                    <span className="font-bold text-[#0d0a0b] text-sm">
                      {biddingLot.commodity}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#454955] text-[10px] block font-medium uppercase tracking-wider">
                      Grade
                    </span>
                    <span className="font-semibold text-[#0d0a0b]">
                      {biddingLot.grade ? `Grade ${biddingLot.grade}` : 'Standard'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#454955] text-[10px] block font-medium uppercase tracking-wider">
                      Volume / Quantity
                    </span>
                    <span className="font-bold text-[#0d0a0b] font-mono text-sm">
                      {biddingLot.quantity} {biddingLot.unit || 'Quintals'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#454955] text-[10px] block font-medium uppercase tracking-wider">
                      Farmer Asking Price
                    </span>
                    <span className="font-bold text-[#386641] font-mono text-sm">
                      ₹{biddingLot.asking_price?.toLocaleString('en-IN') || biddingLot.asking_price} / Quintal
                    </span>
                  </div>
                </div>
              </div>

              {/* Offer input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="offer-price-input"
                  className="block text-xs font-bold text-[#0d0a0b]"
                >
                  Your Initial Offer (₹/Quintal)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sm font-semibold text-[#454955]">
                    ₹
                  </span>
                  <input
                    id="offer-price-input"
                    type="number"
                    min="1"
                    step="1"
                    disabled={isSubmitting}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="Enter price per quintal..."
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#0d0a0b] placeholder-[#454955]/60 focus:outline-none focus:ring-2 focus:ring-[#386641] focus:border-transparent font-mono disabled:bg-slate-100 transition"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-[#454955]">
                  This initial offer will be transmitted to the supplier to initiate real-time price discovery.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setBiddingLot(null);
                    setOfferPrice('');
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#454955] hover:text-[#0d0a0b] hover:bg-slate-100 border border-slate-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    !offerPrice ||
                    isNaN(Number(offerPrice)) ||
                    Number(offerPrice) <= 0 ||
                    isSubmitting
                  }
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-[#386641] hover:bg-[#2d5535] transition shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Submit Offer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
