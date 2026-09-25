import { DeliveryMode, TransportPaidBy } from '../types/domain';

export interface TransportCalculationInput {
  distanceKm: number;
  quantityQuintals: number;
  deliveryMode: DeliveryMode;
  transportPaidBy: TransportPaidBy;
  refrigeratedRequired?: boolean;
}

export interface TransportCalculationResult {
  chargeableToSeller: number;
  totalCost: number;
  vehicleType: string;
  baseFee: number;
  distanceFee: number;
  loadingFee: number;
  unloadingFee: number;
  estimatedHours: number;
}

/**
 * Deterministic Transport Cost Engine
 * Formula: base_fee + (distance_km * rate_per_km) + loading_fee + unloading_fee
 * Respects delivery terms (Farm Gate pickup vs Delivered to Mandi/Buyer Warehouse)
 */
export function calculateTransportCost(input: TransportCalculationInput): TransportCalculationResult {
  const { distanceKm, quantityQuintals, deliveryMode, transportPaidBy, refrigeratedRequired } = input;

  // Farm gate pickup paid by buyer = 0 transport cost to seller
  if (deliveryMode === 'BUYER_PICKUP_FARM_GATE' && transportPaidBy === 'BUYER') {
    return {
      chargeableToSeller: 0,
      totalCost: 0,
      vehicleType: 'Buyer Arranged Logistics',
      baseFee: 0,
      distanceFee: 0,
      loadingFee: 0,
      unloadingFee: 0,
      estimatedHours: 0,
    };
  }

  // Vehicle selection based on load capacity
  let baseFee = 500;
  let ratePerKm = 14;
  let vehicleType = 'Small Commercial Vehicle (Tata Ace / 15Q)';
  let avgSpeedKmh = 40;

  if (quantityQuintals > 50) {
    baseFee = 1800;
    ratePerKm = 28;
    vehicleType = 'Heavy 6-Wheel Truck (100Q)';
    avgSpeedKmh = 45;
  } else if (quantityQuintals > 20) {
    baseFee = 900;
    ratePerKm = 18;
    vehicleType = 'Medium Commercial Vehicle (Bolero Maxi Truck / 30Q)';
    avgSpeedKmh = 45;
  }

  if (refrigeratedRequired) {
    baseFee += 800;
    ratePerKm += 8;
    vehicleType += ' [Reefer / Cold Chain]';
  }

  const loadingFee = Math.round(quantityQuintals * 15); // ₹15 per quintal loading
  const unloadingFee = Math.round(quantityQuintals * 15); // ₹15 per quintal unloading
  const distanceFee = Math.round(distanceKm * ratePerKm);

  const totalCost = baseFee + distanceFee + loadingFee + unloadingFee;

  let chargeableToSeller = totalCost;
  if (transportPaidBy === 'BUYER') {
    chargeableToSeller = 0;
  } else if (transportPaidBy === 'SPLIT_50_50') {
    chargeableToSeller = Math.round(totalCost / 2);
  }

  const estimatedHours = Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 10) / 10 + 1); // +1 hr loading/turnaround

  return {
    chargeableToSeller,
    totalCost,
    vehicleType,
    baseFee,
    distanceFee,
    loadingFee,
    unloadingFee,
    estimatedHours,
  };
}
