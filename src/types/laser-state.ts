export interface LaserState {
  mode: 'hobby' | 'business';
  currency: string;

  // Job
  jobTimeHours: number | string;
  jobTimeMinutes: number | string;
  itemsPerJob: number | string;

  // Material (piece-based)
  materialPreset: string;
  pricePerBlank: number | string;
  blanksUsed: number | string;
  wastePercent: number | string;

  // Energy
  powerProfile: string;
  avgPowerW: number | string;
  energyPricePerKwh: number | string;

  // Machine
  machinePrice: number | string;
  lifetimeHours: number | string;
  maintenancePerHour: number | string;

  // Business
  laborMinutes: number | string;
  laborRate: number | string;
  shippingCost: number | string;
  packagingCost: number | string;
  marginPercent: number | string;
  vatPercent: number | string;
}

export interface LaserValidationErrors {
  jobTimeHours?: string;
  jobTimeMinutes?: string;
  itemsPerJob?: string;
  pricePerBlank?: string;
  blanksUsed?: string;
  wastePercent?: string;
  avgPowerW?: string;
  energyPricePerKwh?: string;
  machinePrice?: string;
  lifetimeHours?: string;
  maintenancePerHour?: string;
  laborMinutes?: string;
  laborRate?: string;
  shippingCost?: string;
  packagingCost?: string;
  marginPercent?: string;
  vatPercent?: string;
}
