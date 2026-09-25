import {
  User,
  Organization,
  ProduceLot,
  LotContributor,
  AggregatedPool,
  BuyerRequirement,
  Offer,
  Deal,
  DealEvent,
  Payment,
  Settlement,
  Review,
  Dispute,
  DisputeCategory,
  FpoResolutionDecision,
  Alert,
  MarketPrice,
  LotStatus,
} from '../types/domain';
import { SEED_USERS, SEED_ORGANIZATIONS, SEED_FPO_PROFILES, SEED_BUYER_PROFILES } from '../data/seedUsers';
import { SEED_HISTORICAL_PRICES } from '../data/seedMarkets';
import {
  SEED_PRODUCE_LOTS,
  SEED_POOLED_LOTS,
  SEED_LOT_CONTRIBUTORS,
  SEED_BUYER_REQUIREMENTS,
  GOLDEN_LOT,
} from '../data/seedLotsAndRequirements';
import {
  GOLDEN_DEAL,
  GOLDEN_OFFERS,
  GOLDEN_DEAL_EVENTS,
  GOLDEN_PAYMENT,
  SEED_COMPLETED_DEALS,
  SEED_LOGISTICS_OPTIONS,
  SEED_STORAGE_OPTIONS,
  SEED_REVIEWS,
  SEED_DISPUTES,
  SEED_ALERTS,
} from '../data/seedDealsAndHistory';
import { transitionDealState, createDealEvent } from './dealService';
import { calculateFPOSettlement, generateSettlementRecords } from './settlementService';

export interface AuditLogEntry {
  id: string;
  operation: string;
  entityId: string;
  actor: string;
  previousState?: string;
  newState?: string;
  timestamp: string;
  success: boolean;
  details?: Record<string, any>;
}

class AgriMarketDataStore {
  private users: User[] = [...SEED_USERS];
  private organizations: Organization[] = [...SEED_ORGANIZATIONS];
  private lots: ProduceLot[] = [...SEED_PRODUCE_LOTS, ...SEED_POOLED_LOTS];
  private contributors: LotContributor[] = [...SEED_LOT_CONTRIBUTORS];
  private requirements: BuyerRequirement[] = [...SEED_BUYER_REQUIREMENTS];
  private offers: Offer[] = [...GOLDEN_OFFERS];
  private deals: Deal[] = [...SEED_COMPLETED_DEALS];
  private dealEvents: DealEvent[] = [...GOLDEN_DEAL_EVENTS];
  private payments: Payment[] = [GOLDEN_PAYMENT];
  private settlements: Settlement[] = [];
  private reviews: Review[] = [...SEED_REVIEWS];
  private disputes: Dispute[] = [...SEED_DISPUTES];
  private alerts: Alert[] = [...SEED_ALERTS];
  private historicalPrices: MarketPrice[] = [...SEED_HISTORICAL_PRICES];
  private auditLogs: AuditLogEntry[] = [];
  private demoAggregatedPools: AggregatedPool[] = [];
  private demoAggregatedLotIds: string[] = [];
  private poolListeners: Array<() => void> = [];
  private disputeListeners: Array<() => void> = [];

  // Active current user for demo identity switching
  private activeUserId: string = 'usr-farmer-1';

  constructor() {
    this.logOperation('INITIALIZE_DATASTORE', 'root', 'SYSTEM', true, {
      lotsCount: this.lots.length,
      dealsCount: this.deals.length,
      requirementsCount: this.requirements.length,
    });
  }

