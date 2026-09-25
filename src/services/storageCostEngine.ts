export interface StorageCalculationInput {
  quantityQuintals: number;
  storageDays: number;
  commodityType: 'PERISHABLE' | 'SEMI_PERISHABLE' | 'GRAIN';
  storageType?: 'COLD_STORAGE' | 'DRY_VENTILATED';
}

export interface StorageCalculationResult {
  costPerQuintalPerDay: number;
  totalStorageCost: number;
  estimatedSpoilagePercentage: number;
  estimatedSpoilageLossValue: number;
  effectiveStorageDeduction: number;
}

/**
 * Deterministic Storage Cost Engine
 * Formula: quantity * cost_per_quintal_per_day * storage_days
 * Plus transparent, deterministic holding loss assumptions
 */
export function calculateStorageCost(
  input: StorageCalculationInput,
  expectedUnitPrice: number = 2800
): StorageCalculationResult {
  const { quantityQuintals, storageDays, commodityType, storageType } = input;

  let costPerQuintalPerDay = 3.5; // Default standard dry storage ₹3.5/Q/day

  if (storageType === 'COLD_STORAGE' || commodityType === 'PERISHABLE') {
    costPerQuintalPerDay = 10.0; // Cold store for tomato/fruits ₹10/Q/day
  } else if (commodityType === 'SEMI_PERISHABLE') {
    costPerQuintalPerDay = 5.0; // Ventilated storage for onions/potatoes
  }

  const totalStorageCost = Math.round(quantityQuintals * costPerQuintalPerDay * storageDays);

  // Spoilage risk per day
  let spoilageRatePerDay = 0.05; // 0.05% per day for grains
  if (commodityType === 'PERISHABLE') {
    spoilageRatePerDay = 0.45; // 0.45% per day even in cold storage
  } else if (commodityType === 'SEMI_PERISHABLE') {
    spoilageRatePerDay = 0.15;
  }

  const estimatedSpoilagePercentage = Math.min(15, Math.round(spoilageRatePerDay * storageDays * 10) / 10);
  const spoiledQuantity = (quantityQuintals * estimatedSpoilagePercentage) / 100;
  const estimatedSpoilageLossValue = Math.round(spoiledQuantity * expectedUnitPrice);

  const effectiveStorageDeduction = totalStorageCost + estimatedSpoilageLossValue;

  return {
    costPerQuintalPerDay,
    totalStorageCost,
    estimatedSpoilagePercentage,
    estimatedSpoilageLossValue,
    effectiveStorageDeduction,
  };
}
