import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle,
  CheckCircle2,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { ProduceLot, User, LotStatus, Offer, Deal } from '../types/domain';
import { dataStore } from '../services/dataStore';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GOLDEN_LOT_NUMBER } from '../data/seedLotsAndRequirements';
import { GOLDEN_DEAL_ID } from '../data/seedDealsAndHistory';

interface NegotiationAndDealViewProps {
  activeUser: User;
  selectedLot?: ProduceLot;
  selectedDeal?: Deal | null;
  onBack?: () => void;
}

export const NegotiationAndDealView: React.FC<NegotiationAndDealViewProps> = ({
  activeUser,
  selectedLot,
  selectedDeal,
  onBack,
}) => {
  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.id || activeUser?.id;
  const isUserAuthenticated = Boolean(isAuthenticated || currentUserId);

  const lots = dataStore.getLots();

  // Find target lot
  const currentLot = useMemo(() => {
    if (selectedLot) return selectedLot;
    if (selectedDeal?.lot_id) {
      const found = dataStore.getLotById(selectedDeal.lot_id);
      if (found) return found;
      // Synthesize lot representation from deal details
      return {
        id: selectedDeal.lot_id,
        lot_number: selectedDeal.deal_number,
        seller_user_id: selectedDeal.seller_id,
        seller_type: selectedDeal.seller_type,
        commodity: selectedDeal.commodity,
        variety: 'Standard Commercial',
        quantity: selectedDeal.quantity,
        unit: 'Quintal' as const,
        harvest_date: selectedDeal.accepted_at || new Date().toISOString(),
        available_from: selectedDeal.accepted_at || new Date().toISOString(),
        origin: selectedDeal.pickup_location,
        district: 'Nashik',
        state: 'Maharashtra',
        grade: 'A' as const,
        quality_attributes: {},
        packaging: 'Standard Crates',
        storage_requirement: 'IMMEDIATE_SALE' as const,
        asking_price: selectedDeal.accepted_price,
        minimum_acceptable_price: selectedDeal.accepted_price,
        delivery_mode: selectedDeal.delivery_mode,
        transport_paid_by: selectedDeal.transport_paid_by,
        pickup_location: selectedDeal.pickup_location,
        delivery_location: selectedDeal.delivery_location,
        status: selectedDeal.status,
        created_at: selectedDeal.accepted_at || new Date().toISOString(),
        expires_at: selectedDeal.accepted_at || new Date().toISOString(),
      } as ProduceLot;
    }
    return lots.find((l) => l.lot_number === GOLDEN_LOT_NUMBER) || lots[0];
  }, [selectedLot, selectedDeal, lots]);

  const [refreshKey, setRefreshKey] = useState(0);

  // Active deal associated with this lot
  const associatedDeal = useMemo(() => {
    if (selectedDeal) return selectedDeal;
    if (!currentLot) return undefined;
    const deals = dataStore.getDeals();
    return (
      deals.find((d) => d.lot_id === currentLot.id) ||
      (currentLot.lot_number === GOLDEN_LOT_NUMBER ? deals.find((d) => d.id === GOLDEN_DEAL_ID) : undefined)
    );
  }, [selectedDeal, currentLot, refreshKey]);

  // Sync with Supabase on mount/deal change if configured
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !associatedDeal) return;
    let isMounted = true;
    supabase
      .from('deals')
      .select('status')
      .eq('id', associatedDeal.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.status && isMounted && data.status !== associatedDeal.status) {
          dataStore.transitionDeal(associatedDeal.id, data.status as LotStatus, {
            id: activeUser.id,
            name: activeUser.name,
            role: activeUser.role,
          });
          setRefreshKey((k) => k + 1);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [associatedDeal?.id]);

  // Offers associated with this lot
  const offers = useMemo(() => {
    if (!currentLot) return [];
    const lotOffers = dataStore.getOffersForLot(currentLot.id);
    if (lotOffers.length > 0) return lotOffers;

    // If deal has an accepted offer and price but no seeded bids in lotOffers
    if (associatedDeal?.accepted_price) {
      return [
        {
          id: associatedDeal.accepted_offer_id || `off-${associatedDeal.id}`,
          lot_id: currentLot.id,
          buyer_id: associatedDeal.buyer_id,
          buyer_name: associatedDeal.buyer_name,
          seller_id: associatedDeal.seller_id,
          seller_name: associatedDeal.seller_name,
          sender_id: associatedDeal.buyer_id,
          offer_price: associatedDeal.accepted_price,
          quantity: associatedDeal.quantity,
          message: `Formal commercial agreement confirmed at ₹${associatedDeal.accepted_price.toLocaleString('en-IN')}/Q for ${associatedDeal.quantity} Quintals.`,
          created_at: associatedDeal.accepted_at || new Date().toISOString(),
          expires_at: associatedDeal.accepted_at || new Date().toISOString(),
          status: 'ACCEPTED' as const,
        },
      ];
    }
    return [];
  }, [currentLot, associatedDeal, refreshKey]);

  // Deal events timeline
  const dealEvents = useMemo(() => {
    if (!associatedDeal) return [];
    return dataStore.getDealEvents(associatedDeal.id);
  }, [associatedDeal, refreshKey]);

  // Helper to determine the creator/sender of an offer
  const getOfferSenderId = (offer: Offer): string => {
    if (offer.sender_id) return offer.sender_id;
    if (offer.parent_offer_id) {
      const parent = offers.find((p) => p.id === offer.parent_offer_id);
      if (parent) {
        const parentSender = getOfferSenderId(parent);
        return parentSender === offer.buyer_id ? offer.seller_id : offer.buyer_id;
      }
      return offer.seller_id;
    }
    return offer.buyer_id;
  };

  // Helper to determine if the sender is the current authenticated user
  const isSenderMe = (offer: Offer, senderId: string): boolean => {
    if (currentUserId && (senderId === currentUserId || (user?.auth_user_id && senderId === user.auth_user_id))) {
      return true;
    }
    if (activeUser?.id && senderId === activeUser.id) {
      return true;
    }
    if (user?.id && senderId === user.id) {
      return true;
    }
    return false;
  };

  // Helper to determine the display name of counterparty sender
  const getCounterpartyName = (offer: Offer, senderId: string): string => {
    // 1. If sender is the seller
    if (senderId === offer.seller_id) {
      const sellerClean = offer.seller_name?.split(' (')[0];
      if (sellerClean && sellerClean !== 'Seller') return sellerClean;
      const sellerUser = dataStore.getUsers().find((u) => u.id === offer.seller_id);
      if (sellerUser?.name) return sellerUser.name;
      return 'Ramesh Patil';
    }

    // 2. If sender is the buyer
    if (senderId === offer.buyer_id) {
      const buyerClean = offer.buyer_name?.split(' (')[0];
      if (buyerClean && buyerClean !== 'Buyer') return buyerClean;
      const buyerUser = dataStore.getUsers().find((u) => u.id === offer.buyer_id);
      if (buyerUser?.name) return buyerUser.name;
      return 'Arjun Mehta';
    }

    // 3. User lookup by senderId
    const senderUser = dataStore.getUsers().find((u) => u.id === senderId);
    if (senderUser?.name) return senderUser.name;

    // 4. Role-based fallback
    if (currentUserId === offer.buyer_id) {
      return offer.seller_name?.split(' (')[0] || 'Ramesh Patil';
    }
    return offer.buyer_name?.split(' (')[0] || 'Arjun Mehta';
  };

  // Determine if an offer originated from a Farmer/Seller or Buyer
  const isOfferFromFarmer = (offer: Offer): boolean => {
    const senderId = offer.sender_id || getOfferSenderId(offer);
    if (senderId === offer.seller_id) return true;
    if (currentLot && senderId === currentLot.seller_user_id) return true;
    if (associatedDeal && senderId === associatedDeal.seller_id) return true;
    const senderUser = dataStore.getUsers().find((u) => u.id === senderId);
    if (senderUser) {
      return senderUser.role === 'FARMER' || senderUser.role === 'FPO_MEMBER';
    }
    return false;
  };

  const isOfferFromBuyer = (offer: Offer): boolean => {
    return !isOfferFromFarmer(offer);
  };

  // Chronological offers for timeline display
  const displayOffers = useMemo(() => {
    return [...offers].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [offers]);

  // Determine if the current authenticated actor is Farmer/Seller or Buyer
  const isCurrentPartyFarmer = useMemo(() => {
    return (
      activeUser.role === 'FARMER' ||
      activeUser.role === 'FPO_MEMBER' ||
      (currentLot ? currentUserId === currentLot.seller_user_id : false)
    );
  }, [activeUser.role, currentLot, currentUserId]);

  // Compute offer histories and prices per party
  const farmerOffers = useMemo(
    () => displayOffers.filter(isOfferFromFarmer),
    [displayOffers]
  );
  const buyerOffers = useMemo(
    () => displayOffers.filter(isOfferFromBuyer),
    [displayOffers]
  );

  const farmerPrices = useMemo(
    () => farmerOffers.map((o) => o.offer_price),
    [farmerOffers]
  );
  const buyerPrices = useMemo(
    () => buyerOffers.map((o) => o.offer_price),
    [buyerOffers]
  );

  // Inspect the most recent offer to enforce turn-based counter-offers
  const latestOffer = useMemo(() => {
    if (offers.length === 0) return null;
    return [...offers].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }, [offers]);

  // Track who placed the last offer and whose turn it is
  const lastOfferBy = useMemo<'FARMER' | 'BUYER' | null>(() => {
    if (!latestOffer) return null;
    return isOfferFromFarmer(latestOffer) ? 'FARMER' : 'BUYER';
  }, [latestOffer]);

  const lastOfferPrice = latestOffer ? latestOffer.offer_price : null;

  // Turn alternation: if no offers, either party can initiate. Otherwise strict alternation:
  // Farmer submits → Buyer responds → Farmer responds → Buyer responds...
  const currentTurn = useMemo<'FARMER' | 'BUYER' | 'ANY'>(() => {
    if (!lastOfferBy) return 'ANY';
    return lastOfferBy === 'FARMER' ? 'BUYER' : 'FARMER';
  }, [lastOfferBy]);

  const currentParty: 'FARMER' | 'BUYER' = isCurrentPartyFarmer ? 'FARMER' : 'BUYER';
  const isMyTurn = currentTurn === 'ANY' || currentTurn === currentParty;
  const isWaitingForOtherParty = !isMyTurn && latestOffer !== null;

  const isNegotiationLimitReached = displayOffers.length >= 10;

  // Form states for counter-offer
  const [newPrice, setNewPrice] = useState<number>(3100);
  const [newMessage, setNewMessage] = useState<string>(
    'Proposing agreement matching current market benchmark.'
  );
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const isOfferPending = (status: string) => {
    return status === 'PENDING' || status === 'Pending';
  };

  // Sync newPrice default to valid range when boundary or context changes
  useEffect(() => {
    if (lastOfferPrice !== null) {
      setNewPrice(lastOfferPrice);
    } else {
      setNewPrice(currentLot?.asking_price || 3100);
    }
    setSubmissionError(null);
  }, [currentLot?.id, lastOfferPrice]);

  const ruleHintText = useMemo(() => {
    if (displayOffers.length === 0) {
      return 'Rule: Initial offer (no prior counter constraint)';
    }
    if (isCurrentPartyFarmer) {
      if (lastOfferPrice !== null) {
        return `Rule: Maximum offer is ₹${lastOfferPrice.toLocaleString('en-IN')}/Q (Farmer offer ≤ Buyer's latest offer)`;
      }
    } else {
      if (lastOfferPrice !== null) {
        const isFirstBuyerOffer = buyerOffers.length === 0;
        if (isFirstBuyerOffer) {
          return `Rule: Maximum offer is ₹${lastOfferPrice.toLocaleString('en-IN')}/Q (Buyer offer ≤ Farmer's latest offer)`;
        } else {
          return `Rule: Minimum offer is ₹${lastOfferPrice.toLocaleString('en-IN')}/Q (Buyer offer ≥ Farmer's latest offer)`;
        }
      }
    }
    return '';
  }, [displayOffers.length, isCurrentPartyFarmer, lastOfferPrice, buyerOffers.length]);

  const priceInputMin = useMemo(() => {
    if (!isCurrentPartyFarmer && buyerOffers.length > 0 && lastOfferPrice !== null) {
      return lastOfferPrice;
    }
    return 1;
  }, [isCurrentPartyFarmer, buyerOffers.length, lastOfferPrice]);

  const priceInputMax = useMemo(() => {
    if (isCurrentPartyFarmer && lastOfferPrice !== null) {
      return lastOfferPrice;
    }
    if (!isCurrentPartyFarmer && buyerOffers.length === 0 && lastOfferPrice !== null) {
      return lastOfferPrice;
    }
    return undefined;
  }, [isCurrentPartyFarmer, buyerOffers.length, lastOfferPrice]);

  // Real-time inline validation feedback
  const inlineValidationError = useMemo(() => {
    if (isNegotiationLimitReached) {
      return 'Maximum 10 negotiation offers reached.';
    }
    if (isWaitingForOtherParty) {
      const otherParty = isCurrentPartyFarmer ? 'Buyer' : 'Farmer';
      return `Waiting for ${otherParty} to respond before submitting another offer.`;
    }
    if (!newPrice || newPrice <= 0) {
      return 'Please enter a valid offer price.';
    }

    if (displayOffers.length === 0 || lastOfferPrice === null) {
      return null;
    }

    if (isCurrentPartyFarmer) {
      if (newPrice > lastOfferPrice) {
        return `Farmer offer cannot exceed buyer's latest offer of ₹${lastOfferPrice.toLocaleString('en-IN')}/Q.`;
      }
    } else {
      const isFirstBuyerOffer = buyerOffers.length === 0;
      if (isFirstBuyerOffer) {
        if (newPrice > lastOfferPrice) {
          return `Buyer offer cannot exceed farmer's latest offer of ₹${lastOfferPrice.toLocaleString('en-IN')}/Q.`;
        }
      } else {
        if (newPrice < lastOfferPrice) {
          return `Buyer offer cannot be lower than farmer's latest offer of ₹${lastOfferPrice.toLocaleString('en-IN')}/Q.`;
        }
      }
    }
    return null;
  }, [
    isNegotiationLimitReached,
    isWaitingForOtherParty,
    isCurrentPartyFarmer,
    newPrice,
    displayOffers.length,
    lastOfferPrice,
    buyerOffers.length,
  ]);

  // Handle placing counter offer with strict validation
  const handlePlaceOffer = (parentOfferId?: string) => {
    if (!currentLot || isSubmittingOffer) return;
    setSubmissionError(null);

    // 1. Strict alternating turn check: prevent consecutive offers
    if (isWaitingForOtherParty || !isMyTurn) {
      const otherParty = isCurrentPartyFarmer ? 'Buyer' : 'Farmer';
      setSubmissionError(`Waiting for ${otherParty} to respond. You cannot submit consecutive offers.`);
      return;
    }

    // 2. Strict 10-offer limit check
    if (displayOffers.length >= 10) {
      setSubmissionError('Maximum 10 negotiation offers reached.');
      return;
    }

    // 3. Price validation
    if (!newPrice || newPrice <= 0) {
      setSubmissionError('Please enter a valid offer price.');
      return;
    }

    if (displayOffers.length > 0 && lastOfferPrice !== null) {
      if (isCurrentPartyFarmer) {
        if (newPrice > lastOfferPrice) {
          setSubmissionError(
            `Farmer offer cannot exceed buyer's latest offer of ₹${lastOfferPrice.toLocaleString('en-IN')}/Q.`
          );
          return;
        }
      } else {
        const isFirstBuyerOffer = buyerOffers.length === 0;
        if (isFirstBuyerOffer) {
          if (newPrice > lastOfferPrice) {
            setSubmissionError(
              `Buyer offer cannot exceed farmer's latest offer of ₹${lastOfferPrice.toLocaleString('en-IN')}/Q.`
            );
            return;
          }
        } else {
          if (newPrice < lastOfferPrice) {
            setSubmissionError(
              `Buyer offer cannot be lower than farmer's latest offer of ₹${lastOfferPrice.toLocaleString('en-IN')}/Q.`
            );
            return;
          }
        }
      }
    }

    setIsSubmittingOffer(true);
    try {
      const parentOffer = parentOfferId
        ? offers.find((p) => p.id === parentOfferId)
        : offers[0];
      const buyerId =
        parentOffer?.buyer_id ||
        associatedDeal?.buyer_id ||
        (activeUser.role === 'BUYER' ? activeUser.id : 'usr-buyer-1');

      dataStore.createOffer({
        lotId: currentLot.id,
        buyerId,
        senderId: currentUserId,
        offerPrice: newPrice,
        quantity: currentLot.quantity,
        message: newMessage,
        parentOfferId,
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setSubmissionError(err.message || 'Could not place offer');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  // Handle accepting offer
  const handleAcceptOffer = (offerId: string) => {
    try {
      dataStore.acceptOffer(offerId, {
        id: activeUser.id,
        name: activeUser.name,
        role: activeUser.role,
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Could not accept offer');
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  // Handle Dispatch & Schedule Pickup with Supabase update, duplicate-click prevention & error handling
  const handleDispatchAndSchedulePickup = async () => {
    if (!associatedDeal || isProcessing) return;
    setIsProcessing(true);
    try {
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase
          .from('deals')
          .update({ status: 'PICKUP_SCHEDULED' })
          .eq('id', associatedDeal.id);
        if (error) {
          throw error;
        }
      }

      dataStore.transitionDeal(associatedDeal.id, 'PICKUP_SCHEDULED', {
        id: activeUser.id,
        name: activeUser.name,
        role: activeUser.role,
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch and schedule pickup');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle progressing deal status
  const handleTransitionDeal = (nextState: LotStatus) => {
    if (!associatedDeal) return;
    try {
      dataStore.transitionDeal(associatedDeal.id, nextState, {
        id: activeUser.id,
        name: activeUser.name,
        role: activeUser.role,
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Transition rejected');
    }
  };

  const getLotStatusLabel = (status: LotStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return 'Offer Accepted (Contract Generated)';
      case 'PICKUP_SCHEDULED':
        return 'Pickup Scheduled';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered & Accepted at Dock';
      case 'PAID':
        return 'Settlement Paid';
      case 'COMPLETED':
        return 'Contract Completed';
      default:
        return status;
    }
  };

  const getOfferStatusBadge = (status: string) => {
    if (status === 'ACCEPTED') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#6A994E]/10 text-[#6A994E] border border-[#6A994E]/20">
          ACCEPTED
        </span>
      );
    }
    if (status === 'COUNTERED') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#454955]/10 text-[#454955] border border-[#454955]/20">
          COUNTERED
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        PENDING REVIEW
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Back button if in detail view */}
      {onBack && (
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#386641] hover:text-[#2d5535] bg-white border border-[#454955]/20 hover:border-[#386641] px-3.5 py-2 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to All Deals</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-[#454955]/20 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-[#0d0a0b] flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-[#386641]" />
              <span>Deals & Negotiation Engine</span>
            </h3>
            <span className="text-xs bg-[#F2E8CF] text-[#0d0a0b] px-2 py-0.5 rounded font-mono border border-[#454955]/20 font-semibold">
              Lot #{currentLot?.lot_number || ''}
            </span>
          </div>
          <p className="text-xs text-[#454955] mt-1">
            Bi-directional counter-offers, audit trails, and deterministic state transitions
          </p>
        </div>

        {/* Demo State Override Switcher */}
        {associatedDeal && (
          <div className="flex items-center space-x-2 bg-[#F2E8CF] p-2 rounded-lg border border-[#454955]/20 text-xs">
            <span className="text-[#0d0a0b] font-semibold text-[11px]">Demo State Transition</span>
            <select
              value={associatedDeal.status}
              onChange={(e) => handleTransitionDeal(e.target.value as LotStatus)}
              className="bg-white border border-[#454955]/20 text-[#0d0a0b] rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#386641]"
            >
              <option value="ACCEPTED">1. ACCEPTED (Contract Created)</option>
              <option value="PICKUP_SCHEDULED">2. PICKUP_SCHEDULED</option>
              <option value="IN_TRANSIT">3. IN_TRANSIT</option>
              <option value="DELIVERED">4. DELIVERED</option>
              <option value="PAID">5. PAID</option>
              <option value="COMPLETED">6. COMPLETED</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Negotiation Tree & Offer Forms */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#454955]/20 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#454955]/10">
              <div>
                <h4 className="text-sm font-bold text-[#0d0a0b]">Negotiation &amp; Offer History</h4>
                <span className="text-[11px] font-mono text-[#454955]">
                  Round {displayOffers.length} of 10 offers
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {isNegotiationLimitReached ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#bc4749]/10 text-[#bc4749] border border-[#bc4749]/30">
                    Limit Reached (10/10)
                  </span>
                ) : isWaitingForOtherParty ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Waiting for {isCurrentPartyFarmer ? 'Buyer' : 'Farmer'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#386641]/10 text-[#386641] border border-[#386641]/20">
                    Your Turn
                  </span>
                )}
                <span className="text-xs font-mono font-semibold text-[#386641]">
                  {10 - displayOffers.length} left
                </span>
              </div>
            </div>

            {/* Price Trajectory Summary */}
            {(farmerPrices.length > 0 || buyerPrices.length > 0) && (
              <div className="mb-3.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono">
                {farmerPrices.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#386641] uppercase tracking-wide">
                      Farmer
                    </span>
                    <div className="flex items-center space-x-1 font-semibold text-[#0d0a0b]">
                      <span>{farmerPrices.map((p) => `₹${p.toLocaleString('en-IN')}`).join(' → ')}</span>
                      <span className="text-[#386641] font-bold text-xs">asks</span>
                    </div>
                  </div>
                )}
                {buyerPrices.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#454955] uppercase tracking-wide">
                      Buyer
                    </span>
                    <div className="flex items-center space-x-1 font-semibold text-[#0d0a0b]">
                      <span>{buyerPrices.map((p) => `₹${p.toLocaleString('en-IN')}`).join(' → ')}</span>
                      <span className="text-amber-700 font-bold text-xs">bids</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Offer Cards */}
            <div className="space-y-3">
              {displayOffers.length === 0 ? (
                <div className="text-xs text-[#454955] py-4 text-center">
                  No active bids recorded for this lot yet.
                </div>
              ) : (
                displayOffers.map((offer) => {
                  const isAccepted = offer.status === 'ACCEPTED';
                  const isCountered = offer.status === 'COUNTERED';
                  const senderId = offer.sender_id || getOfferSenderId(offer);
                  const isMe = isSenderMe(offer, senderId);
                  const senderName = isMe ? 'You' : getCounterpartyName(offer, senderId);

                  return (
                    <div
                      key={offer.id}
                      className={`p-3.5 rounded-lg border text-xs transition ${
                        isAccepted
                          ? 'bg-[#6A994E]/10 border-[#6A994E]/30 shadow-2xs'
                          : isMe
                          ? 'bg-white border-[#6A994E]/35 shadow-2xs'
                          : isCountered
                          ? 'bg-[#F2E8CF]/50 border-[#454955]/20 opacity-80'
                          : 'bg-[#F2E8CF] border-[#454955]/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold font-sans ${isMe ? 'text-[#386641]' : 'text-[#0d0a0b]'}`}>
                            {senderName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {isOfferFromFarmer(offer) ? 'Farmer' : 'Buyer'}
                          </span>
                        </div>
                        {getOfferStatusBadge(offer.status)}
                      </div>

                      <div className="mt-2 flex items-baseline justify-between font-mono">
                        <div>
                          <span className="text-base font-bold text-[#386641]">
                            ₹{offer.offer_price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-[#454955]"> / Quintal</span>
                        </div>
                        <div className="text-[#454955]">
                          Total: <span className="text-[#386641] font-bold">₹{(offer.quantity * offer.offer_price).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <p className="mt-2 text-[#454955] text-[11px] italic bg-white p-2 rounded border border-[#454955]/10">
                        "{offer.message}"
                      </p>

                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#454955] font-mono pt-2 border-t border-[#454955]/10">
                        <span>{new Date(offer.created_at).toLocaleTimeString()} IST</span>

                        {/* If pending, created by other party, and authenticated, allow user to accept */}
                        {isOfferPending(offer.status) && !isMe && isUserAuthenticated && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleAcceptOffer(offer.id)}
                              className="px-3 py-1 bg-[#386641] hover:bg-[#2d5535] text-white rounded font-bold transition cursor-pointer shadow-xs"
                            >
                              Accept Bid & Create Contract
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Place New Counter-Bid Form */}
            <div className="mt-5 pt-4 border-t border-[#454955]/10">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-bold text-[#0d0a0b] uppercase tracking-wider">
                  Submit Counter-Offer
                </h5>
                <span className="text-[11px] font-mono text-[#454955]">
                  {displayOffers.length}/10 offers placed
                </span>
              </div>

              {isNegotiationLimitReached ? (
                <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-xs text-[#454955] text-center font-medium">
                  <p className="font-bold text-[#0d0a0b]">Negotiation Limit Reached</p>
                  <p className="text-[11px] mt-0.5 text-[#454955]">
                    Maximum 10 negotiation offers have been placed. No further counter-offers can be submitted.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {isWaitingForOtherParty && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center space-x-2.5">
                      <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <p className="font-semibold text-amber-950">
                          Waiting for {isCurrentPartyFarmer ? 'Buyer' : 'Farmer'} to respond
                        </p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Your offer has been submitted. You cannot submit another offer until {isCurrentPartyFarmer ? 'the buyer' : 'the farmer'} submits a counter-offer.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#454955]">Target Counter Rate ₹</span>
                      <input
                        type="number"
                        value={newPrice || ''}
                        onChange={(e) => {
                          setSubmissionError(null);
                          setNewPrice(parseInt(e.target.value) || 0);
                        }}
                        disabled={isNegotiationLimitReached || isWaitingForOtherParty || isSubmittingOffer}
                        min={priceInputMin}
                        max={priceInputMax}
                        className={`w-28 bg-[#F2E8CF] border rounded px-2 py-1 text-[#0d0a0b] font-mono font-semibold text-right focus:outline-none focus:ring-1 focus:ring-[#386641] disabled:opacity-50 disabled:cursor-not-allowed ${
                          inlineValidationError || submissionError
                            ? 'border-[#bc4749]'
                            : 'border-[#454955]/20'
                        }`}
                      />
                      <span className="text-[#454955]">/ Quintal</span>
                    </div>

                    {/* Directional rule hint */}
                    {ruleHintText && (
                      <div className="text-[10px] text-[#454955] font-mono">
                        {ruleHintText}
                      </div>
                    )}

                    {/* Validation error message in Blushed Brick #bc4749 */}
                    {(inlineValidationError || submissionError) && (
                      <div className="text-[11px] font-semibold text-[#bc4749] flex items-center space-x-1 mt-1">
                        <span>{submissionError || inlineValidationError}</span>
                      </div>
                    )}
                  </div>

                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isNegotiationLimitReached || isWaitingForOtherParty || isSubmittingOffer}
                    rows={2}
                    className="w-full bg-[#F2E8CF] border border-[#454955]/20 rounded-lg p-2 text-[#0d0a0b] text-xs focus:outline-none focus:ring-1 focus:ring-[#386641] disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter counter offer rationale or logistics terms..."
                  />

                  <button
                    type="button"
                    onClick={() => handlePlaceOffer(offers[0]?.id)}
                    disabled={isNegotiationLimitReached || isWaitingForOtherParty || isSubmittingOffer || Boolean(inlineValidationError)}
                    className="w-full py-2 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isWaitingForOtherParty ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-white/80" />
                        <span>Waiting for {isCurrentPartyFarmer ? 'Buyer' : 'Farmer'}</span>
                      </>
                    ) : isSubmittingOffer ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Offer...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                        <span>Submit Counter-Offer</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Formalized Contract & Deal Event Timeline */}
        <div className="lg:col-span-7 space-y-4">
          {associatedDeal ? (
            <div className="bg-white border border-[#454955]/20 rounded-xl p-5 shadow-2xs">
              {/* Contract Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#454955]/10 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-[#0d0a0b] font-mono">{associatedDeal.deal_number}</h4>
                    <span className="text-[10px] bg-[#6A994E]/10 text-[#6A994E] px-2 py-0.5 rounded border border-[#6A994E]/20 font-mono font-semibold">
                      {getLotStatusLabel(associatedDeal.status)}
                    </span>
                  </div>
                  <p className="text-xs text-[#454955] mt-0.5">
                    Legally Binding Commercial Contract with Immutable Audit Log
                  </p>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[10px] text-[#454955] uppercase font-semibold">Gross Contract Value</div>
                  <div className="text-lg font-bold text-[#386641]">
                    ₹{associatedDeal.gross_value.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Financial Deductions Summary */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F2E8CF] p-3 rounded-lg border border-[#454955]/20 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#454955] uppercase block font-semibold">Agreed Rate</span>
                  <span className="text-[#386641] font-bold">₹{associatedDeal.accepted_price.toLocaleString('en-IN')}/Quintal</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#454955] uppercase block font-semibold">Transport Freight</span>
                  <span className="text-red-700 font-bold">-₹{associatedDeal.transport_cost.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#454955] uppercase block font-semibold">Storage Cost</span>
                  <span className="text-red-700 font-bold">-₹{associatedDeal.storage_cost.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#454955] uppercase block font-semibold">Net Realisation</span>
                  <span className="text-[#386641] font-bold text-sm">₹{associatedDeal.net_realisation.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Sequential Action Controls */}
              <div className="mt-4 pt-3 border-t border-[#454955]/10">
                <div className="text-[11px] font-semibold text-[#454955] uppercase mb-2">
                  Execute Contract Milestone
                </div>
                <div className="flex flex-wrap gap-2">
                  {associatedDeal.status === 'ACCEPTED' ? (
                    <button
                      onClick={handleDispatchAndSchedulePickup}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Processing...' : 'Dispatch & Schedule Pickup'}
                    </button>
                  ) : (
                    associatedDeal.status !== 'COMPLETED' && (
                      <p className="text-[#386641] flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Pickup Scheduled
                      </p>
                    )
                  )}
                  {associatedDeal.status === 'PICKUP_SCHEDULED' && (
                    <button
                      onClick={() => handleTransitionDeal('IN_TRANSIT')}
                      className="px-3 py-1.5 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
                    >
                      Mark In Transit (Loaded)
                    </button>
                  )}
                  {associatedDeal.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleTransitionDeal('DELIVERED')}
                      className="px-3 py-1.5 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
                    >
                      Confirm Dock Delivery & QC Acceptance
                    </button>
                  )}
                  {associatedDeal.status === 'DELIVERED' && (
                    <button
                      onClick={() => handleTransitionDeal('PAID')}
                      className="px-3 py-1.5 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Execute Escrow Payment Release
                    </button>
                  )}
                  {associatedDeal.status === 'PAID' && (
                    <button
                      onClick={() => handleTransitionDeal('COMPLETED')}
                      className="px-3 py-1.5 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Archive as Completed Contract
                    </button>
                  )}
                  {associatedDeal.status === 'COMPLETED' && (
                    <div className="text-xs text-[#6A994E] font-semibold flex items-center space-x-1.5 bg-[#6A994E]/10 px-3 py-2 rounded-lg border border-[#6A994E]/20">
                      <CheckCircle2 className="w-4 h-4 text-[#6A994E]" />
                      <span>Deal fully completed and settled. Funds released.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deal Events Timeline Stream */}
              <div className="mt-5 pt-4 border-t border-[#454955]/10">
                <h5 className="text-xs font-bold text-[#0d0a0b] uppercase tracking-wider mb-3">
                  Audit & Lifecycle Stream ({dealEvents.length} Events)
                </h5>

                <div className="relative border-l border-[#454955]/20 ml-3 pl-4 space-y-4 text-xs">
                  {dealEvents.map((evt) => (
                    <div key={evt.id} className="relative group">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#386641] border-2 border-white"></div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0d0a0b]">{evt.title}</span>
                        <span className="text-[10px] text-[#454955] font-mono">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[#454955] text-[11px] mt-0.5">{evt.description}</p>
                      <div className="text-[10px] text-[#454955] font-mono mt-1">
                        Verified Actor: {evt.actor_name} ({evt.actor_role})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#454955]/20 rounded-xl p-8 text-center text-[#454955] text-xs shadow-2xs">
              Select or formalize an accepted offer to view the binding commercial contract and dispatch tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
