import { LotContributor, Settlement } from '../types/domain';

export interface FPOSettlementBreakdown {
  dealId: string;
  grossSaleValue: number;
  totalQuantityQuintals: number;
  fpoServiceFeePercentage: number;
  fpoServiceFeeAmount: number;
  distributableAmount: number;
  contributorPayouts: {
    farmerId: string;
    farmerName: string;
    sourceLotId: string;
    quantity: number;
    sharePercentage: number;
    grossShare: number;
    fpoDeduction: number;
    netPayout: number;
  }[];
  reconciliationCheck: {
    sumOfPayouts: number;
    plusFPOFee: number;
    totalEqualsGross: boolean;
    difference: number;
  };
}

/**
 * Deterministic FPO Aggregation Settlement Engine
 * Calculates exact pro-rata distributions for pooled produce lots.
 * Mathematical reconciliation guarantees:
 * Sum(Farmer Payouts) + FPO Fee === Gross Sale Value.
 */
export function calculateFPOSettlement(
  dealId: string,
  grossSaleValue: number,
  contributors: LotContributor[],
  fpoServiceFeePercentage: number = 2.0 // e.g. 2% FPO aggregation fee
): FPOSettlementBreakdown {
  const totalQuantityQuintals = contributors.reduce((sum, c) => sum + c.quantity, 0);

  if (totalQuantityQuintals === 0) {
    throw new Error('Total contributor quantity cannot be zero.');
  }

  const fpoServiceFeeAmount = Math.round((grossSaleValue * fpoServiceFeePercentage) / 100);
  const distributableAmount = grossSaleValue - fpoServiceFeeAmount;

  let allocatedPayoutSum = 0;
  const contributorPayouts = contributors.map((contributor, index) => {
    const sharePercentage = Math.round((contributor.quantity / totalQuantityQuintals) * 10000) / 100; // 2 decimal precision
    const grossShare = Math.round((contributor.quantity / totalQuantityQuintals) * grossSaleValue);
    const fpoDeduction = Math.round((contributor.quantity / totalQuantityQuintals) * fpoServiceFeeAmount);

    let netPayout = Math.round((contributor.quantity / totalQuantityQuintals) * distributableAmount);

    // If last contributor, adjust by residual rounding difference to ensure exact penny/rupee reconciliation
    if (index === contributors.length - 1) {
      const remainingDistributable = distributableAmount - allocatedPayoutSum;
      netPayout = remainingDistributable;
    } else {
      allocatedPayoutSum += netPayout;
    }

    return {
      farmerId: contributor.farmer_id,
      farmerName: contributor.farmer_name,
      sourceLotId: contributor.source_lot_id,
      quantity: contributor.quantity,
      sharePercentage,
      grossShare,
      fpoDeduction,
      netPayout,
    };
  });

  const sumOfPayouts = contributorPayouts.reduce((sum, c) => sum + c.netPayout, 0);
  const totalWithFee = sumOfPayouts + fpoServiceFeeAmount;
  const difference = grossSaleValue - totalWithFee;

  return {
    dealId,
    grossSaleValue,
    totalQuantityQuintals,
    fpoServiceFeePercentage,
    fpoServiceFeeAmount,
    distributableAmount,
    contributorPayouts,
    reconciliationCheck: {
      sumOfPayouts,
      plusFPOFee: fpoServiceFeeAmount,
      totalEqualsGross: difference === 0,
      difference,
    },
  };
}

export function generateSettlementRecords(
  breakdown: FPOSettlementBreakdown,
  fpoOrgId: string,
  fpoOrgName: string
): Settlement[] {
  const records: Settlement[] = [];

  // FPO Fee settlement
  records.push({
    id: `set-fpo-${breakdown.dealId}`,
    deal_id: breakdown.dealId,
    recipient_type: 'FPO',
    recipient_id: fpoOrgId,
    recipient_name: fpoOrgName,
    gross_share: breakdown.fpoServiceFeeAmount,
    deductions: 0,
    net_amount: breakdown.fpoServiceFeeAmount,
    status: 'PROCESSED',
    processed_at: new Date().toISOString(),
  });

  // Contributor settlements
  breakdown.contributorPayouts.forEach((c) => {
    records.push({
      id: `set-farmer-${c.farmerId}-${breakdown.dealId}`,
      deal_id: breakdown.dealId,
      recipient_type: 'FARMER',
      recipient_id: c.farmerId,
      recipient_name: c.farmerName,
      gross_share: c.grossShare,
      deductions: c.fpoDeduction,
      net_amount: c.netPayout,
      status: 'PROCESSED',
      processed_at: new Date().toISOString(),
    });
  });

  return records;
}
