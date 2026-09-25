/**
 * AgriMarket Intelligence Platform - Canonical Domain Types
 * SIH 2026 Master Specification
 */

export type UserRole = 'FARMER' | 'FPO_MEMBER' | 'BUYER';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone_demo: string;
  location: string;
  district: string;
  state: string;
  created_at: string;
  avatar_url?: string;
}

export type OrgType = 'FPO' | 'BUYER_ORGANIZATION';

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  location: string;
  district: string;
  state: string;
  verification_status: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  membership_role: 'LEAD' | 'MEMBER' | 'PROCUREMENT_HEAD' | 'DIRECTOR';
  joined_at: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FarmerProfile {
  user_id: string;
  primary_commodities: string[];
  farm_location: string;
  district: string;
  state: string;
  associated_fpo_id?: string;
  land_holding_acres: number;
}

export interface FPOProfile {
  organization_id: string;
  registration_reference_demo: string;
  member_count: number;
  service_fee_percentage: number;
  verification_status: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  commodities_handled: string[];
}

export interface BuyerProfile {
  organization_id: string;
  verification_status: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  payment_reliability_score: number; // 0-100 derived from transactions
  completed_transactions: number;
  average_payment_time_hours: number;
  average_rating: number; // 1-5
  dispute_rate_percentage: number;
}

export type LotStatus =
  | 'DRAFT'
  | 'LISTED'
  | 'MATCHED'
  | 'OFFER_RECEIVED'
  | 'NEGOTIATING'
  | 'ACCEPTED'
  | 'LOGISTICS_PENDING'
  | 'PICKUP_SCHEDULED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type ProduceGrade = 'A' | 'B' | 'C' | 'SUPERIOR' | 'STANDARD';

export type DeliveryMode =
  | 'BUYER_PICKUP_FARM_GATE'
  | 'DELIVERED_TO_MANDI'
  | 'DELIVERED_TO_BUYER_WAREHOUSE'
  | 'DELIVERED_TO_FPO_COLLECTION_CENTRE'
  | 'supplier_delivery'
  | 'buyer_pickup';

export type SimpleDeliveryMode = 'supplier_delivery' | 'buyer_pickup';
export type SimpleTransportPayer = 'supplier' | 'buyer';
export type TransportPaidBy = 'SELLER' | 'BUYER' | 'SPLIT_50_50' | 'supplier' | 'buyer';

export interface ProduceLot {
  id: string;
  lot_number: string;
  seller_user_id: string;
  seller_organization_id?: string;
  seller_type: 'FARMER' | 'FPO';
  commodity: string;
  variety: string;
  quantity: number; // Quintals
  unit: 'Quintal';
  harvest_date: string;
  available_from: string;
  origin: string;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
  grade: ProduceGrade;
  quality_attributes: {
    moisture_percentage?: number;
    color?: string;
    size_diameter_mm?: number;
    blemish_percentage?: number;
    ai_quality_score?: number;
    ai_confidence?: number;
    ai_predicted_class?: string;
    ai_condition?: string;
  };
  packaging: string;
  storage_requirement: 'COLD_STORAGE' | 'DRY_VENTILATED' | 'IMMEDIATE_SALE';
  asking_price: number; // INR per Quintal
  minimum_acceptable_price: number; // INR per Quintal
  delivery_mode: DeliveryMode;
  transport_paid_by: TransportPaidBy;
  simple_delivery_mode?: SimpleDeliveryMode;
  transport_cost_per_quintal?: number;
  transport_cost_payer?: SimpleTransportPayer;
  delivery_terms_status?: 'PENDING' | 'ACCEPTED' | 'COUNTERED';
  pickup_location: string;
  delivery_location?: string;
  status: LotStatus;
  is_pooled?: boolean;
  source_lot_ids?: string[];
  created_at: string;
  expires_at: string;
}

export interface LotContributor {
  id: string;
  pooled_lot_id: string;
  farmer_id: string;
  farmer_name: string;
  source_lot_id: string;
  quantity: number; // in Quintals
  share_percentage: number; // e.g. 40.0%
  agreed_payout_price: number; // INR/Q
  payout_amount: number; // Calculated net payout
}

export interface AggregatedPool {
  id: string;
  commodity: string;
  grade?: string;
  totalQuantity: number;
  lotCount: number;
  status: string;
  farmers: string[];
  avgAskingPrice?: number;
  createdAt: string;
}

