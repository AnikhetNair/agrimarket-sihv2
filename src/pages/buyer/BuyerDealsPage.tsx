import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { dataStore } from '../../services/dataStore';
import { User, ProduceLot, Deal, LotStatus } from '../../types/domain';
import { NegotiationAndDealView } from '../../components/NegotiationAndDealView';
import { GOLDEN_DEAL_ID } from '../../data/seedDealsAndHistory';
import { Handshake, Clock, CheckCircle2, ArrowRight, ArrowLeft, Building2 } from 'lucide-react';

export interface MockBuyerDeal {
  id: string;
  lot: ProduceLot;
  initialOffer: number;
  status: string;
  timestamp: string;
}

interface DealCardProps {
  deal: Deal;
  isCompleted?: boolean;
  onSelect: () => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, isCompleted, onSelect }) => {
  const isMock = deal.id.startsWith('DEAL-PRO-') || deal.status === 'PENDING';

  return (
    <div
      onClick={isCompleted ? undefined : onSelect}
      className={`p-4 rounded-xl border shadow-2xs text-left ${
        isCompleted
          ? 'border-slate-200 bg-slate-50/60 opacity-80'
          : 'border-slate-200 hover:border-[#386641] bg-white hover:shadow-xs cursor-pointer group'
      } transition`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-[11px] font-mono font-bold text-[#454955] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          {deal.deal_number}
        </span>
        {isCompleted ? (
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#6A994E]/10 text-[#6A994E] border border-[#6A994E]/20 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-[#6A994E]" />
            <span>{deal.status}</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{deal.status || 'PENDING'}</span>
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between">
          <h3 className={`text-sm font-bold text-[#0d0a0b] ${!isCompleted ? 'group-hover:text-[#386641]' : ''} transition`}>
            {deal.commodity}
          </h3>
          <span className="text-xs font-mono font-bold text-[#0d0a0b]">
            {deal.quantity} Quintals
          </span>
        </div>

        <div className="text-xs text-[#454955] flex items-center justify-between">
          <span>Seller:</span>
          <span className="font-medium text-[#0d0a0b] truncate max-w-[160px]">
            {deal.seller_name}
          </span>
        </div>

        <div className="text-xs text-[#454955] flex items-center justify-between">
          <span>{isMock ? 'Initial Offer:' : 'Agreed Price:'}</span>
          <span className="font-bold font-mono text-[#386641]">
            ₹{deal.accepted_price?.toLocaleString('en-IN') || deal.accepted_price} / Q
          </span>
        </div>

        <div className="text-xs text-[#454955] flex items-center justify-between">
          <span>Gross Value:</span>
          <span className="font-mono font-semibold text-[#0d0a0b]">
            ₹{(deal.gross_value || deal.quantity * deal.accepted_price).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-[#454955]">
          {isMock
            ? new Date(deal.accepted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Binding Contract'}
        </span>
        {isCompleted ? (
          <span className="text-[#454955] font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-[#6A994E]" />
            <span>Archived</span>
          </span>
        ) : (
          <span className="text-[#386641] font-semibold flex items-center space-x-0.5 group-hover:translate-x-0.5 transition">
            <span>Select Deal</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );
};

export const BuyerDealsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const domainUser: User = {
    id: user?.id || 'usr-buyer-1',
    name: user?.name || 'Arjun Mehta',
    role: 'BUYER',
    phone_demo: user?.phone || '+91 98200 44551',
    location: user?.location || 'Pune Distribution Hub',
    district: user?.district || 'Pune',
    state: user?.state || 'Maharashtra',
    created_at: new Date().toISOString(),
  };

  const realDeals = dataStore.getDeals();

  // Read mock deals from localStorage
  const [mockDeals, setMockDeals] = useState<MockBuyerDeal[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mock_buyer_deals') || '[]');
    } catch {
      return [];
    }
  });

  // Selected deal state: null = Master View, non-null = Detail View
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Re-read storage if changed elsewhere
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('mock_buyer_deals') || '[]');
        setMockDeals(stored);
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Ensure mock offers are registered in memory so negotiation view reflects initial offer
  useEffect(() => {
    mockDeals.forEach((md) => {
      if (md.lot && md.initialOffer) {
        const existingOffers = dataStore.getOffersForLot(md.lot.id);
        if (existingOffers.length === 0) {
          try {
            dataStore.createOffer({
              lotId: md.lot.id,
              buyerId: domainUser.id,
              senderId: domainUser.id,
              offerPrice: md.initialOffer,
              quantity: md.lot.quantity,
              message: `Initial procurement offer of ₹${md.initialOffer.toLocaleString('en-IN')}/Q for ${md.lot.quantity}Q ${md.lot.commodity}.`,
            });
          } catch {
            // safe fallback
          }
        }
      }
    });
  }, [mockDeals, domainUser.id]);

  // Convert a mock deal into standard domain Deal
  const convertMockDealToDeal = (mock: MockBuyerDeal): Deal => {
    const gross = mock.lot.quantity * mock.initialOffer;
    const transport = mock.lot.transport_paid_by === 'BUYER' ? 0 : Math.round(mock.lot.quantity * 75);
    const storage = 0;
    const fee = Math.round(gross * 0.005);
    const net = gross - transport - storage - fee;

    return {
      id: mock.id,
      deal_number: mock.id,
      lot_id: mock.lot.id,
      accepted_offer_id: '',
      buyer_id: domainUser.id,
      buyer_name: domainUser.name,
      seller_id: mock.lot.seller_user_id,
      seller_name: (mock.lot as any).fpo_name || (mock.lot.seller_type === 'FPO' ? 'Nashik Kisan Producer Co.' : 'Ramesh Patil'),
      seller_type: mock.lot.seller_type,
      commodity: mock.lot.commodity,
      accepted_price: mock.initialOffer,
      quantity: mock.lot.quantity,
      gross_value: gross,
      transport_cost: transport,
      storage_cost: storage,
      service_fee: fee,
      net_realisation: net,
      delivery_mode: mock.lot.delivery_mode,
      transport_paid_by: mock.lot.transport_paid_by,
      pickup_location: mock.lot.pickup_location,
      delivery_location: mock.lot.delivery_location || 'Pune Distribution Hub',
      status: (mock.status === 'PENDING' ? 'NEGOTIATING' : (mock.status as LotStatus)) || 'NEGOTIATING',
      accepted_at: mock.timestamp,
    };
  };

  // Categorize deals using actual application status values
  const activeDeals = useMemo(() => {
    const convertedMock = mockDeals.map(convertMockDealToDeal);
    const activeReal = realDeals.filter((deal) => {
      if (deal.id === GOLDEN_DEAL_ID) return true;
      return deal.status !== 'COMPLETED' && deal.status !== 'PAID';
    });
    return [...convertedMock, ...activeReal];
  }, [mockDeals, realDeals, domainUser]);

  const completedDeals = useMemo(() => {
    return realDeals.filter((deal) => {
      if (deal.id === GOLDEN_DEAL_ID) return false;
      return deal.status === 'COMPLETED' || deal.status === 'PAID';
    });
  }, [realDeals]);

  // If a deal is selected, render ONLY Detail View
  if (selectedDeal) {
    return (
      <div className="space-y-6 font-sans">
        {/* Detail View Header with Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedDeal(null)}
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#386641] hover:text-[#2d5535] bg-white border border-slate-200 hover:border-[#386641] px-3.5 py-2 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to All Deals</span>
          </button>
        </div>

        {/* Selected Deal Information Card */}
        <div className="bg-white rounded-xl border border-[#454955]/20 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-[#386641] bg-[#386641]/10 px-2.5 py-0.5 rounded border border-[#386641]/20">
                  {selectedDeal.deal_number}
                </span>
                <h2 className="text-base font-bold text-[#0d0a0b]">
                  {selectedDeal.commodity} Procurement Contract
                </h2>
              </div>
              <p className="text-xs text-[#454955] mt-1">
                Seller: <span className="font-semibold text-[#0d0a0b]">{selectedDeal.seller_name}</span> • Volume: <span className="font-mono font-semibold text-[#0d0a0b]">{selectedDeal.quantity} Quintals</span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#386641]" />
                <span>{selectedDeal.status}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F2E8CF] p-3.5 rounded-lg border border-[#454955]/15 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#454955] uppercase block font-semibold">Contract Rate</span>
              <span className="text-sm font-bold text-[#386641]">₹{selectedDeal.accepted_price.toLocaleString('en-IN')}/Q</span>
            </div>
            <div>
              <span className="text-[10px] text-[#454955] uppercase block font-semibold">Total Gross Value</span>
              <span className="text-sm font-bold text-[#0d0a0b]">₹{(selectedDeal.gross_value || selectedDeal.quantity * selectedDeal.accepted_price).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#454955] uppercase block font-semibold">Pickup Station</span>
              <span className="font-medium text-[#0d0a0b] truncate block">{selectedDeal.pickup_location || 'Patil Farm Gate, Dindori'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#454955] uppercase block font-semibold">Delivery Destination</span>
              <span className="font-medium text-[#0d0a0b] truncate block">{selectedDeal.delivery_location || 'FreshKart Foods Central Warehouse'}</span>
            </div>
          </div>
        </div>

        {/* Existing Negotiation History & Contract Milestone for Selected Deal */}
        <NegotiationAndDealView
          activeUser={domainUser}
          selectedDeal={selectedDeal}
        />
      </div>
    );
  }

  // Master View (selectedDeal === null) - Negotiation History is completely hidden
  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-[#454955]/20 p-5 shadow-2xs">
        <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
          {t('buyer.dealsTitle', 'Active Contracts & Procurement Deals')}
        </h1>
        <p className="text-xs text-[#454955] mt-0.5">
          {t('buyer.dealsSubtitle', 'Signed contracts, milestone escrow tracking, and delivery receipts')}
        </p>
      </div>

      {/* SECTION 1 — Active Negotiations */}
      <div className="bg-white rounded-xl border border-[#454955]/20 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2">
            <Handshake className="w-5 h-5 text-[#386641]" />
            <h2 className="text-base font-bold text-[#0d0a0b]">Active Negotiations</h2>
            <span className="text-xs font-mono font-semibold bg-[#F2E8CF] text-[#0d0a0b] px-2.5 py-0.5 rounded-full border border-slate-200">
              {activeDeals.length} Active
            </span>
          </div>
          {mockDeals.length > 0 && (
            <span className="text-xs font-semibold text-[#386641] bg-[#6A994E]/15 px-2.5 py-1 rounded-md border border-[#6A994E]/30">
              {mockDeals.length} Newly Initiated {mockDeals.length === 1 ? 'Deal' : 'Deals'}
            </span>
          )}
        </div>

        {activeDeals.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-[#454955] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#0d0a0b]">No active negotiations</p>
            <p className="text-xs text-[#454955] mt-1">Initiate a deal from Farm-Direct Matches to begin price discovery.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isCompleted={false}
                onSelect={() => setSelectedDeal(deal)}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2 — Completed Deals & Contracts (Visually Distinct) */}
      <div className="mt-8 pt-8 border-t border-slate-200 bg-white rounded-xl border border-[#454955]/20 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-[#386641]" />
            <h2 className="text-base font-bold text-[#0d0a0b]">Completed Deals & Contracts</h2>
            <span className="text-xs font-mono font-semibold bg-[#F2E8CF] text-[#0d0a0b] px-2.5 py-0.5 rounded-full border border-slate-200">
              {completedDeals.length} Settled
            </span>
          </div>
        </div>

        {completedDeals.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-[#454955] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#0d0a0b]">No completed deals yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {completedDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isCompleted={true}
                onSelect={() => setSelectedDeal(deal)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
