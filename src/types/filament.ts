export interface Filament {
  id: string;
  name: string;
  pricePerKg: number | string;
  usedGrams?: number | string;
  lengthMeters?: number | string;
  diameter: number | string;
  density: number | string;
  material: string;
}

export interface MaterialPreset {
  pricePerKg: number;
  densityGcm3: number;
}

export interface PowerPreset {
  key: string;
  label: string;
  watts: number | null;
}

export interface MaterialOption {
  key: string;
  label: string;
  multiplier: number;
}