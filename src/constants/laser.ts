import type { LaserState } from '../types/laser-state';

export interface LaserMaterialPreset {
  key: string;
  labelKey: string; // i18n key under laser.presets.*
  pricePerBlank: number;
}

export interface LaserPowerPreset {
  key: string;
  labelKey: string; // i18n key under laser.presets.*
  watts: number | null;
}

export const LASER_POWER_PRESETS: LaserPowerPreset[] = [
  { key: '40w-diode', labelKey: 'laser.presets.40w-diode', watts: 150 },
  { key: '60w-mopa',  labelKey: 'laser.presets.60w-mopa',  watts: 280 },
  { key: 'custom',    labelKey: 'laser.presets.custom',    watts: null },
];

export const LASER_MATERIAL_PRESETS: LaserMaterialPreset[] = [
  { key: 'cork',             labelKey: 'laser.presets.cork',             pricePerBlank: 0.40 },
  { key: 'slate',            labelKey: 'laser.presets.slate',            pricePerBlank: 0.85 },
  { key: 'wood-keychain',    labelKey: 'laser.presets.wood-keychain',    pricePerBlank: 0.50 },
  { key: 'leather-keychain', labelKey: 'laser.presets.leather-keychain', pricePerBlank: 1.20 },
  { key: 'wood-opener',      labelKey: 'laser.presets.wood-opener',      pricePerBlank: 0.75 },
  { key: 'bottle-steel',     labelKey: 'laser.presets.bottle-steel',     pricePerBlank: 8.00 },
  { key: 'custom',           labelKey: 'laser.presets.custom',           pricePerBlank: 1.00 },
];

export const defaultLaserState: LaserState = {
  mode: 'business',
  currency: 'EUR',
  jobTimeHours: 0,
  jobTimeMinutes: 30,
  itemsPerJob: 10,
  materialPreset: 'cork',
  pricePerBlank: 0.40,
  blanksUsed: 10,
  wastePercent: 5,
  powerProfile: '40w-diode',
  avgPowerW: 150,
  energyPricePerKwh: 0.32,
  machinePrice: 1500,
  lifetimeHours: 2000,
  maintenancePerHour: 0.05,
  laborMinutes: 10,
  laborRate: 15,
  shippingCost: 0,
  packagingCost: 0,
  marginPercent: 30,
  vatPercent: 19,
};