export interface BuyerRequirement {
  id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_org_id: string;
  buyer_org_name: string;
  commodity: string;
  quantity: number; // Quintals required
  unit: 'Quintal';
  grade: ProduceGrade;
  quality_requirements: {
    max_moisture_percentage?: number;
    min_size_mm?: number;
    max_blemish_percentage?: number;
  };
  target_price: number; // INR per Quintal
  delivery_location: string;
  required_by: string; // Target Date
  delivery_mode: DeliveryMode;
  status: 'OPEN' | 'PARTIALLY_FILLED' | 'FULFILLED' | 'CANCELLED';
  created_at: string;
  reliability_score: number; // 0-100 derived
}

export interface MatchResult {
  requirementId: string;
  requirement: BuyerRequirement;
  lotId: string;
  eligible: boolean;
  ineligibilityReason?: string;
  overallScore: number; // 0-100
  componentScores: {
    quantity: number; // 0-25
    quality: number; // 0-20
    location: number; // 0-20
    price: number; // 0-15
    delivery: number; // 0-10
    reliability: number; // 0-10
  };
  reasons: string[];
  warnings: string[];
  estimatedDistanceKm: number;
  estimatedTransportCost: number;
  netRealisationEstimate: number;
}

export type OfferStatus = 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface Offer {
  id: string;
  lot_id: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  offer_price: number; // INR/Q
  quantity: number; // Quintals
  message: string;
  created_at: string;
  expires_at: string;
  status: OfferStatus;
  parent_offer_id?: string;
  counter_offer_count?: number;
  sender_id?: string;
}

export interface Deal {
  id: string;
  deal_number: string;
  lot_id: string;
  accepted_offer_id: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  seller_type: 'FARMER' | 'FPO';
  commodity: string;
  accepted_price: number; // INR/Q
  quantity: number; // Quintals
  gross_value: number; // quantity * accepted_price
  transport_cost: number;
  storage_cost: number;
  service_fee: number;
  net_realisation: number;
  delivery_mode: DeliveryMode;
  transport_paid_by: TransportPaidBy;
  simple_delivery_mode?: SimpleDeliveryMode;
  transport_cost_per_quintal?: number;
  transport_cost_payer?: SimpleTransportPayer;
  delivery_terms_status?: 'PENDING' | 'ACCEPTED' | 'COUNTERED';
  pickup_location: string;
  delivery_location: string;
  status: LotStatus;
  accepted_at: string;
  completed_at?: string;
  is_pooled?: boolean;
}

export type DealEventType =
  | 'OFFER_ACCEPTED'
  | 'DEAL_CREATED'
  | 'LOGISTICS_SCHEDULED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'QUALITY_INSPECTED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'SETTLEMENT_DISTRIBUTED'
  | 'REVIEW_SUBMITTED'
  | 'DISPUTE_RAISED'
  | 'DISPUTE_RESOLVED';

