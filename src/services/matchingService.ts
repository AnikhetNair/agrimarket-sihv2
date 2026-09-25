import { BuyerRequirement, ProduceLot, MatchResult } from '../types/domain';
import { calculateTransportCost } from './transportCostEngine';
import { calculateNetRealisation } from './netRealisationEngine';

/**
 * 2-Stage Deterministic Matching Engine
 * Stage 1: Hard Eligibility Filter (commodity, quantity min, grade, feasibility)
 * Stage 2: Weighted Multi-Factor Scoring (Quantity 25%, Quality 20%, Location 20%, Price 15%, Delivery 10%, Reliability 10%)
 */
export function calculateMatch(lot: ProduceLot, requirement: BuyerRequirement): MatchResult {
  // --- STAGE 1: HARD ELIGIBILITY FILTER ---
  if (lot.commodity.trim().toLowerCase() !== requirement.commodity.trim().toLowerCase()) {
    return {
      requirementId: requirement.id,
      requirement,
      lotId: lot.id,
      eligible: false,
      ineligibilityReason: `Commodity mismatch: Lot is ${lot.commodity} but buyer requires ${requirement.commodity}.`,
      overallScore: 0,
      componentScores: { quantity: 0, quality: 0, location: 0, price: 0, delivery: 0, reliability: 0 },
      reasons: [],
      warnings: ['Ineligible produce type'],
      estimatedDistanceKm: 0,
      estimatedTransportCost: 0,
      netRealisationEstimate: 0,
    };
  }

  // Grade check: Grade A buyer will not accept Grade C
  if (requirement.grade === 'A' && (lot.grade === 'C' || lot.grade === 'STANDARD')) {
    return {
      requirementId: requirement.id,
      requirement,
      lotId: lot.id,
      eligible: false,
      ineligibilityReason: `Grade mismatch: Buyer requires Grade A, but lot is certified Grade ${lot.grade}.`,
      overallScore: 0,
      componentScores: { quantity: 0, quality: 0, location: 0, price: 0, delivery: 0, reliability: 0 },
      reasons: [],
      warnings: ['Quality grade below procurement minimum'],
      estimatedDistanceKm: 0,
      estimatedTransportCost: 0,
      netRealisationEstimate: 0,
    };
  }

  // Lot quantity cannot be less than 20% of requirement (or too tiny to aggregate)
  if (lot.quantity < Math.min(10, requirement.quantity * 0.25)) {
    return {
      requirementId: requirement.id,
      requirement,
      lotId: lot.id,
      eligible: false,
      ineligibilityReason: `Lot volume (${lot.quantity}Q) is too low for buyer's commercial batch order of ${requirement.quantity}Q.`,
      overallScore: 0,
      componentScores: { quantity: 0, quality: 0, location: 0, price: 0, delivery: 0, reliability: 0 },
      reasons: [],
      warnings: ['Volume below minimum dispatch threshold'],
      estimatedDistanceKm: 0,
      estimatedTransportCost: 0,
      netRealisationEstimate: 0,
    };
  }

  // Delivery deadline feasibility
  const harvestAvailableDate = new Date(lot.available_from || lot.harvest_date);
  const requiredByDate = new Date(requirement.required_by);
  if (harvestAvailableDate.getTime() > requiredByDate.getTime()) {
    return {
      requirementId: requirement.id,
      requirement,
      lotId: lot.id,
      eligible: false,
      ineligibilityReason: `Delivery timeline infeasible: Lot available ${lot.available_from}, but buyer requires delivery by ${requirement.required_by}.`,
      overallScore: 0,
      componentScores: { quantity: 0, quality: 0, location: 0, price: 0, delivery: 0, reliability: 0 },
      reasons: [],
      warnings: ['Produce availability misses delivery deadline'],
      estimatedDistanceKm: 0,
      estimatedTransportCost: 0,
      netRealisationEstimate: 0,
    };
  }

  // --- STAGE 2: MULTI-FACTOR WEIGHTED SCORING ---
  const reasons: string[] = [];
  const warnings: string[] = [];

  // 1. Quantity Compatibility (25%)
  // Perfect score if lot quantity matches 80%-120% of requirement
  const qtyRatio = lot.quantity / requirement.quantity;
  let quantityScore = 25;
  if (qtyRatio >= 0.85 && qtyRatio <= 1.15) {
    quantityScore = 25;
    reasons.push(`Exact volume fulfillment: Lot ${lot.quantity}Q fulfills buyer requirement of ${requirement.quantity}Q.`);
  } else if (qtyRatio > 1.15) {
    quantityScore = 22; // Can supply full batch with surplus
    reasons.push(`Surplus batch: Lot ${lot.quantity}Q fully covers buyer need (${requirement.quantity}Q).`);
  } else {
    // Partial fulfillment
    quantityScore = Math.round(25 * Math.max(0.4, qtyRatio));
    warnings.push(`Partial fulfillment: Lot supplies ${lot.quantity}Q (${Math.round(qtyRatio * 100)}% of requested ${requirement.quantity}Q).`);
  }

  // 2. Quality Compatibility (20%)
  let qualityScore = 20;
  if (lot.grade === requirement.grade) {
    qualityScore = 20;
    reasons.push(`Certified Grade ${lot.grade} matches buyer specification.`);
  } else if (requirement.grade === 'B' && lot.grade === 'A') {
    qualityScore = 20;
    reasons.push(`Superior quality: Grade A supplied for Grade B requirement.`);
  } else {
    qualityScore = 14;
    warnings.push(`Slight grade deviation (Grade ${lot.grade} vs requested Grade ${requirement.grade}).`);
  }

  // 3. Location / Logistics Compatibility (20%)
  // Approximate distance based on origin & destination
  let estimatedDistanceKm = 45;
  if (lot.district?.toLowerCase() === 'nashik' && requirement.delivery_location?.toLowerCase().includes('pune')) {
    estimatedDistanceKm = 210;
  } else if (lot.district?.toLowerCase() === 'nashik' && requirement.delivery_location?.toLowerCase().includes('mumbai')) {
    estimatedDistanceKm = 165;
  } else if (lot.district?.toLowerCase() === 'nashik' && requirement.delivery_location?.toLowerCase().includes('nashik')) {
    estimatedDistanceKm = 25;
  } else {
    estimatedDistanceKm = 120;
  }

  let locationScore = 20;
  if (estimatedDistanceKm <= 50) {
    locationScore = 20;
    reasons.push(`Local transit (${estimatedDistanceKm} km): Low logistics cost and fast turnaround.`);
  } else if (estimatedDistanceKm <= 250) {
    locationScore = 16;
    reasons.push(`Regional transit (${estimatedDistanceKm} km): Well-connected highway corridor.`);
  } else {
    locationScore = 10;
    warnings.push(`Long-distance transit (${estimatedDistanceKm} km): Requires dedicated freight and handling.`);
  }

  // 4. Price Compatibility (15%)
  // target price vs lot asking price
  const priceDiff = requirement.target_price - lot.asking_price;
  let priceScore = 15;
  if (priceDiff >= 0) {
    // Buyer target is at or above seller asking price!
    priceScore = 15;
    reasons.push(`Favorable pricing: Buyer budget (₹${requirement.target_price}/Q) meets or exceeds asking price (₹${lot.asking_price}/Q).`);
  } else if (Math.abs(priceDiff) <= 150) {
    // Within tight negotiation margin
    priceScore = 12;
    reasons.push(`Narrow spread of ₹${Math.abs(priceDiff)}/Q: Highly negotiable.`);
  } else if (Math.abs(priceDiff) <= 300) {
    priceScore = 8;
    warnings.push(`Price gap of ₹${Math.abs(priceDiff)}/Q between buyer target and seller asking price.`);
  } else {
    priceScore = 4;
    warnings.push(`Significant price gap of ₹${Math.abs(priceDiff)}/Q.`);
  }

  // 5. Delivery Window (10%)
  const daysUntilDeadline = Math.round((requiredByDate.getTime() - harvestAvailableDate.getTime()) / (1000 * 3600 * 24));
  let deliveryScore = 10;
  if (daysUntilDeadline >= 2 && daysUntilDeadline <= 6) {
    deliveryScore = 10;
    reasons.push(`Optimal harvest-to-dispatch timeline (${daysUntilDeadline} days margin).`);
  } else if (daysUntilDeadline >= 1) {
    deliveryScore = 8;
    reasons.push(`Tight delivery window: Prompt dispatch required.`);
  } else {
    deliveryScore = 5;
    warnings.push(`Produce requires immediate priority transport.`);
  }

  // 6. Reliability (10%)
  const buyerReliability = requirement.reliability_score || 85;
  const reliabilityScore = Math.round((buyerReliability / 100) * 10);
  if (buyerReliability >= 90) {
    reasons.push(`High-reputation buyer: Verified procurement track record (${buyerReliability}% rating).`);
  }

  const overallScore = quantityScore + qualityScore + locationScore + priceScore + deliveryScore + reliabilityScore;

  // Logistics & Net realization estimation
  const transportRes = calculateTransportCost({
    distanceKm: estimatedDistanceKm,
    quantityQuintals: Math.min(lot.quantity, requirement.quantity),
    deliveryMode: requirement.delivery_mode,
    transportPaidBy: lot.transport_paid_by,
  });

  const netCalc = calculateNetRealisation({
    quantity: Math.min(lot.quantity, requirement.quantity),
    unitPrice: requirement.target_price,
    transportCost: transportRes.chargeableToSeller,
    storageCost: 0,
    serviceFee: Math.round(Math.min(lot.quantity, requirement.quantity) * requirement.target_price * 0.005),
  });

  return {
    requirementId: requirement.id,
    requirement,
    lotId: lot.id,
    eligible: true,
    overallScore,
    componentScores: {
      quantity: quantityScore,
      quality: qualityScore,
      location: locationScore,
      price: priceScore,
      delivery: deliveryScore,
      reliability: reliabilityScore,
    },
    reasons,
    warnings,
    estimatedDistanceKm,
    estimatedTransportCost: transportRes.chargeableToSeller,
    netRealisationEstimate: netCalc.netRealisation,
  };
}
