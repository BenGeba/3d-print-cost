import { useMemo } from 'react';
import { AppState, ValidationErrors } from '../types';
import { number } from '../utils';

export function useValidation(s: AppState): ValidationErrors {
  return useMemo<ValidationErrors>(() => {
    const e: ValidationErrors = {};
    
    // Validate each filament
    s.filaments.forEach((filament) => {
      if (filament.pricePerKg !== "" && number(filament.pricePerKg) < 0) {
        e[`filament-${filament.id}-pricePerKg` as keyof ValidationErrors] = "Must be ≥ 0";
      }
      
      if (s.filamentPricingMode === 'grams') {
        if (filament.usedGrams !== "" && number(filament.usedGrams) < 0) {
          e[`filament-${filament.id}-usedGrams` as keyof ValidationErrors] = "Must be ≥ 0";
        }
      } else {
        if (filament.lengthMeters !== "" && number(filament.lengthMeters) < 0) {
          e[`filament-${filament.id}-lengthMeters` as keyof ValidationErrors] = "Must be ≥ 0";
        }
        if (filament.diameter !== "" && number(filament.diameter) <= 0) {
          e[`filament-${filament.id}-diameter` as keyof ValidationErrors] = "Must be > 0";
        }
        if (filament.density !== "" && number(filament.density) <= 0) {
          e[`filament-${filament.id}-density` as keyof ValidationErrors] = "Must be > 0";
        }
      }
    });
    
    if (s.supportWastePercent !== "") {
      const sw = number(s.supportWastePercent);
      if (sw < 0 || sw > 500) e.supportWastePercent = "0–500%";
    }
    if (s.failureRatePercent !== "") {
      const fr = number(s.failureRatePercent);
      if (fr < 0 || fr > 100) e.failureRatePercent = "0–100%";
    }
    if (s.avgPowerW !== "" && number(s.avgPowerW) < 0) e.avgPowerW = "Must be ≥ 0";
    if (s.energyPricePerKWh !== "" && number(s.energyPricePerKWh) < 0) e.energyPricePerKWh = "Must be ≥ 0";
    if (s.printTimeHours !== "" && Math.floor(number(s.printTimeHours)) < 0) e.printTimeHours = "Must be ≥ 0";
    if (s.printTimeMinutes !== "") {
      const m = Math.floor(number(s.printTimeMinutes));
      if (m < 0 || m > 59) e.printTimeMinutes = "0–59";
    }

    if (s.printerPrice !== "" && number(s.printerPrice) < 0) e.printerPrice = "Must be ≥ 0";
    if (s.printerLifetimeHours !== "" && number(s.printerLifetimeHours) <= 0) e.printerLifetimeHours = "> 0";
    if (s.maintenanceEurPerHour !== "" && number(s.maintenanceEurPerHour) < 0) e.maintenanceEurPerHour = "Must be ≥ 0";
    if (s.laborRatePerHour !== "" && number(s.laborRatePerHour) < 0) e.laborRatePerHour = "Must be ≥ 0";
    if (s.laborMinutes !== "" && number(s.laborMinutes) < 0) e.laborMinutes = "Must be ≥ 0";
    if (s.postProcessingFixed !== "" && number(s.postProcessingFixed) < 0) e.postProcessingFixed = "Must be ≥ 0";

    if (s.marginPercent !== "") {
      const mp = number(s.marginPercent);
      if (mp < 0 || mp > 200) e.marginPercent = "0–200%";
    }

    // Validate new business fields
    if (s.shippingCost !== "" && number(s.shippingCost) < 0) e.shippingCost = "Must be ≥ 0";
    if (s.packagingCost !== "" && number(s.packagingCost) < 0) e.packagingCost = "Must be ≥ 0";
    if (s.vatPercent !== "") {
      const vp = number(s.vatPercent);
      if (vp < 0 || vp > 100) e.vatPercent = "0–100%";
    }
    if (s.targetProfit !== "" && number(s.targetProfit) < 0) e.targetProfit = "Must be ≥ 0";

    return e;
  }, [s]);
}