export interface DealEvent {
  id: string;
  deal_id: string;
  event_type: DealEventType;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  timestamp: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface LogisticsOption {
  id: string;
  provider: string;
  vehicle_type: string;
  capacity_quintals: number;
  base_fee: number;
  rate_per_km: number;
  loading_fee: number;
  unloading_fee: number;
  estimated_speed_kmh: number;
}

export interface LogisticsBooking {
  id: string;
  deal_id: string;
  provider: string;
  vehicle_type: string;
  capacity_quintals: number;
  estimated_cost: number;
  estimated_duration_hours: number;
  distance_km: number;
  pickup_location: string;
  delivery_location: string;
  pickup_date: string;
  delivery_date: string;
  tracking_reference: string;
  status: 'PENDING' | 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED';
}

export interface StorageOption {
  id: string;
  location: string;
  provider: string;
  commodity: string;
  capacity_quintals: number;
  available_capacity_quintals: number;
  cost_per_quintal_per_day: number;
  temperature_celsius?: number;
  humidity_percentage?: number;
  available_until: string;
}

export type PaymentStatus = 'PENDING' | 'INITIATED' | 'PROCESSED' | 'PAID';

export interface Payment {
  id: string;
  deal_id: string;
  gross_amount: number;
  deductions: {
    transport: number;
    storage: number;
    service_fee: number;
  };
  net_amount: number;
  payment_method: 'DEMO_ESCROW_RTGS' | 'DEMO_DIRECT_TRANSFER';
  status: PaymentStatus;
  initiated_at: string;
  processed_at?: string;
  paid_at?: string;
  reference: string;
  is_simulated: true;
}

export interface Settlement {
  id: string;
  deal_id: string;
  recipient_type: 'FARMER' | 'FPO';
  recipient_id: string;
  recipient_name: string;
  gross_share: number;
  deductions: number;
  net_amount: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  processed_at?: string;
}

export interface Review {
  id: string;
  transaction_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewee_id: string;
  reviewee_name: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}

export type DisputeCategory =
  | 'Money Discrepancy'
  | 'Quality'
  | 'Quality mismatch'
  | 'Quantity/weight discrepancy'
  | 'Delivery issue'
  | 'Payment/settlement issue'
  | 'Damage/spoilage'
  | 'Other'
  | 'PAYMENT'
  | 'QUANTITY'
  | 'QUALITY'
  | 'LOGISTICS'
  | 'BUYER'
  | 'SELLER';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export type FpoResolutionDecision = 'FARMER_FAVOR' | 'BUYER_FAVOR' | 'PARTIAL_RESOLUTION';

export interface Dispute {
  id: string;
  transaction_id: string;
  deal_id?: string;
  deal_number: string;
  lot_id?: string;
  commodity?: string;
  raised_by: string;
  raised_by_name: string;
  raised_by_role?: 'FARMER' | 'BUYER';
  other_party_id?: string;
  other_party_name?: string;
  other_party_role?: 'FARMER' | 'BUYER';
  category: DisputeCategory | string;
  description: string;
  affected_quantity?: number;
  affected_amount?: number;
  evidence?: string;
  status: DisputeStatus;
  fpo_resolution?: FpoResolutionDecision;
  resolution?: string;
  resolution_note?: string;
  resolved_quantity?: number;
  resolved_amount?: number;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolved_by_name?: string;
}

export type AlertType =
  | 'PRICE_MOVEMENT'
  | 'BUYER_DEMAND'
  | 'SALE_WINDOW'
  | 'MATCH'
  | 'OFFER'
  | 'PAYMENT'
  | 'LOGISTICS'
  | 'DISPUTE';

export interface Alert {
  id: string;
  user_id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  related_entity_id?: string;
}

export type DataSourceType =
  | 'PUBLIC_HISTORICAL'
  | 'SEEDED_DEMO'
  | 'PROTOTYPE_FORECAST'
  | 'SIMULATED_LOGISTICS'
  | 'SIMULATED_PAYMENT';

export interface MarketPrice {
  id: string;
  commodity: string;
  state: string;
  district: string;
  market: string;
  date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrival_quantity: number; // Quintals
  unit: 'Quintal';
  source: string;
  source_type: DataSourceType;
}

export interface MarketForecast {
  id: string;
  commodity: string;
  market: string;
  forecast_date: string;
  horizon_days: number;
  forecast_low: number;
  forecast_high: number;
  forecast_mid: number;
  trend: 'RISING' | 'FALLING' | 'STABLE';
  confidence_score: number; // 0-100 analytical confidence
  confidence_label: 'High' | 'Moderate' | 'Low';
  model_type: string;
  reasons: string[];
  generated_at: string;
}

export interface MarketOpportunity {
  id: string;
  commodity: string;
  location: string;
  current_price: number;
  forecast_low: number;
  forecast_high: number;
  forecast_mid: number;
  buyer_demand: 'HIGH' | 'MODERATE' | 'LOW';
  storage_cost: number;
  estimated_logistics: number;
  best_available_offer?: number;
  recommended_action: 'SELL_NOW' | 'HOLD' | 'SELL_PARTIAL';
  recommended_sale_window: {
    start: string;
    end: string;
  };
  confidence: number;
  reasons: string[];
  generated_at: string;
}

export interface MarketComparison {
  tier: 'NEARBY' | 'REGIONAL' | 'NATIONAL_BENCHMARK';
  marketName: string;
  district: string;
  state: string;
  modalPrice: number;
  distanceKm: number;
  arrivalQuantity: number;
  estimatedLogistics: number;
  storageImpact: number;
  estimatedNetRealisation: number;
  netAdvantage: number; // Positive = better than local baseline
}

export interface SaleDecision {
  action: 'SELL_NOW' | 'HOLD' | 'SELL_PARTIAL';
  sellNowValue: number;
  holdValue: number;
  netAdvantage: number;
  confidence: number;
  recommendedSaleWindow: {
    start: string;
    end: string;
  };
  reasons: string[];
  warnings: string[];
  splitPercentage?: {
    sell: number;
    hold: number;
  };
}

export interface NetRealisationCalculation {
  quantity: number;
  unitPrice: number;
  grossValue: number;
  transportCost: number;
  storageCost: number;
  serviceFee: number;
  handlingCost: number;
  netRealisation: number;
  effectivePricePerQuintal: number;
}
