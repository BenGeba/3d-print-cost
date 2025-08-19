import { AppState } from '../types';

// ---------- Default state ----------
export const defaultState: AppState = {
  mode: "business",
  filamentPricingMode: "grams",
  filaments: [{
    id: "filament-1",
    name: "Filament 1",
    pricePerKg: 25,
    usedGrams: 28,
    diameter: 1.75,
    lengthMeters: 0,
    density: 1.24,
    material: "PLA"
  }],
  supportWastePercent: 10,
  failureRatePercent: 5,
  powerProfile: "custom",
  avgPowerW: 120,
  printTimeHours: 5,
  printTimeMinutes: 0,
  energyPricePerKWh: 0.35,
  printerPrice: 600,
  printerLifetimeHours: 1500,
  maintenanceEurPerHour: 0.02,
  laborRatePerHour: 20,
  laborMinutes: 15,
  preparationMinutes: 0,
  preparationHourlyRate: 0,
  postProcessingMinutes: 0,
  postProcessingHourlyRate: 0,
  marginPercent: 0,
  shippingCost: 0,
  packagingCost: 0,
  vatPercent: 0,
  targetProfit: 0,
  currency: "EUR",
};

// ---------- UI classes ----------
export const CARD_CLASS = "card shadow p-6";
export const LABEL_CLASS = "block font-medium mb-1";
export const INPUT_CLASS = "input input-bordered w-full";
export const SUBTLE = "text-sm";