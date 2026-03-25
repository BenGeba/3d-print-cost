import { useMemo } from 'react';
import { number } from '../utils';
import type { LaserState } from '../types/laser-state';

export function useLaserCalculations(s: LaserState) {
  return useMemo(() => {
    const n = (v: number | string, def = 0) => number(v, def);

    const totalHours = n(s.jobTimeHours) + n(s.jobTimeMinutes) / 60;
    const itemsPerJob = Math.max(1, n(s.itemsPerJob, 1));

    // Material: price per blank × blanks used × waste multiplier
    const blanksUsed = n(s.blanksUsed);
    const pricePerBlank = n(s.pricePerBlank);
    const wasteMultiplier = 1 + n(s.wastePercent) / 100;
    const materialCost = blanksUsed * pricePerBlank * wasteMultiplier;

    // Energy: kW × hours × price/kWh
    const energyCost = (n(s.avgPowerW) / 1000) * totalHours * n(s.energyPricePerKwh);

    // Depreciation: machine price / lifetime hours × job hours (business only)
    const lifetimeHours = n(s.lifetimeHours);
    const depreciationCost =
      s.mode === 'business' && lifetimeHours > 0
        ? (n(s.machinePrice) / lifetimeHours) * totalHours
        : 0;

    // Maintenance: per-hour rate × job hours
    const maintenanceCost = n(s.maintenancePerHour) * totalHours;

    // Labor: minutes / 60 × hourly rate (business only)
    const laborCost =
      s.mode === 'business' ? (n(s.laborMinutes) / 60) * n(s.laborRate) : 0;

    // Base subtotal
    const baseSubtotal =
      materialCost +
      energyCost +
      maintenanceCost +
      (s.mode === 'business' ? depreciationCost + laborCost : 0);

    // Extras (business only)
    const shippingCost = s.mode === 'business' ? n(s.shippingCost) : 0;
    const packagingCost = s.mode === 'business' ? n(s.packagingCost) : 0;
    const subtotalWithExtras = baseSubtotal + shippingCost + packagingCost;

    // Margin
    const marginPercent = n(s.marginPercent);
    const margin = subtotalWithExtras * (marginPercent / 100);
    const netTotal = subtotalWithExtras + margin;

    // VAT (business only)
    const vatPercent = s.mode === 'business' ? n(s.vatPercent) : 0;
    const vatAmount = netTotal * (vatPercent / 100);
    const total = netTotal + vatAmount;

    // Per-item breakdown
    const costPerItem = total / itemsPerJob;

    return {
      materialCost,
      energyCost,
      maintenanceCost,
      depreciationCost,
      laborCost,
      baseSubtotal,
      shippingCost,
      packagingCost,
      subtotalWithExtras,
      margin,
      netTotal,
      vatPercent,
      vatAmount,
      total,
      totalHours,
      costPerItem,
      itemsPerJob,
    };
  }, [s]);
}
