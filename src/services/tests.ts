import { calculateNetRealisation } from './netRealisationEngine';
import { calculateFPOSettlement } from './settlementService';
import { calculateMatch } from './matchingService';
import { validateStateTransition } from './dealService';
import { calculateSaleDecision } from './recommendationService';
import { BuyerRequirement, ProduceLot, LotContributor, MarketForecast } from '../types/domain';

export interface TestResult {
  name: string;
  category: 'FINANCIAL' | 'FPO_PAYOUT' | 'MATCHING' | 'STATE_TRANSITION' | 'IDEMPOTENCY' | 'RECOMMENDATION';
  passed: boolean;
  expected: any;
  actual: any;
  message: string;
}

export function runAllSpecificationTests(): TestResult[] {
  const results: TestResult[] = [];

  // TEST 1: Mandatory Financial Calculation
  // 30Q * ₹3,100 = Gross ₹93,000; -₹2,700 transport, -₹900 storage, -₹465 fee => ₹88,935 net
  const netRes = calculateNetRealisation({
    quantity: 30,
    unitPrice: 3100,
    transportCost: 2700,
    storageCost: 900,
    serviceFee: 465,
  });

  results.push({
    name: 'Financial Formula Verification (30Q x ₹3,100 - ₹2,700 - ₹900 - ₹465)',
    category: 'FINANCIAL',
    passed: netRes.grossValue === 93000 && netRes.netRealisation === 88935,
    expected: { gross: 93000, net: 88935 },
    actual: { gross: netRes.grossValue, net: netRes.netRealisation },
    message:
      netRes.netRealisation === 88935
        ? 'Verified: Deterministic net realization produces exact ₹88,935.'
        : `Failed: Expected 88935, received ${netRes.netRealisation}.`,
  });

  // TEST 2: FPO Contributor Pro-Rata Reconciliation
  // Contributors: 30Q, 20Q, 25Q (Total 75Q)
  const dummyContributors: LotContributor[] = [
    {
      id: 'c1',
      pooled_lot_id: 'p1',
      farmer_id: 'f1',
      farmer_name: 'Farmer A',
      source_lot_id: 's1',
      quantity: 30,
      share_percentage: 40.0,
      agreed_payout_price: 3000,
      payout_amount: 0,
    },
    {
      id: 'c2',
      pooled_lot_id: 'p1',
      farmer_id: 'f2',
      farmer_name: 'Farmer B',
      source_lot_id: 's2',
      quantity: 20,
      share_percentage: 26.67,
      agreed_payout_price: 3000,
      payout_amount: 0,
    },
    {
      id: 'c3',
      pooled_lot_id: 'p1',
      farmer_id: 'f3',
      farmer_name: 'Farmer C',
      source_lot_id: 's3',
      quantity: 25,
      share_percentage: 33.33,
      agreed_payout_price: 3000,
      payout_amount: 0,
    },
  ];

  const grossSale = 75 * 3100; // ₹232,500
  const fpoSettlement = calculateFPOSettlement('deal-test-fpo', grossSale, dummyContributors, 2.0);

  results.push({
    name: 'FPO Contributor Payout Reconciliation (30Q + 20Q + 25Q = 75Q)',
    category: 'FPO_PAYOUT',
    passed: fpoSettlement.reconciliationCheck.totalEqualsGross,
    expected: { totalEqualsGross: true, grossSaleValue: 232500 },
    actual: {
      sumPayoutsPlusFee: fpoSettlement.reconciliationCheck.sumOfPayouts + fpoSettlement.reconciliationCheck.plusFPOFee,
      difference: fpoSettlement.reconciliationCheck.difference,
    },
    message: fpoSettlement.reconciliationCheck.totalEqualsGross
      ? 'Verified: Sum of farmer payouts (₹' +
        fpoSettlement.reconciliationCheck.sumOfPayouts.toLocaleString('en-IN') +
        ') + FPO fee (₹' +
        fpoSettlement.reconciliationCheck.plusFPOFee.toLocaleString('en-IN') +
        ') reconciles to ₹' +
        grossSale.toLocaleString('en-IN') +
        ' exactly.'
      : 'Failed: Reconciliation disparity of ' + fpoSettlement.reconciliationCheck.difference,
  });

  // TEST 3: Matching Hard Eligibility Filter Rejection
  // Buyer: Grade A, 20Q, required in 3 days
  // Lot: Grade C, 8Q, available in 7 days
  const dummyReq: BuyerRequirement = {
    id: 'req-t3',
    buyer_id: 'b1',
    buyer_name: 'Buyer T3',
    buyer_org_id: 'org-b1',
    buyer_org_name: 'Buyer Org',
    commodity: 'Carrot',
    quantity: 20,
    unit: 'Quintal',
    grade: 'A',
    quality_requirements: {},
    target_price: 3000,
    delivery_location: 'Pune',
    required_by: '2026-09-10',
    delivery_mode: 'DELIVERED_TO_BUYER_WAREHOUSE',
    status: 'OPEN',
    created_at: '2026-09-07T00:00:00Z',
    reliability_score: 90,
  };

  const dummyIneligibleLot: ProduceLot = {
    id: 'lot-t3',
    lot_number: 'LOT-T3',
    seller_user_id: 'f1',
    seller_type: 'FARMER',
    commodity: 'Carrot',
    variety: 'Standard',
    quantity: 8, // Below minimum batch
    unit: 'Quintal',
    harvest_date: '2026-09-14', // Misses required_by
    available_from: '2026-09-14',
    origin: 'Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    grade: 'C', // Incompatible Grade C vs Grade A
    quality_attributes: {},
    packaging: 'Crates',
    storage_requirement: 'IMMEDIATE_SALE',
    asking_price: 2500,
    minimum_acceptable_price: 2400,
    delivery_mode: 'DELIVERED_TO_BUYER_WAREHOUSE',
    transport_paid_by: 'SELLER',
    pickup_location: 'Nashik',
    status: 'LISTED',
    created_at: '2026-09-07T00:00:00Z',
    expires_at: '2026-09-14T00:00:00Z',
  };

  const matchResult = calculateMatch(dummyIneligibleLot, dummyReq);
  results.push({
    name: 'Matching Hard Eligibility Rejection (Grade C vs Grade A, 8Q vs 20Q)',
    category: 'MATCHING',
    passed: !matchResult.eligible && matchResult.overallScore === 0,
    expected: { eligible: false, overallScore: 0 },
    actual: { eligible: matchResult.eligible, score: matchResult.overallScore },
    message: !matchResult.eligible
      ? `Verified: Ineligible lot correctly rejected with reason: "${matchResult.ineligibilityReason}".`
      : 'Failed: Ineligible lot was mistakenly allowed to score.',
  });

  // TEST 4: State Machine Transition Rules
  const validTransition = validateStateTransition('LISTED', 'MATCHED');
  const invalidTransition = validateStateTransition('DRAFT', 'PAID');
  const completedTerminal = validateStateTransition('COMPLETED', 'NEGOTIATING');

  results.push({
    name: 'State Transition Rules (LISTED->MATCHED valid, DRAFT->PAID rejected, COMPLETED terminal)',
    category: 'STATE_TRANSITION',
    passed: validTransition === true && invalidTransition === false && completedTerminal === false,
    expected: { validTransition: true, invalidTransition: false, completedTerminal: false },
    actual: { validTransition, invalidTransition, completedTerminal },
    message:
      validTransition && !invalidTransition && !completedTerminal
        ? 'Verified: Strict state machine accepts valid progression and rejects invalid skips.'
        : 'Failed: State machine transition checks failed.',
  });

  // TEST 5: Recommendation Engine Rule 36 Consistency
  const dummyForecast: MarketForecast = {
    id: 'fc-test',
    commodity: 'Carrot',
    market: 'Nashik APMC',
    forecast_date: '2026-09-14',
    horizon_days: 7,
    forecast_low: 3000,
    forecast_high: 3150,
    forecast_mid: 3075,
    trend: 'RISING',
    confidence_score: 85,
    confidence_label: 'Moderate',
    model_type: 'Deterministic Momentum Prototype',
    reasons: ['Seasonal cycle'],
    generated_at: new Date().toISOString(),
  };

  // With no buyer offer, rising forecast leads to HOLD
  const holdDecision = calculateSaleDecision({
    commodity: 'Carrot',
    quantityQuintals: 30,
    currentMandiPrice: 2850,
    forecast: dummyForecast,
    holdingDays: 7,
    isPerishable: true,
  });

  // With a verified buyer offer of ₹3,100, Rule 36 requires update to SELL_NOW
  const sellNowWithBuyer = calculateSaleDecision({
    commodity: 'Carrot',
    quantityQuintals: 30,
    currentMandiPrice: 2850,
    forecast: dummyForecast,
    bestVerifiedBuyerOffer: 3100,
    holdingDays: 7,
    isPerishable: true,
  });

  results.push({
    name: 'Recommendation Rule 36 Consistency (Verified Buyer Offer synchronizes decision)',
    category: 'RECOMMENDATION',
    passed: holdDecision.action === 'HOLD' && sellNowWithBuyer.action === 'SELL_NOW',
    expected: { withoutBuyer: 'HOLD', withVerifiedBuyer: 'SELL_NOW' },
    actual: { withoutBuyer: holdDecision.action, withVerifiedBuyer: sellNowWithBuyer.action },
    message:
      holdDecision.action === 'HOLD' && sellNowWithBuyer.action === 'SELL_NOW'
        ? 'Verified: Recommendation correctly upgrades from HOLD to SELL_NOW when a verified buyer offer eliminates price risk.'
        : `Failed: Decision output: without=${holdDecision.action}, withBuyer=${sellNowWithBuyer.action}`,
  });

  return results;
}
