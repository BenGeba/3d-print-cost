import { Filament } from './filament';

export interface AppState {
  mode: "hobby" | "business";
  filamentPricingMode: "grams" | "length";
  filaments: Filament[];
  // Legacy fields for backward compatibility (will be migrated)
  pricePerKg?: number | string;
  filamentUsedGrams?: number | string;
  filamentDiameter?: number | string;
  filamentLengthMeters?: number | string;
  densityGcm3?: number | string;
  material?: string;
  supportWastePercent: number | string;
  failureRatePercent: number | string;
  powerProfile: string;
  avgPowerW: number | string;
  printTimeHours: number | string;
  printTimeMinutes: number | string;
  energyPricePerKWh: number | string;
  printerPrice: number | string;
  printerLifetimeHours: number | string;
  maintenanceEurPerHour: number | string;
  laborRatePerHour: number | string;
  laborMinutes: number | string;
  preparationMinutes: number | string;
  preparationHourlyRate: number | string;
  postProcessingMinutes: number | string;
  postProcessingHourlyRate: number | string;
  marginPercent: number | string;
  shippingCost: number | string;
  packagingCost: number | string;
  vatPercent: number | string;
  targetProfit: number | string;
  currency: string;
}

export type ValidationErrors = Partial<Record<keyof AppState, string>> & {
  [key: `filament-${string}-${keyof Filament}`]: string;
};