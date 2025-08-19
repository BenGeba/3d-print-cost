import { useMemo } from 'react';
import { AppState, Filament } from '../types';
import { number } from '../utils';

export function useCalculations(s: AppState) {
  // Helper function to calculate grams for a single filament
  const getFilamentGrams = (filament: Filament): number => {
    if (s.filamentPricingMode === "grams") {
      return number(filament.usedGrams, 0);
    }
    // Convert from length + diameter + density → grams
    const d = number(filament.diameter, 1.75) / 10; // mm → cm
    const r = d / 2;
    const area = Math.PI * r * r; // cm^2
    const lengthCm = number(filament.lengthMeters, 0) * 100;
    const volumeCm3 = area * lengthCm; // cm^3
    const density = number(filament.density, 1.24); // g/cm^3
    return volumeCm3 * density; // grams
  };

  const materialWasteFactor = 1 + number(s.supportWastePercent, 0) / 100;
  const failureFactor = 1 + number(s.failureRatePercent, 0) / 100;

  // Calculate total material cost across all filaments
  const materialCost = useMemo(() => {
    return s.filaments.reduce((totalCost, filament) => {
      const gramsUsed = getFilamentGrams(filament);
      const gramsWithWaste = gramsUsed * materialWasteFactor;
      const kg = gramsWithWaste / 1000;
      const baseCost = kg * number(filament.pricePerKg, 0);
      return totalCost + (baseCost * failureFactor);
    }, 0);
  }, [s.filaments, s.filamentPricingMode, materialWasteFactor, failureFactor]);

  const totalHours = number(s.printTimeHours, 0) + number(s.printTimeMinutes, 0) / 60;

  const energyCost = useMemo(() => {
    const kW = number(s.avgPowerW, 0) / 1000;
    return kW * totalHours * number(s.energyPricePerKWh, 0);
  }, [s.avgPowerW, totalHours, s.energyPricePerKWh]);

  const depreciationPerHour = useMemo(() => {
    const price = number(s.printerPrice, 0);
    const life = Math.max(1, number(s.printerLifetimeHours, 1));
    return price / life;
  }, [s.printerPrice, s.printerLifetimeHours]);

  const depreciationCost = depreciationPerHour * totalHours;
  const maintenanceCost = number(s.maintenanceEurPerHour, 0) * totalHours;

  const laborCost = useMemo(() => {
    const hours = number(s.laborMinutes, 0) / 60;
    return hours * number(s.laborRatePerHour, 0);
  }, [s.laborMinutes, s.laborRatePerHour]);

  const baseSubtotal = materialCost + energyCost + maintenanceCost + (s.mode === "business" ? depreciationCost + laborCost + number(s.postProcessingFixed, 0) : 0);

  const shippingCost = s.mode === "business" ? number(s.shippingCost, 0) : 0;
  const packagingCost = s.mode === "business" ? number(s.packagingCost, 0) : 0;
  const subtotalWithExtras = baseSubtotal + shippingCost + packagingCost;
  
  const margin = subtotalWithExtras * (number(s.marginPercent, 0) / 100);
  const netTotal = subtotalWithExtras + margin;

  const vatPercent = s.mode === "business" ? number(s.vatPercent, 0) : 0;
  const vatAmount = netTotal * (vatPercent / 100);
  const total = netTotal + vatAmount;

  // Profit calculator - work backwards from target profit
  const targetProfit = s.mode === "business" ? number(s.targetProfit, 0) : 0;
  const requiredSellingPrice = useMemo(() => {
    if (targetProfit <= 0) return 0;
    // Required price = (base costs + shipping + packaging + target profit) / (1 - vatPercent/100)
    const baseCosts = baseSubtotal + shippingCost + packagingCost;
    const preTaxPrice = baseCosts + targetProfit;
    return vatPercent > 0 ? preTaxPrice / (1 - vatPercent / 100) : preTaxPrice;
  }, [baseSubtotal, shippingCost, packagingCost, targetProfit, vatPercent]);

  return {
    materialCost,
    energyCost,
    depreciationCost,
    maintenanceCost,
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
    targetProfit,
    requiredSellingPrice,
    totalHours,
    getFilamentGrams
  };
}