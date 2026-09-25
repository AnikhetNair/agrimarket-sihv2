import { SaleDecision, MarketForecast } from '../types/domain';
import { calculateNetRealisation } from './netRealisationEngine';
import { calculateStorageCost } from './storageCostEngine';
import { calculateTransportCost } from './transportCostEngine';

export interface RecommendationInput {
  commodity: string;
  quantityQuintals: number;
  currentMandiPrice: number;
  forecast: MarketForecast;
  bestVerifiedBuyerOffer?: number; // Verified buyer offer in platform if available
  distanceToMandiKm?: number;
  holdingDays?: number;
  isPerishable?: boolean;
}

/**
 * Deterministic Recommendation Engine
 * Evaluates SELL NOW vs HOLD vs SELL PARTIAL
 * Complies with Rule 36: Synchronizes with active verified buyer offers to prevent contradictory advice!
 */
export function calculateSaleDecision(input: RecommendationInput): SaleDecision {
  const {
    commodity,
    quantityQuintals,
    currentMandiPrice,
    forecast,
    bestVerifiedBuyerOffer,
    distanceToMandiKm = 35,
    holdingDays = 7,
    isPerishable = true,
  } = input;

  // Immediate realization if sold today
  // If a verified buyer offer is available on the platform, consider whichever is higher (buyer direct or local mandi)
  const immediateGrossPrice = Math.max(currentMandiPrice, bestVerifiedBuyerOffer || 0);

  // Transport for selling today to mandi or buyer
  const immediateTransport = calculateTransportCost({
    distanceKm: distanceToMandiKm,
    quantityQuintals,
    deliveryMode: bestVerifiedBuyerOffer && bestVerifiedBuyerOffer >= currentMandiPrice ? 'BUYER_PICKUP_FARM_GATE' : 'DELIVERED_TO_MANDI',
    transportPaidBy: bestVerifiedBuyerOffer && bestVerifiedBuyerOffer >= currentMandiPrice ? 'BUYER' : 'SELLER',
  }).chargeableToSeller;

  const immediateStorage = 0; // Sold today
  const immediateServiceFee = Math.round(quantityQuintals * immediateGrossPrice * 0.005); // 0.5% market facilitation fee

  const sellNowCalc = calculateNetRealisation({
    quantity: quantityQuintals,
    unitPrice: immediateGrossPrice,
    transportCost: immediateTransport,
    storageCost: immediateStorage,
    serviceFee: immediateServiceFee,
  });

  const sellNowValue = sellNowCalc.netRealisation;

  // Holding valuation for holding for N days
  const futureGrossPrice = forecast.forecast_mid;
  const storageResult = calculateStorageCost(
    {
      quantityQuintals,
      storageDays: holdingDays,
      commodityType: isPerishable ? 'PERISHABLE' : 'GRAIN',
      storageType: isPerishable ? 'COLD_STORAGE' : 'DRY_VENTILATED',
    },
    futureGrossPrice
  );

  const futureTransport = calculateTransportCost({
    distanceKm: distanceToMandiKm,
    quantityQuintals,
    deliveryMode: 'DELIVERED_TO_MANDI',
    transportPaidBy: 'SELLER',
  }).chargeableToSeller;

  const futureServiceFee = Math.round(quantityQuintals * futureGrossPrice * 0.005);
  // Risk adjustment penalty for price uncertainty over time
  const riskAdjustmentPenalty = Math.round(quantityQuintals * (futureGrossPrice * 0.025));

  const holdCalc = calculateNetRealisation({
    quantity: quantityQuintals,
    unitPrice: futureGrossPrice,
    transportCost: futureTransport,
    storageCost: storageResult.effectiveStorageDeduction,
    serviceFee: futureServiceFee,
    handlingCost: riskAdjustmentPenalty,
  });

  const holdValue = holdCalc.netRealisation;

  const netAdvantage = holdValue - sellNowValue;
  // Threshold: at least ₹1,500 total advantage required to recommend holding risk
  const threshold = Math.max(1200, Math.round(quantityQuintals * 40));

  let action: 'SELL_NOW' | 'HOLD' | 'SELL_PARTIAL' = 'SELL_PARTIAL';
  const reasons: string[] = [];
  const warnings: string[] = [];

  // RULE 36: If an active verified buyer offers a premium price exceeding holdValue
  if (bestVerifiedBuyerOffer && bestVerifiedBuyerOffer > currentMandiPrice) {
    if (sellNowValue >= holdValue) {
      action = 'SELL_NOW';
      reasons.push(
        `Active verified buyer offer of ₹${bestVerifiedBuyerOffer.toLocaleString('en-IN')}/Q with farm-gate terms secures ₹${sellNowValue.toLocaleString('en-IN')} net realization immediately.`
      );
      reasons.push(
        `Immediate sale eliminates ₹${storageResult.effectiveStorageDeduction.toLocaleString('en-IN')} in storage fees and perishable spoilage risk.`
      );
    }
  }

  if (action === 'SELL_PARTIAL') {
    if (holdValue > sellNowValue + threshold) {
      action = 'HOLD';
      reasons.push(
        `7-day price forecast projects modal rates rising from ₹${currentMandiPrice.toLocaleString('en-IN')} to ₹${forecast.forecast_mid.toLocaleString('en-IN')}/Q.`
      );
      reasons.push(
        `Expected net gain of ₹${netAdvantage.toLocaleString('en-IN')} comfortably outweighs storage costs (₹${storageResult.totalStorageCost.toLocaleString('en-IN')}).`
      );
      warnings.push(`Maintain temperature control to keep spoilage under ${storageResult.estimatedSpoilagePercentage}%.`);
    } else if (sellNowValue > holdValue + threshold) {
      action = 'SELL_NOW';
      reasons.push(
        `Current market price yields ₹${sellNowValue.toLocaleString('en-IN')} net, whereas holding costs (₹${storageResult.effectiveStorageDeduction.toLocaleString('en-IN')}) erode future upside.`
      );
      reasons.push(`Market momentum or high storage expense makes holding economically suboptimal.`);
    } else {
      action = 'SELL_PARTIAL';
      reasons.push(
        `The expected net holding advantage (₹${Math.abs(netAdvantage).toLocaleString('en-IN')}) is too narrow to justify 100% market risk.`
      );
      reasons.push(
        `Liquidating 60% immediately locks in cash flow while holding 40% preserves exposure to potential price rises.`
      );
    }
  }

  const startDate = new Date();
  const endDate = new Date();
  if (action === 'HOLD') {
    startDate.setDate(startDate.getDate() + 5);
    endDate.setDate(endDate.getDate() + 8);
  } else {
    endDate.setDate(endDate.getDate() + 2);
  }

  return {
    action,
    sellNowValue,
    holdValue,
    netAdvantage,
    confidence: forecast.confidence_score,
    recommendedSaleWindow: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
    reasons,
    warnings,
    splitPercentage: action === 'SELL_PARTIAL' ? { sell: 60, hold: 40 } : undefined,
  };
}
