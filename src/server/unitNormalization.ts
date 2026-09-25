export type SupportedUnit = 'kg' | 'quintal' | 'tonne';

const KG_PER_UNIT: Record<SupportedUnit, number> = {
  kg: 1,
  quintal: 100,
  tonne: 1000,
};

export function convertUnit(
  value: number,
  from: SupportedUnit,
  to: SupportedUnit
): number {
  if (!Number.isFinite(value)) {
    throw new Error('Value must be a finite number');
  }

  const valueInKg = value * KG_PER_UNIT[from];

  return valueInKg / KG_PER_UNIT[to];
}

export function normalizeToKg(
  value: number,
  unit: SupportedUnit
): number {
  return convertUnit(value, unit, 'kg');
}

export function normalizeToQuintal(
  value: number,
  unit: SupportedUnit
): number {
  return convertUnit(value, unit, 'quintal');
}