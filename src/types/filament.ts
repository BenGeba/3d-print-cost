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

export interface MaterialProfile {
  id: string;
  name: string;
  materialType: string; // PLA, PETG, ABS, etc.
  brand: string; // SUNLU, Bambu Lab, Polyterra, etc.
  color: string;
  pricePerKg: number | string;
  totalSpoolWeight: number | string; // Spulenleergewicht + Filamentgewicht
  emptySpoolWeight: number | string; // Reine Spule
  filamentWeight: number | string; // Reines Filamentgewicht
  costPerGram: number; // Automatisch berechnet
  url?: string; // Optional URL für Bezugsquelle
  density: number | string; // Materialdichte
  diameter: number | string; // Filament Durchmesser
  createdAt: Date;
  updatedAt: Date;
}