  private logOperation(
    operation: string,
    entityId: string,
    actor: string,
    success: boolean,
    details?: Record<string, any>,
    previousState?: string,
    newState?: string
  ) {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      operation,
      entityId,
      actor,
      previousState,
      newState,
      timestamp: new Date().toISOString(),
      success,
      details,
    };
    this.auditLogs.unshift(entry);
    console.log(`[AgriMarket Domain Audit] ${operation} on ${entityId} by ${actor}: ${success ? 'OK' : 'FAIL'}`);
  }

  // --- IDENTITY & USERS ---
  public getActiveUser(): User {
    return this.users.find((u) => u.id === this.activeUserId) || this.users[0];
  }

  public setActiveUser(userId: string) {
    const found = this.users.find((u) => u.id === userId);
    if (found) {
      this.activeUserId = userId;
      this.logOperation('SWITCH_DEMO_USER', userId, found.name, true, { role: found.role });
    }
  }

  public getUsers(): User[] {
    return this.users;
  }

  public getOrganizations(): Organization[] {
    return this.organizations;
  }

  // --- MARKET DATA ---
  public getHistoricalPrices(commodity?: string): MarketPrice[] {
    if (!commodity) return this.historicalPrices;
    return this.historicalPrices.filter((p) => p.commodity.toLowerCase() === commodity.toLowerCase());
  }

  // --- PRODUCE LOTS ---
  public getLots(): ProduceLot[] {
    return this.lots;
  }

  public getLotById(id: string): ProduceLot | undefined {
    return this.lots.find((l) => l.id === id);
  }

  public createLot(lotData: Omit<ProduceLot, 'id' | 'created_at'>): ProduceLot {
    // Constraint enforcement
    if (lotData.quantity <= 0) throw new Error('Produce lot quantity must be strictly greater than 0.');
    if (lotData.asking_price < 0) throw new Error('Asking price cannot be negative.');

    const newLot: ProduceLot = {
      ...lotData,
      id: `lot-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    this.lots.unshift(newLot);
    this.logOperation('CREATE_LOT', newLot.id, newLot.seller_user_id, true, {
      lotNumber: newLot.lot_number,
      commodity: newLot.commodity,
      quantity: newLot.quantity,
    });
    return newLot;
  }

  // --- FPO POOLING ---
  public createPooledLot(params: {
    fpoUserId: string;
    fpoOrgId: string;
    commodity: string;
    variety: string;
    grade: any;
    askingPrice: number;
    minimumAcceptablePrice: number;
    pickupLocation: string;
    sourceContributors: { farmerId: string; sourceLotId: string; quantity: number }[];
  }): ProduceLot {
    const totalQty = params.sourceContributors.reduce((sum, c) => sum + c.quantity, 0);
    if (totalQty <= 0) throw new Error('Pooled lot must have at least one contributor with positive quantity.');

    const pooledLotId = `pool-${Date.now()}`;
    const lotNumber = `POOL #SF-${params.commodity.substring(0, 3).toUpperCase()}-${String(totalQty).padStart(4, '0')}`;

    const newPooledLot: ProduceLot = {
      id: pooledLotId,
      lot_number: lotNumber,
      seller_user_id: params.fpoUserId,
      seller_organization_id: params.fpoOrgId,
      seller_type: 'FPO',
      commodity: params.commodity,
      variety: params.variety || 'Standard Aggregated',
      quantity: totalQty,
      unit: 'Quintal',
      harvest_date: new Date().toISOString().split('T')[0],
      available_from: new Date().toISOString().split('T')[0],
      origin: 'Sahyadri Agro Hub, Dindori, Nashik',
      district: 'Nashik',
      state: 'Maharashtra',
      grade: params.grade || 'A',
      quality_attributes: { blemish_percentage: 1.5 },
      packaging: 'Returnable Plastic Crates',
      storage_requirement: 'COLD_STORAGE',
      asking_price: params.askingPrice,
      minimum_acceptable_price: params.minimumAcceptablePrice,
      delivery_mode: 'DELIVERED_TO_BUYER_WAREHOUSE',
      transport_paid_by: 'SELLER',
      pickup_location: params.pickupLocation,
      status: 'LISTED',
      is_pooled: true,
      source_lot_ids: params.sourceContributors.map((c) => c.sourceLotId),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    };

    // Create and attach contributors preserving links
    params.sourceContributors.forEach((c) => {
      const farmer = this.users.find((u) => u.id === c.farmerId);
      const share = Math.round((c.quantity / totalQty) * 10000) / 100;
      this.contributors.push({
        id: `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        pooled_lot_id: pooledLotId,
        farmer_id: c.farmerId,
        farmer_name: farmer?.name || 'Farmer Contributor',
        source_lot_id: c.sourceLotId,
        quantity: c.quantity,
        share_percentage: share,
        agreed_payout_price: params.minimumAcceptablePrice,
        payout_amount: Math.round(c.quantity * params.minimumAcceptablePrice * 0.98), // After 2% FPO fee
      });
    });

    this.lots.unshift(newPooledLot);
    this.logOperation('CREATE_POOLED_LOT', pooledLotId, params.fpoUserId, true, {
      contributorsCount: params.sourceContributors.length,
      totalQuantity: totalQty,
    });

    return newPooledLot;
  }

  public getContributorsForLot(pooledLotId: string): LotContributor[] {
    return this.contributors.filter((c) => c.pooled_lot_id === pooledLotId);
  }

  // --- DEMO FPO AGGREGATED POOLS (UI-ONLY PROTOTYPE) ---
  public getDemoAggregatedPools(): AggregatedPool[] {
    return [...this.demoAggregatedPools];
  }

  public addDemoAggregatedPool(pool: AggregatedPool): void {
    this.demoAggregatedPools.unshift(pool);
    this.notifyPoolListeners();
  }

  public getDemoAggregatedLotIds(): string[] {
    return [...this.demoAggregatedLotIds];
  }

  public addDemoAggregatedLotIds(ids: string[]): void {
    this.demoAggregatedLotIds.push(...ids);
    this.notifyPoolListeners();
  }

  public subscribeToPools(listener: () => void): () => void {
    this.poolListeners.push(listener);
    return () => {
      this.poolListeners = this.poolListeners.filter((l) => l !== listener);
    };
  }

  private notifyPoolListeners(): void {
    this.poolListeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Pool listener error:', e);
      }
    });
  }

  // --- BUYER REQUIREMENTS ---
  public getRequirements(): BuyerRequirement[] {
    return this.requirements;
  }

  public createRequirement(req: Omit<BuyerRequirement, 'id' | 'created_at'>): BuyerRequirement {
    if (req.quantity <= 0) throw new Error('Requirement quantity must be positive.');
    if (req.target_price <= 0) throw new Error('Target price must be positive.');

    const newReq: BuyerRequirement = {
      ...req,
      id: `req-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.requirements.unshift(newReq);
    this.logOperation('CREATE_BUYER_REQUIREMENT', newReq.id, newReq.buyer_id, true, {
      commodity: newReq.commodity,
      quantity: newReq.quantity,
      targetPrice: newReq.target_price,
    });
    return newReq;
  }

  // --- OFFERS & NEGOTIATIONS ---
  public getOffersForLot(lotId: string): Offer[] {
    return this.offers.filter((o) => o.lot_id === lotId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createOffer(params: {
    lotId: string;
    buyerId: string;
    senderId?: string;
    offerPrice: number;
    quantity: number;
    message: string;
    parentOfferId?: string;
  }): Offer {
    const lot = this.getLotById(params.lotId);
    if (!lot) throw new Error('Target lot not found.');
    const buyer = this.users.find((u) => u.id === params.buyerId);
    if (!buyer) throw new Error('Buyer not found.');
    const seller = this.users.find((u) => u.id === lot.seller_user_id);

    // Enforce 10 offers limit per negotiation
    const existingOffers = this.getOffersForLot(params.lotId);
    if (existingOffers.length >= 10) {
      throw new Error('Maximum 10 negotiation offers reached.');
    }

    if (!params.offerPrice || params.offerPrice <= 0) {
      throw new Error('Offer price must be greater than zero.');
    }

    const senderId = params.senderId || params.buyerId;
    const isFarmerSender =
      senderId === lot.seller_user_id ||
      this.users.find((u) => u.id === senderId)?.role === 'FARMER' ||
      this.users.find((u) => u.id === senderId)?.role === 'FPO_MEMBER';

    const isOfferFarmer = (o: Offer): boolean => {
      const sId = o.sender_id;
      if (sId) {
        if (sId === lot.seller_user_id || sId === o.seller_id) return true;
        if (sId === o.buyer_id) return false;
        const u = this.users.find((user) => user.id === sId);
        if (u) return u.role === 'FARMER' || u.role === 'FPO_MEMBER';
      }
      return false;
    };

    if (existingOffers.length > 0) {
      const latestOffer = existingOffers[0];
      const latestOfferByFarmer = isOfferFarmer(latestOffer);

      // Enforce strict alternating turns: one active offer at a time
      if (isFarmerSender && latestOfferByFarmer) {
        throw new Error('Waiting for Buyer to respond. You cannot submit consecutive offers.');
      }
      if (!isFarmerSender && !latestOfferByFarmer) {
        throw new Error('Waiting for Farmer to respond. You cannot submit consecutive offers.');
      }

      // Enforce price constraints
      if (isFarmerSender) {
        // Farmer counter-offer:
        // "The farmer can negotiate downward or maintain the buyer's latest price, but cannot go above it.
        // Therefore: Farmer offer ≤ Buyer's latest offer"
        const latestBuyerPrice = latestOffer.offer_price;
        if (params.offerPrice > latestBuyerPrice) {
          throw new Error(
            `Farmer offer cannot exceed buyer's latest offer of ₹${latestBuyerPrice.toLocaleString('en-IN')}/Q.`
          );
        }
      } else {
        // Buyer counter-offer
        const latestFarmerPrice = latestOffer.offer_price;
        const buyerPrevOffers = existingOffers.filter((o) => !isOfferFarmer(o));

        if (buyerPrevOffers.length === 0) {
          // Initial buyer counter-offer responding to farmer:
          // "The buyer is allowed to negotiate downward.
          // Therefore: Buyer offer ≤ Farmer's latest offer"
          if (params.offerPrice > latestFarmerPrice) {
            throw new Error(
              `Buyer offer cannot exceed farmer's latest offer of ₹${latestFarmerPrice.toLocaleString('en-IN')}/Q.`
            );
          }
        } else {
          // Buyer subsequent counter:
          // "After the farmer submits a counter:
          // The buyer cannot go below the farmer's latest offer.
          // Therefore: Buyer offer ≥ Farmer's latest offer"
          if (params.offerPrice < latestFarmerPrice) {
            throw new Error(
              `Buyer offer cannot be lower than farmer's latest offer of ₹${latestFarmerPrice.toLocaleString('en-IN')}/Q.`
            );
          }
        }
      }
    }

    // If parent offer exists, mark parent as COUNTERED
    if (params.parentOfferId) {
      const parent = this.offers.find((o) => o.id === params.parentOfferId);
      if (parent) {
        parent.status = 'COUNTERED';
      }
    }

    const newOffer: Offer = {
      id: `off-${Date.now()}`,
      lot_id: params.lotId,
      buyer_id: params.buyerId,
      buyer_name: buyer.name,
      seller_id: lot.seller_user_id,
      seller_name: seller?.name || 'Seller',
      offer_price: params.offerPrice,
      quantity: params.quantity,
      message: params.message,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'PENDING',
      parent_offer_id: params.parentOfferId,
      sender_id: params.senderId || params.buyerId,
    };

    this.offers.unshift(newOffer);

    // Update lot state to OFFER_RECEIVED or NEGOTIATING
    lot.status = params.parentOfferId ? 'NEGOTIATING' : 'OFFER_RECEIVED';

    this.logOperation('CREATE_OFFER', newOffer.id, params.buyerId, true, {
      lotId: params.lotId,
      offerPrice: params.offerPrice,
      quantity: params.quantity,
    });

    return newOffer;
  }

  // --- ATOMIC OFFER ACCEPTANCE & DEAL CREATION ---
  public acceptOffer(offerId: string, actor: { id: string; name: string; role: string }): Deal {
    const offer = this.offers.find((o) => o.id === offerId);
    if (!offer) throw new Error('Offer not found.');
    if (offer.status === 'ACCEPTED') {
      // Idempotency: return existing deal
      const existing = this.deals.find((d) => d.accepted_offer_id === offerId);
      if (existing) return existing;
    }

    const lot = this.getLotById(offer.lot_id);
    if (!lot) throw new Error('Lot associated with offer not found.');

    // Atomic updates:
    // 1. Mark accepted offer as ACCEPTED
    offer.status = 'ACCEPTED';

    // 2. Mark other competing offers for same lot as REJECTED/EXPIRED
    this.offers
      .filter((o) => o.lot_id === lot.id && o.id !== offer.id && o.status === 'PENDING')
      .forEach((competing) => {
        competing.status = 'REJECTED';
      });

    // 3. Update lot status to ACCEPTED
    lot.status = 'ACCEPTED';

    // 4. Calculate financial parameters
    const grossValue = offer.quantity * offer.offer_price;
    const transportCost = lot.transport_paid_by === 'BUYER' ? 0 : Math.round(offer.quantity * 75);
    const storageCost = 0;
    const serviceFee = Math.round(grossValue * 0.005);
    const netRealisation = grossValue - transportCost - storageCost - serviceFee;

    const dealNumber = `DEAL-2026-${Date.now().toString().slice(-4)}-${lot.commodity.slice(0, 3).toUpperCase()}`;

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      deal_number: dealNumber,
      lot_id: lot.id,
      accepted_offer_id: offer.id,
      buyer_id: offer.buyer_id,
      buyer_name: offer.buyer_name,
      seller_id: lot.seller_user_id,
      seller_name: offer.seller_name,
      seller_type: lot.seller_type,
      commodity: lot.commodity,
      accepted_price: offer.offer_price,
      quantity: offer.quantity,
      gross_value: grossValue,
      transport_cost: transportCost,
      storage_cost: storageCost,
      service_fee: serviceFee,
      net_realisation: netRealisation,
      delivery_mode: lot.delivery_mode,
      transport_paid_by: lot.transport_paid_by,
      pickup_location: lot.pickup_location,
      delivery_location: lot.delivery_location || 'Buyer Terminal',
      status: 'ACCEPTED',
      accepted_at: new Date().toISOString(),
      is_pooled: lot.is_pooled,
    };

    this.deals.unshift(newDeal);

    // 5. Create immutable deal events
    const evt1 = createDealEvent({
      dealId: newDeal.id,
      eventType: 'OFFER_ACCEPTED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      title: 'Offer Accepted & Agreement Locked',
      description: `${actor.name} accepted offer of ₹${offer.offer_price}/Q for ${offer.quantity}Q of ${lot.commodity}.`,
      metadata: { grossValue, acceptedPrice: offer.offer_price },
    });
    this.dealEvents.push(evt1);

    this.logOperation('ACCEPT_OFFER_CREATE_DEAL', newDeal.id, actor.id, true, {
      offerId,
      dealNumber,
      grossValue,
    });

    return newDeal;
  }

  // --- DEALS & LIFECYCLE ---
  public getDeals(): Deal[] {
    return this.deals;
  }

  public getDealById(id: string): Deal | undefined {
    return this.deals.find((d) => d.id === id);
  }

  public getDealEvents(dealId: string): DealEvent[] {
    return this.dealEvents
      .filter((e) => e.deal_id === dealId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public transitionDeal(dealId: string, nextState: LotStatus, actor: { id: string; name: string; role: string }): Deal {
    const deal = this.getDealById(dealId);
    if (!deal) throw new Error('Deal not found.');

    const previousState = deal.status;
    const { updatedDeal, newEvent } = transitionDealState(deal, nextState, actor);

    // Update deal in-memory
    const index = this.deals.findIndex((d) => d.id === dealId);
    if (index !== -1) {
      this.deals[index] = updatedDeal;
    }

    // Sync underlying lot status
    const lot = this.getLotById(deal.lot_id);
    if (lot) {
      lot.status = nextState;
    }

    this.dealEvents.push(newEvent);

    // If transitioned to PAID or COMPLETED, ensure payment record exists
    if (nextState === 'PAID' || nextState === 'COMPLETED') {
      this.recordSimulatedPayment(deal);
      // If pooled lot, automatically calculate and trigger FPO settlement distribution
      if (deal.is_pooled) {
        this.processFPODealSettlement(deal);
      }
    }

    this.logOperation('TRANSITION_DEAL_STATE', deal.id, actor.id, true, {
      dealNumber: deal.deal_number,
    }, previousState, nextState);

    return updatedDeal;
  }

  // Record simulated payment
  public recordSimulatedPayment(deal: Deal): Payment {
    const existing = this.payments.find((p) => p.deal_id === deal.id);
    if (existing) {
      existing.status = 'PAID';
      existing.paid_at = existing.paid_at || new Date().toISOString();
      return existing;
    }

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      deal_id: deal.id,
      gross_amount: deal.gross_value,
      deductions: {
        transport: deal.transport_cost,
        storage: deal.storage_cost,
        service_fee: deal.service_fee,
      },
      net_amount: deal.net_realisation,
      payment_method: 'DEMO_ESCROW_RTGS',
      status: 'PAID',
      initiated_at: new Date(Date.now() - 3600000).toISOString(),
      processed_at: new Date(Date.now() - 1800000).toISOString(),
      paid_at: new Date().toISOString(),
      reference: `SIM-RTGS-${deal.deal_number.replace(/[^A-Z0-9]/gi, '')}-${deal.net_realisation}`,
      is_simulated: true,
    };

    this.payments.unshift(newPayment);
    return newPayment;
  }

  // FPO Settlement Processing
  public processFPODealSettlement(deal: Deal) {
    const contributors = this.getContributorsForLot(deal.lot_id);
    if (contributors.length === 0) return;

    const breakdown = calculateFPOSettlement(deal.id, deal.gross_value, contributors, 2.0);
    const settlementRecords = generateSettlementRecords(breakdown, 'org-fpo-1', 'Sahyadri Farmers Producer Company');

    settlementRecords.forEach((s) => {
      if (!this.settlements.some((existing) => existing.id === s.id)) {
        this.settlements.push(s);
      }
    });

    this.logOperation('FPO_SETTLEMENT_DISTRIBUTED', deal.id, 'org-fpo-1', true, {
      grossSaleValue: deal.gross_value,
      reconciled: breakdown.reconciliationCheck.totalEqualsGross,
      contributorsPaid: contributors.length,
    });
  }

  public getSettlementsForDeal(dealId: string): Settlement[] {
    return this.settlements.filter((s) => s.deal_id === dealId);
  }

  public getPaymentForDeal(dealId: string): Payment | undefined {
    return this.payments.find((p) => p.deal_id === dealId);
  }

  // --- REVIEWS & DISPUTES ---
  public getReviews(): Review[] {
    return this.reviews;
  }

  public createReview(params: {
    transactionId: string;
    reviewerId: string;
    reviewerName: string;
    revieweeId: string;
    revieweeName: string;
    rating: number;
    comment: string;
  }): Review {
    if (params.rating < 1 || params.rating > 5) throw new Error('Review rating must be between 1 and 5.');

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      transaction_id: params.transactionId,
      reviewer_id: params.reviewerId,
      reviewer_name: params.reviewerName,
      reviewee_id: params.revieweeId,
      reviewee_name: params.revieweeName,
      rating: params.rating,
      comment: params.comment,
      created_at: new Date().toISOString(),
    };
    this.reviews.unshift(newRev);
    this.logOperation('SUBMIT_REVIEW', newRev.id, params.reviewerId, true, { rating: params.rating });
    return newRev;
  }

  public subscribeToDisputes(listener: () => void): () => void {
    this.disputeListeners.push(listener);
    return () => {
      this.disputeListeners = this.disputeListeners.filter((l) => l !== listener);
    };
  }

  private notifyDisputeListeners() {
    this.disputeListeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error in disputeListener:', err);
      }
    });
  }

  public getDisputes(): Dispute[] {
    return this.disputes;
  }

  public getDisputeById(id: string): Dispute | undefined {
    return this.disputes.find((d) => d.id === id);
  }

  public raiseDispute(params: {
    transactionId?: string;
    dealId?: string;
    dealNumber: string;
    lotId?: string;
    commodity?: string;
    raisedBy: string;
    raisedByName: string;
    raisedByRole?: 'FARMER' | 'BUYER';
    otherPartyId?: string;
    otherPartyName?: string;
    otherPartyRole?: 'FARMER' | 'BUYER';
    category: DisputeCategory | string;
    description: string;
    affectedQuantity?: number;
    affectedAmount?: number;
    evidence?: string;
  }): Dispute {
    const txId = params.dealId || params.transactionId || `deal-${Date.now()}`;
    const disputeNumber = Math.floor(1000 + Math.random() * 9000);
    const newDispute: Dispute = {
      id: `DISP-${disputeNumber}`,
      transaction_id: txId,
      deal_id: txId,
      deal_number: params.dealNumber,
      lot_id: params.lotId,
      commodity: params.commodity,
      raised_by: params.raisedBy,
      raised_by_name: params.raisedByName,
      raised_by_role: params.raisedByRole,
      other_party_id: params.otherPartyId,
      other_party_name: params.otherPartyName,
      other_party_role: params.otherPartyRole,
      category: params.category,
      description: params.description,
      affected_quantity: params.affectedQuantity,
      affected_amount: params.affectedAmount,
      evidence: params.evidence || '',
      status: 'OPEN',
      created_at: new Date().toISOString(),
    };
    this.disputes.unshift(newDispute);
    this.logOperation('RAISE_DISPUTE', newDispute.id, params.raisedBy, true, {
      category: params.category,
      dealNumber: params.dealNumber,
    });
    this.notifyDisputeListeners();
    return newDispute;
  }

  public startDisputeReview(
    disputeId: string,
    actor: { id: string; name: string; role?: string }
  ): Dispute {
    const dispute = this.disputes.find((d) => d.id === disputeId);
    if (!dispute) throw new Error('Dispute not found.');
    dispute.status = 'UNDER_REVIEW';
    this.logOperation('START_DISPUTE_REVIEW', disputeId, actor.id, true, {
      reviewedBy: actor.name,
    });
    this.notifyDisputeListeners();
    return dispute;
  }

  public resolveDispute(
    disputeId: string,
    resolutionOrParams:
      | string
      | {
          decision: FpoResolutionDecision;
          resolutionNote: string;
          resolvedQuantity?: number;
          resolvedAmount?: number;
          resolvedBy?: string;
          resolvedByName?: string;
        }
  ): Dispute {
    const dispute = this.disputes.find((d) => d.id === disputeId);
    if (!dispute) throw new Error('Dispute not found.');

    dispute.status = 'RESOLVED';
    dispute.resolved_at = new Date().toISOString();

    if (typeof resolutionOrParams === 'string') {
      dispute.resolution = resolutionOrParams;
      dispute.resolution_note = resolutionOrParams;
      dispute.fpo_resolution = 'PARTIAL_RESOLUTION';
      dispute.resolved_by = 'org-fpo-1';
      dispute.resolved_by_name = 'Sahyadri Farmers Producer Co. (FPO)';
      this.logOperation('RESOLVE_DISPUTE', disputeId, 'ADMIN', true, { resolution: resolutionOrParams });
    } else {
      dispute.fpo_resolution = resolutionOrParams.decision;
      dispute.resolution_note = resolutionOrParams.resolutionNote;
      dispute.resolution = resolutionOrParams.resolutionNote;
      dispute.resolved_quantity = resolutionOrParams.resolvedQuantity;
      dispute.resolved_amount = resolutionOrParams.resolvedAmount;
      dispute.resolved_by = resolutionOrParams.resolvedBy || 'org-fpo-1';
      dispute.resolved_by_name =
        resolutionOrParams.resolvedByName || 'Sahyadri Farmers Producer Co. (FPO)';
      this.logOperation(
        'RESOLVE_DISPUTE',
        disputeId,
        resolutionOrParams.resolvedBy || 'org-fpo-1',
        true,
        {
          decision: resolutionOrParams.decision,
          resolutionNote: resolutionOrParams.resolutionNote,
          resolvedAmount: resolutionOrParams.resolvedAmount,
        }
      );
    }

    this.notifyDisputeListeners();
    return dispute;
  }

  // --- ALERTS ---
  public getAlerts(): Alert[] {
    return this.alerts;
  }

  public markAlertRead(alertId: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) alert.read = true;
  }

  // --- LOGISTICS & STORAGE OPTIONS ---
  public getLogisticsOptions(): any[] {
    return SEED_LOGISTICS_OPTIONS;
  }

  public getStorageOptions(): any[] {
    return SEED_STORAGE_OPTIONS;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }

  // --- RESET TO GOLDEN STATE ---
  public resetToGoldenState() {
    this.lots = [...SEED_PRODUCE_LOTS, ...SEED_POOLED_LOTS];
    this.offers = [...GOLDEN_OFFERS];
    this.deals = [...SEED_COMPLETED_DEALS];
    this.dealEvents = [...GOLDEN_DEAL_EVENTS];
    this.payments = [GOLDEN_PAYMENT];
    this.disputes = [...SEED_DISPUTES];
    this.activeUserId = 'usr-farmer-1';
    this.notifyDisputeListeners();
    this.logOperation('RESET_GOLDEN_STATE', 'system', 'ADMIN', true);
  }
}

export const dataStore = new AgriMarketDataStore();
