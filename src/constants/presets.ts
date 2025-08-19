import { MaterialPreset, PowerPreset, MaterialOption } from '../types';

// ---------- Material presets ----------
export const presets: Record<string, MaterialPreset> = {
  PLA: { pricePerKg: 22, densityGcm3: 1.24 },
  PETG: { pricePerKg: 25, densityGcm3: 1.27 },
  ABS: { pricePerKg: 28, densityGcm3: 1.04 },
  TPU: { pricePerKg: 30, densityGcm3: 1.21 },
};

// ---------- Printer power presets (PLA baseline) ----------
export const POWER_PRESETS: PowerPreset[] = [
  { key: "custom", label: "Custom (enter manually)", watts: null },
  { key: "bambu_p1s", label: "Bambu Lab P1S (~105 W)", watts: 105 },
  { key: "bambu_a1", label: "Bambu Lab A1 (~95 W)", watts: 95 },
  { key: "bambu_a1_mini", label: "Bambu Lab A1 mini (~80 W)", watts: 80 },
  { key: "bambu_x1c", label: "Bambu Lab X1C (~105 W)", watts: 105 },
  { key: "prusa_mk4s", label: "Prusa MK4S (~80 W)", watts: 80 },
  { key: "creality_ender3_v3", label: "Creality Ender-3 V3 (~110 W)", watts: 110 },
  { key: "elegoo_neptune4_pro", label: "Elegoo Neptune 4 Pro (~150 W)", watts: 150 },
];

// Material options (multipliers relative to PLA)
export const MATERIALS: MaterialOption[] = [
  { key: "PLA", label: "PLA", multiplier: 1.0 },
  { key: "PETG", label: "PETG", multiplier: 1.3 },
  { key: "ABS", label: "ABS", multiplier: 1.5 },
];

// Optional per-printer overrides for non-PLA materials (if known)
export const PRINTER_MATERIAL_OVERRIDES: Record<string, Record<string, number>> = {
  bambu_p1s: { PLA: 105, PETG: 140 },
  bambu_x1c: { PLA: 105, PETG: 150 },
  bambu_a1: { PLA: 95, PETG: 200 },
  bambu_a1_mini: { PLA: 80, PETG: 75 },
  prusa_mk4s: { PLA: 80, ABS: 120 },
  creality_ender3_v3: { PLA: 110 },
  elegoo_neptune4_pro: { PLA: 150 },
};