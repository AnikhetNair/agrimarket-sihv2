import { NetRealisationCalculation } from '../types/domain';

/**
 * Deterministic Net Realisation Engine
 * Mandatory SIH Rule:
 * Gross Value = quantity * agreedPrice
 * Net Realisation = Gross Value - Transport Cost - Storage Cost - Service Fees - Other Costs
 *
 * Test Case verification:
 * 30Q * ₹3,100 = Gross ₹93,000
 * - ₹2,700 Transport
 * - ₹900 Storage
 * - ₹465 Service Fee
 * = Net ₹88,935
 */
export function calculateNetRealisation(input: {
  quantity: number;
  unitPrice: number;
  transportCost?: number;
  storageCost?: number;
  serviceFee?: number;
  handlingCost?: number;
}): NetRealisationCalculation {
  const quantity = Math.max(0, input.quantity || 0);
  const unitPrice = Math.max(0, input.unitPrice || 0);
  const transportCost = Math.max(0, input.transportCost || 0);
  const storageCost = Math.max(0, input.storageCost || 0);
  const serviceFee = Math.max(0, input.serviceFee || 0);
  const handlingCost = Math.max(0, input.handlingCost || 0);

  const grossValue = Math.round(quantity * unitPrice);
  const totalDeductions = transportCost + storageCost + serviceFee + handlingCost;
  const netRealisation = Math.max(0, grossValue - totalDeductions);
  const effectivePricePerQuintal = quantity > 0 ? Math.round((netRealisation / quantity) * 100) / 100 : 0;

  return {
    quantity,
    unitPrice,
    grossValue,
    transportCost,
    storageCost,
    serviceFee,
    handlingCost,
    netRealisation,
    effectivePricePerQuintal,
  };
}
