import { useMemo } from 'react';
import { number } from '../utils';
import type { LaserState } from '../types/laser-state';
import type { LaserValidationErrors } from '../types/laser-state';

export function useLaserValidation(s: LaserState): LaserValidationErrors {
  return useMemo(() => {
    const errors: LaserValidationErrors = {};
    const n = (v: number | string, def = 0) => number(v, def);

    // Job time
    if (s.jobTimeHours !== '' && n(s.jobTimeHours) < 0)
      errors.jobTimeHours = 'Muss ≥ 0 sein';
    if (s.jobTimeMinutes !== '' && (n(s.jobTimeMinutes) < 0 || n(s.jobTimeMinutes) > 59))
      errors.jobTimeMinutes = '0–59 min';

    // Items per job
    if (s.itemsPerJob !== '' && n(s.itemsPerJob) < 1)
      errors.itemsPerJob = 'Mindestens 1';

    // Material
    if (s.pricePerBlank !== '' && n(s.pricePerBlank) < 0)
      errors.pricePerBlank = 'Muss ≥ 0 sein';
    if (s.blanksUsed !== '' && n(s.blanksUsed) < 0)
      errors.blanksUsed = 'Muss ≥ 0 sein';
    if (s.wastePercent !== '' && (n(s.wastePercent) < 0 || n(s.wastePercent) > 500))
      errors.wastePercent = '0–500%';

    // Energy
    if (s.avgPowerW !== '' && n(s.avgPowerW) < 0)
      errors.avgPowerW = 'Muss ≥ 0 sein';
    if (s.energyPricePerKwh !== '' && n(s.energyPricePerKwh) < 0)
      errors.energyPricePerKwh = 'Muss ≥ 0 sein';

    // Machine
    if (s.machinePrice !== '' && n(s.machinePrice) < 0)
      errors.machinePrice = 'Muss ≥ 0 sein';
    if (s.lifetimeHours !== '' && n(s.lifetimeHours) <= 0)
      errors.lifetimeHours = 'Muss > 0 sein';
    if (s.maintenancePerHour !== '' && n(s.maintenancePerHour) < 0)
      errors.maintenancePerHour = 'Muss ≥ 0 sein';

    // Business
    if (s.mode === 'business') {
      if (s.laborMinutes !== '' && n(s.laborMinutes) < 0)
        errors.laborMinutes = 'Muss ≥ 0 sein';
      if (s.laborRate !== '' && n(s.laborRate) < 0)
        errors.laborRate = 'Muss ≥ 0 sein';
      if (s.shippingCost !== '' && n(s.shippingCost) < 0)
        errors.shippingCost = 'Muss ≥ 0 sein';
      if (s.packagingCost !== '' && n(s.packagingCost) < 0)
        errors.packagingCost = 'Muss ≥ 0 sein';
      if (s.marginPercent !== '' && (n(s.marginPercent) < 0 || n(s.marginPercent) > 200))
        errors.marginPercent = '0–200%';
      if (s.vatPercent !== '' && (n(s.vatPercent) < 0 || n(s.vatPercent) > 100))
        errors.vatPercent = '0–100%';
    }

    return errors;
  }, [s]);
}
