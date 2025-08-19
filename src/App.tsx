import React, {type ChangeEvent, useEffect, useMemo, useState} from "react";
import InstallPWAButton from "./components/InstallPWAButton";
import { formatToCurrency } from "./utils/formatnumbers";

// Type definitions
interface Filament {
  id: string;
  name: string;
  pricePerKg: number | string;
  usedGrams?: number | string;
  lengthMeters?: number | string;
  diameter: number | string;
  density: number | string;
  material: string;
}

interface AppState {
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
  postProcessingFixed: number | string;
  marginPercent: number | string;
  shippingCost: number | string;
  packagingCost: number | string;
  vatPercent: number | string;
  targetProfit: number | string;
  currency: string;
}

interface MaterialPreset {
  pricePerKg: number;
  densityGcm3: number;
}

interface PowerPreset {
  key: string;
  label: string;
  watts: number | null;
}

interface MaterialOption {
  key: string;
  label: string;
  multiplier: number;
}

interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
  actionLabel?: string;
  actionFn?: () => void;
}

type ValidationErrors = Partial<Record<keyof AppState, string>> & {
  [key: `filament-${string}-${keyof Filament}`]: string;
};

// UI component prop types
interface FieldProps {
  label: string;
  suffix?: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
  tip?: string;
}

interface SwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  labelLeft?: string;
  labelRight?: string;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}

interface LineProps {
  label: string;
  value: number;
  currency: string;
}

interface InfoLineProps {
  label: string;
  value: string;
}

// 3D Print Cost Calculator – TypeScript React component
// Styling: TailwindCSS + daisyUI (Light/Dark via swap)
// Features:
// - Hobby vs. Business mode
// - Filament by grams or by length+diameter (+density)
// - Failure/support waste factors
// - Energy costs with hours + minutes
// - Printer power presets + material multipliers (+ Custom)
// - Depreciation, maintenance, labor, post-processing, margin
// - Dark/Light (nord/dracula) theme swap
// - LocalStorage persistence

// ---------- UI classes ----------
const CARD_CLASS = "card shadow p-6";
const LABEL_CLASS = "block font-medium mb-1";
const INPUT_CLASS = "input input-bordered w-full";
const SUBTLE = "text-sm";

// ---------- Default state ----------
const defaultState: AppState = {
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
  postProcessingFixed: 0,
  marginPercent: 0,
  shippingCost: 0,
  packagingCost: 0,
  vatPercent: 0,
  targetProfit: 0,
  currency: "EUR",
};

// ---------- Material presets ----------
const presets: Record<string, MaterialPreset> = {
  PLA: { pricePerKg: 22, densityGcm3: 1.24 },
  PETG: { pricePerKg: 25, densityGcm3: 1.27 },
  ABS: { pricePerKg: 28, densityGcm3: 1.04 },
  TPU: { pricePerKg: 30, densityGcm3: 1.21 },
};

// ---------- Printer power presets (PLA baseline) ----------
const POWER_PRESETS: PowerPreset[] = [
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
const MATERIALS: MaterialOption[] = [
  { key: "PLA", label: "PLA", multiplier: 1.0 },
  { key: "PETG", label: "PETG", multiplier: 1.3 },
  { key: "ABS", label: "ABS", multiplier: 1.5 },
];

// Optional per-printer overrides for non-PLA materials (if known)
const PRINTER_MATERIAL_OVERRIDES: Record<string, Record<string, number>> = {
  bambu_p1s: { PLA: 105, PETG: 140 },
  bambu_x1c: { PLA: 105, PETG: 150 },
  bambu_a1: { PLA: 95, PETG: 200 },
  bambu_a1_mini: { PLA: 80, PETG: 75 },
  prusa_mk4s: { PLA: 80, ABS: 120 },
  creality_ender3_v3: { PLA: 110 },
  elegoo_neptune4_pro: { PLA: 150 },
};

// ---------- Helpers ----------
function usePersistentState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migration logic: convert legacy single filament to array format
        if (parsed && !Array.isArray(parsed.filaments) && parsed.pricePerKg !== undefined) {
          const legacyFilament: Filament = {
            id: "filament-1",
            name: "Filament 1",
            pricePerKg: parsed.pricePerKg || 25,
            usedGrams: parsed.filamentUsedGrams || 0,
            lengthMeters: parsed.filamentLengthMeters || 0,
            diameter: parsed.filamentDiameter || 1.75,
            density: parsed.densityGcm3 || 1.24,
            material: parsed.material || "PLA"
          };
          parsed.filaments = [legacyFilament];
          // Clean up legacy fields
          delete parsed.pricePerKg;
          delete parsed.filamentUsedGrams;
          delete parsed.filamentLengthMeters;
          delete parsed.filamentDiameter;
          delete parsed.densityGcm3;
          delete parsed.material;
        }
        return { ...initial, ...parsed };
      }
      return initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

// Convert value to number, supporting both comma and dot as decimal separator
function number(v: string | number | undefined | null, fallback: number = 0): number {
  if (v === "" || v === null || v === undefined) return fallback;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

// Parse input value, allowing empty strings and supporting both decimal separators
function parseInput(v: string): string | number {
  if (v === "") return "";
  // Replace comma with dot for internal storage
    return String(v).replace(",", ".");
}

function prettyDuration(hours: number | string, minutes: number | string): string {
  const totalMinutes = Math.max(0, Math.round((number(hours, 0) + number(minutes, 0) / 60) * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h} h ${m} min`;
}

// ---------- UI primitives ----------
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, suffix, children, hint, error, tip }: FieldProps) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        <span className="inline-flex items-center gap-2">
          {label}
          {tip && (
            <span className="tooltip" data-tip={tip}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 opacity-70">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 8a1 1 0 112 0v5a1 1 0 11-2 0V8zm1-4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </span>
      </label>
      {children}
      {error && <p className="text-error text-xs mt-1">{error}</p>}
      <div className="flex items-center gap-2 mt-1">
        {suffix && <span className={SUBTLE}>{suffix}</span>}
        {hint && <span className={SUBTLE}>{hint}</span>}
      </div>
    </div>
  );
}

function Switch({ checked, onChange, labelLeft, labelRight }: SwitchProps) {
  return (
    <div className="flex items-center gap-3">
      {labelLeft && <span className={SUBTLE}>{labelLeft}</span>}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
          checked ? "bg-gray-900" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      {labelRight && <span className={SUBTLE}>{labelRight}</span>}
    </div>
  );
}

function Section({ title, children, aside }: SectionProps) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          {aside}
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 text-sm">
      {children}
    </div>
  );
}

function InfoLine({ label, value }: InfoLineProps) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Line({ label, value, currency }: LineProps) {
  const browserLocale =
  (typeof navigator !== "undefined" &&
    (navigator.languages?.[0] || navigator.language)) ||
  "de-DE";
   const formatted = formatToCurrency({
    num: value ?? 0,
    currency,
    decimalPlaces: 2,
    significantDecimalPlaces: 2,
    locale: browserLocale
  });
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium">{formatted}</span>
    </div>
  );
}

// ---------- Filament Card Component ----------
interface FilamentCardProps {
  filament: Filament;
  filamentPricingMode: "grams" | "length";
  onUpdate: (id: string, updates: Partial<Filament>) => void;
  onRemove: (id: string) => void;
  onApplyPreset: (name: string, filamentId: string) => void;
  errors: ValidationErrors;
  canRemove: boolean;
}

function FilamentCard({ filament, filamentPricingMode, onUpdate, onRemove, onApplyPreset, errors, canRemove }: FilamentCardProps) {
  return (
    <div className="card bg-base-100 shadow border border-base-300">
      <div className="card-body">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <Field label="Name" tip="Custom label for this filament">
              <input
                className={INPUT_CLASS}
                type="text"
                placeholder="Filament name"
                value={filament.name}
                onChange={(e) => onUpdate(filament.id, { name: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
                Presets
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-24 p-2 shadow">
                {Object.keys(presets).map((k) => (
                  <li key={k}>
                    <button onClick={() => onApplyPreset(k, filament.id)}>{k}</button>
                  </li>
                ))}
              </ul>
            </div>
            {canRemove && (
              <button
                className="btn btn-sm btn-error btn-soft"
                onClick={() => onRemove(filament.id)}
                title="Remove filament"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <Row>
          <Field label="Material">
            <select
              className="select select-bordered"
              value={filament.material}
              onChange={(e) => onUpdate(filament.id, { material: e.target.value })}
            >
              {MATERIALS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </Field>
          <Field 
            label="Price per kg" 
            error={errors[`filament-${filament.id}-pricePerKg` as keyof ValidationErrors]} 
            tip="Material price per kilogram"
          >
            <input
              className={`${INPUT_CLASS} ${errors[`filament-${filament.id}-pricePerKg` as keyof ValidationErrors] ? 'input-error' : ''}`}
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={filament.pricePerKg}
              onChange={(e) => onUpdate(filament.id, { pricePerKg: parseInput(e.target.value) })}
            />
          </Field>
        </Row>

        <Row>
          {filamentPricingMode === "grams" ? (
            <Field 
              label="Used amount" 
              suffix="grams" 
              error={errors[`filament-${filament.id}-usedGrams` as keyof ValidationErrors]} 
              tip="Use slicer estimate or measured weight"
            >
              <input
                className={`${INPUT_CLASS} ${errors[`filament-${filament.id}-usedGrams` as keyof ValidationErrors] ? 'input-error' : ''}`}
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={filament.usedGrams}
                onChange={(e) => onUpdate(filament.id, { usedGrams: parseInput(e.target.value) })}
              />
            </Field>
          ) : (
            <>
              <Field 
                label="Length" 
                suffix="meters" 
                error={errors[`filament-${filament.id}-lengthMeters` as keyof ValidationErrors]} 
                tip="From slicer or spool meter counter"
              >
                <input
                  className={`${INPUT_CLASS} ${errors[`filament-${filament.id}-lengthMeters` as keyof ValidationErrors] ? 'input-error' : ''}`}
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={filament.lengthMeters}
                  onChange={(e) => onUpdate(filament.id, { lengthMeters: parseInput(e.target.value) })}
                />
              </Field>
              <Field 
                label="Diameter" 
                suffix="mm" 
                error={errors[`filament-${filament.id}-diameter` as keyof ValidationErrors]} 
                tip="Typical: 1.75 mm or 2.85 mm"
              >
                <input
                  className={`${INPUT_CLASS} ${errors[`filament-${filament.id}-diameter` as keyof ValidationErrors] ? 'input-error' : ''}`}
                  type="text"
                  inputMode="decimal"
                  placeholder="1.75"
                  value={filament.diameter}
                  onChange={(e) => onUpdate(filament.id, { diameter: parseInput(e.target.value) })}
                />
              </Field>
            </>
          )}
        </Row>

        {filamentPricingMode === "length" && (
          <Row>
            <Field 
              label="Density" 
              suffix="g/cm³" 
              hint="PLA≈1.24, PETG≈1.27, ABS≈1.04, TPU≈1.21" 
              error={errors[`filament-${filament.id}-density` as keyof ValidationErrors]} 
              tip="Material density for length→grams conversion"
            >
              <input
                className={`${INPUT_CLASS} ${errors[`filament-${filament.id}-density` as keyof ValidationErrors] ? 'input-error' : ''}`}
                type="text"
                inputMode="decimal"
                placeholder="1.24"
                value={filament.density}
                onChange={(e) => onUpdate(filament.id, { density: parseInput(e.target.value) })}
              />
            </Field>
          </Row>
        )}
      </div>
    </div>
  );
}

// ---------- App ----------
export default function App() {
  const [s, set] = usePersistentState<AppState>("print-cost-calc:v1", defaultState);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // --- Toast helpers (daisyUI toast + alert) ---
  function pushToast(
    kind: Toast["kind"], 
    message: string, 
    ms: number = 3500, 
    actionLabel?: string, 
    actionFn?: () => void
  ): void {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message, actionLabel, actionFn }]);
    if (ms > 0) setTimeout(() => removeToast(id), ms);
  }
  
  function removeToast(id: number): void {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

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

  const fmt = (v: number): string => {
    const browserLocale =
      (typeof navigator !== "undefined" &&
        (navigator.languages?.[0] || navigator.language)) ||
      "de-DE";
    return formatToCurrency({
      num: v ?? 0,
      currency: s.currency,
      decimalPlaces: 2,
      significantDecimalPlaces: 8,
      locale: browserLocale
    });
  };

  // --- Inline validation ---
  const errors = useMemo<ValidationErrors>(() => {
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

  // copy breakdown to clipboard + toast
  async function copyBreakdown(): Promise<void> {
    try {
      const lines: string[] = [];
      lines.push(`Print time: ${prettyDuration(number(s.printTimeHours,0), number(s.printTimeMinutes,0))}`);
      lines.push(`Material: ${fmt(materialCost)}`);
      lines.push(`Energy: ${fmt(energyCost)}`);
      lines.push(`Maintenance: ${fmt(maintenanceCost)}`);
      if (s.mode === 'business') {
        lines.push(`Depreciation: ${fmt(depreciationCost)}`);
        lines.push(`Labor: ${fmt(laborCost)}`);
        lines.push(`Post-processing: ${fmt(number(s.postProcessingFixed,0))}`);
        if (shippingCost > 0) lines.push(`Shipping: ${fmt(shippingCost)}`);
        if (packagingCost > 0) lines.push(`Packaging: ${fmt(packagingCost)}`);
      }
      if (number(s.marginPercent,0) > 0) {
        lines.push(`Margin (${s.marginPercent}%): ${fmt(margin)}`);
      }
      if (s.mode === 'business' && vatPercent > 0) {
        lines.push(`Net total: ${fmt(netTotal)}`);
        lines.push(`VAT (${vatPercent}%): ${fmt(vatAmount)}`);
      }
      lines.push(`Total: ${fmt(total)}`);
      const text = lines.join('\n');
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text; 
        document.body.appendChild(ta); 
        ta.select(); 
        document.execCommand('copy'); 
        document.body.removeChild(ta);
      }
      pushToast('success', 'Breakdown copied');
    } catch (e) {
      pushToast('error', 'Copy failed');
    }
  }

  // Undo-able mode toggle
  function onToggleMode(v: boolean): void {
    const prev = s.mode;
    const next = v ? 'business' : 'hobby';
    if (prev === next) return;
    setMany({ mode: next });
    pushToast('info', `Mode: ${next}`, 5000, 'Undo', () => setMany({ mode: prev }));
  }

  // Margin change with Undo
  function onChangeMargin(value: string): void {
    const prev = s.marginPercent;
    const next = parseInput(value);
    setMany({ marginPercent: next });
    if (next !== "" && next !== prev) {
      pushToast('info', `Margin: ${number(next, 0)}%`, 5000, 'Undo', () => setMany({ marginPercent: prev }));
    }
  }

  // State helpers
  function setMany(patch: Partial<AppState>): void {
    set({ ...s, ...patch });
  }

  // Filament management helpers
  function updateFilament(id: string, updates: Partial<Filament>): void {
    const updatedFilaments = s.filaments.map(f => 
      f.id === id ? { ...f, ...updates } : f
    );
    setMany({ filaments: updatedFilaments });
  }

  function addFilament(): void {
    const newId = `filament-${Date.now()}`;
    const newFilament: Filament = {
      id: newId,
      name: `Filament ${s.filaments.length + 1}`,
      pricePerKg: 25,
      usedGrams: 0,
      lengthMeters: 0,
      diameter: 1.75,
      density: 1.24,
      material: "PLA"
    };
    setMany({ filaments: [...s.filaments, newFilament] });
    pushToast('info', `Added ${newFilament.name}`);
  }

  function removeFilament(id: string): void {
    if (s.filaments.length <= 1) {
      pushToast('error', 'Cannot remove the last filament');
      return;
    }
    const filamentToRemove = s.filaments.find(f => f.id === id);
    const updatedFilaments = s.filaments.filter(f => f.id !== id);
    setMany({ filaments: updatedFilaments });
    if (filamentToRemove) {
      pushToast('info', `Removed ${filamentToRemove.name}`);
    }
  }

  function applyPreset(name: string, filamentId?: string): void {
    const p = presets[name];
    if (p) {
      if (filamentId) {
        // Apply to specific filament
        updateFilament(filamentId, { pricePerKg: p.pricePerKg, density: p.densityGcm3, material: name });
        pushToast('info', `${name} preset applied to filament`);
      } else {
        // Apply to all filaments (legacy behavior)
        const updatedFilaments = s.filaments.map(f => ({
          ...f,
          pricePerKg: p.pricePerKg,
          density: p.densityGcm3,
          material: name
        }));
        setMany({ filaments: updatedFilaments });
        pushToast('info', `${name} preset applied to all filaments`);
      }
    }
  }

  function resetDefaults(): void {
    set(defaultState);
  }

  function openResetModal(): void {
    const dlg = document.getElementById('resetModal') as HTMLDialogElement | null;
    if (dlg && typeof dlg.showModal === 'function') {
      dlg.showModal();
    } else {
      // Fallback if <dialog> unsupported
      setTimeout(() => set(defaultState), 0);
    }
  }

  function confirmReset(): void {
    resetDefaults();
    const dlg = document.getElementById('resetModal') as HTMLDialogElement | null;
    if (dlg && typeof dlg.close === 'function') dlg.close();
    pushToast('success', 'Settings reset');
  }

  function setTimeHours(v: string): void {
    const parsed = parseInput(v);
    if (parsed === "") {
      setMany({ printTimeHours: "" });
    } else {
      const h = Math.max(0, Math.floor(number(parsed, 0)));
      setMany({ printTimeHours: h });
    }
  }

  function setTimeMinutes(v: string): void {
    const parsed = parseInput(v);
    if (parsed === "") {
      setMany({ printTimeMinutes: "" });
    } else {
      let m = Math.max(0, Math.floor(number(parsed, 0)));
      const extra = Math.floor(m / 60);
      m = m % 60;
      const h = Math.max(0, Math.floor(number(s.printTimeHours, 0))) + extra;
      setMany({ printTimeHours: h, printTimeMinutes: m });
    }
  }

  function onChangePowerPreset(key: string): void {
    const preset = POWER_PRESETS.find((p) => p.key === key);
    if (!preset) return;

    if (preset.key === "custom" || preset.watts == null) {
      setMany({ powerProfile: "custom" });
      pushToast('info', 'Custom power profile');
      return;
    }

    const mat = s.material || "PLA";
    const override = PRINTER_MATERIAL_OVERRIDES[preset.key]?.[mat];
    const base = preset.watts;
    const mult = MATERIALS.find(m => m.key === mat)?.multiplier ?? 1;
    const nextW = Number.isFinite(override) ? override : Math.round(base * mult);
    setMany({ powerProfile: preset.key, avgPowerW: nextW });
    pushToast('info', `${preset.label} → ${nextW} W`);
  }

  function onChangeMaterial(matKey: string): void {
    setMany({ material: matKey });

    if (s.powerProfile && s.powerProfile !== "custom") {
      const preset = POWER_PRESETS.find(p => p.key === s.powerProfile);
      if (preset && Number.isFinite(preset.watts)) {
        const override = PRINTER_MATERIAL_OVERRIDES[s.powerProfile]?.[matKey];
        const mult = MATERIALS.find(m => m.key === matKey)?.multiplier ?? 1;
        const base = preset.watts!;
        const nextW = Number.isFinite(override) ? override : Math.round(base * mult);
        setMany({ avgPowerW: nextW });
        pushToast('info', `Material: ${matKey} → ${nextW} W`);
      }
    } else {
      pushToast('info', `Material: ${matKey}`);
    }
  }

  // --- Theme (light/dark) via daisyUI theme-controller ---
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    // Load theme from localStorage on initial render
    const savedTheme = localStorage.getItem('print-cost-calc:theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // If no saved preference, check system preference
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    // Default to light theme
    return false;
  });

  useEffect(() => {
    // Apply theme on mount and when it changes
    const theme = isDarkTheme ? 'dracula' : 'nord';
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Save theme preference to localStorage
    localStorage.setItem('print-cost-calc:theme', isDarkTheme ? 'dark' : 'light');
    }, [isDarkTheme]);

  function onThemeSwapChange(e: ChangeEvent<HTMLInputElement>): void {
    const newTheme = e.target.checked;
    setIsDarkTheme(newTheme);
    pushToast('info', `Theme: ${newTheme ? 'Dark' : 'Light'}`, 2000);
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-base-200 text-base-content transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">3D Print Cost Calculator</h1>
            <p className="mt-1 text-sm md:text-base text-base-content/70">Plan reliable costs for your FDM prints. Save presets, switch modes, and get a transparent breakdown.</p>
          </div>
          
          {/* Controls - Clean single row layout */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="swap swap-rotate">
                <input type="checkbox" className="theme-controller" checked={isDarkTheme} onChange={onThemeSwapChange} />
                <svg className="swap-off h-8 w-8 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                </svg>
                <svg className="swap-on h-8 w-8 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                </svg>
              </label>
              
              <Switch
                checked={s.mode === "business"}
                onChange={onToggleMode}
                labelLeft="Hobby"
                labelRight="Business"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button className="btn btn-soft btn-error" onClick={openResetModal}>
                Reset
              </button>
              <InstallPWAButton />
            </div>
          </div>
        </header>

        {/* Reset confirm modal */}
        <dialog id="resetModal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Reset settings?</h3>
            <p className="py-2">This will restore all fields to their defaults.</p>
            <div className="modal-action">
              <form method="dialog" className="flex gap-2">
                <button className="btn btn-soft">Cancel</button>
                <button type="button" className="btn btn-soft btn-error" onClick={confirmReset}>Reset</button>
              </form>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>

        {/* Presets & helpers */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Material presets */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-base-content/70 mr-2">Material Presets:</span>
                {Object.keys(presets).map((k) => (
                  <button
                    key={k}
                    onClick={() => applyPreset(k)}
                    className="btn btn-sm sm:btn-md btn-soft btn-primary"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Currency selector */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-medium text-base-content/70">Currency:</span>
              <select
                className="select select-sm sm:select-md select-neutral min-w-0 w-20"
                value={s.currency}
                onChange={(e) => setMany({ currency: e.target.value })}
              >
                <option>EUR</option>
                <option>USD</option>
                <option>GBP</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Filaments */}
            <Section
              title="Filaments"
              aside={
                <div className="flex items-center gap-3">
                  <span className={SUBTLE}>By grams</span>
                  <Switch
                    checked={s.filamentPricingMode === "length"}
                    onChange={(v) => setMany({ filamentPricingMode: v ? "length" : "grams" })}
                    labelRight="By length"
                  />
                </div>
              }
            >
              <div className="space-y-4">
                {s.filaments.map((filament) => (
                  <FilamentCard
                    key={filament.id}
                    filament={filament}
                    filamentPricingMode={s.filamentPricingMode}
                    onUpdate={updateFilament}
                    onRemove={removeFilament}
                    onApplyPreset={applyPreset}
                    errors={errors}
                    canRemove={s.filaments.length > 1}
                  />
                ))}
                
                <div className="flex justify-center pt-2">
                  <button
                    className="btn btn-soft btn-primary gap-2"
                    onClick={addFilament}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Add Filament
                  </button>
                </div>
              </div>
              
              <Row>
                <Field label="Support & waste" suffix="%" error={errors.supportWastePercent} tip="Extra material for supports, brim, purge, etc.">
                  <input
                    className={`${INPUT_CLASS} ${errors.supportWastePercent ? 'input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={s.supportWastePercent}
                    onChange={(e) => setMany({ supportWastePercent: parseInput(e.target.value) })}
                  />
                </Field>
                <Field label="Failure rate" suffix="%" hint="Amortized reprints" error={errors.failureRatePercent} tip="Share of failed prints over time (0–100%)">
                  <input
                    className={`${INPUT_CLASS} ${errors.failureRatePercent ? 'input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={s.failureRatePercent}
                    onChange={(e) => setMany({ failureRatePercent: parseInput(e.target.value) })}
                  />
                </Field>
              </Row>
            </Section>

            {/* Energy */}
            <Section title="Energy">
              <Row>
                <Field label="Material">
                  <select
                    className="select select-bordered"
                    value={s.material}
                    onChange={(e) => onChangeMaterial(e.target.value)}
                  >
                    {MATERIALS.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-gray-500">Changing material adjusts average power based on official data when available or by a material multiplier.</div>
                </Field>
                <Field label="Average power" suffix="W" error={errors.avgPowerW} tip="Mean wattage during steady-state printing (measure with smart plug)">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <select
                      className="select select-bordered"
                      value={s.powerProfile}
                      onChange={(e) => onChangePowerPreset(e.target.value)}
                    >
                      {POWER_PRESETS.map((p) => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </select>
                    <input
                      className={`${INPUT_CLASS} ${errors.avgPowerW ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.avgPowerW}
                      onChange={(e) => setMany({ avgPowerW: parseInput(e.target.value), powerProfile: "custom" })}
                      disabled={s.powerProfile !== "custom"}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-500">Preset values are typical PLA @ ~60°C bed; actual usage varies with temps, enclosure, room conditions.</div>
                </Field>
                <Field label="Print time" error={errors.printTimeHours || errors.printTimeMinutes} tip="Total nozzle-on time; minutes normalize to 0–59">
                  <div className="flex items-center gap-2">
                    <input
                      className={`${INPUT_CLASS} ${errors.printTimeHours ? 'input-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={s.printTimeHours}
                      onChange={(e) => setTimeHours(e.target.value)}
                    />
                    <span className="text-sm text-gray-500">h</span>
                    <input
                      className={`${INPUT_CLASS} ${errors.printTimeMinutes ? 'input-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={s.printTimeMinutes}
                      onChange={(e) => setTimeMinutes(e.target.value)}
                    />
                    <span className="text-sm text-gray-500">min</span>
                  </div>
                </Field>
              </Row>
              <Row>
                <Field label="Energy price" suffix={`${s.currency}/kWh`} error={errors.energyPricePerKWh} tip="Your electricity unit price">
                  <input
                    className={`${INPUT_CLASS} ${errors.energyPricePerKWh ? 'input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={s.energyPricePerKWh}
                    onChange={(e) => setMany({ energyPricePerKWh: parseInput(e.target.value) })}
                  />
                </Field>
              </Row>
            </Section>

            {/* Business-only */}
            {s.mode === "business" && (
              <Section title="Business factors">
                <Row>
                  <Field label="Printer price" error={errors.printerPrice} tip="Purchase price used for straight-line depreciation">
                    <input
                      className={`${INPUT_CLASS} ${errors.printerPrice ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.printerPrice}
                      onChange={(e) => setMany({ printerPrice: parseInput(e.target.value) })}
                    />
                  </Field>
                  <Field label="Lifetime" suffix="hours" error={errors.printerLifetimeHours} tip="Expected productive hours until replacement">
                    <input
                      className={`${INPUT_CLASS} ${errors.printerLifetimeHours ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="1"
                      value={s.printerLifetimeHours}
                      onChange={(e) => setMany({ printerLifetimeHours: parseInput(e.target.value) })}
                    />
                  </Field>
                </Row>
                <Row>
                  <Field label="Maintenance" suffix={`${s.currency}/h`} error={errors.maintenanceEurPerHour} tip="Consumables & wear per printing hour">
                    <input
                      className={`${INPUT_CLASS} ${errors.maintenanceEurPerHour ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.maintenanceEurPerHour}
                      onChange={(e) => setMany({ maintenanceEurPerHour: parseInput(e.target.value) })}
                    />
                  </Field>
                  <Field label="Labor rate" suffix={`${s.currency}/h`} error={errors.laborRatePerHour} tip="Your hourly rate for handling & post">
                    <input
                      className={`${INPUT_CLASS} ${errors.laborRatePerHour ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.laborRatePerHour}
                      onChange={(e) => setMany({ laborRatePerHour: parseInput(e.target.value) })}
                    />
                  </Field>
                </Row>
                <Row>
                  <Field label="Labor time" suffix="min" error={errors.laborMinutes} tip="Hands-on time (setup, cleanup)">
                    <input
                      className={`${INPUT_CLASS} ${errors.laborMinutes ? 'input-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={s.laborMinutes}
                      onChange={(e) => setMany({ laborMinutes: parseInput(e.target.value) })}
                    />
                  </Field>
                  <Field label="Post-processing (fixed)" error={errors.postProcessingFixed} tip="Fixed cost for sanding, painting, etc.">
                    <input
                      className={`${INPUT_CLASS} ${errors.postProcessingFixed ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.postProcessingFixed}
                      onChange={(e) => setMany({ postProcessingFixed: parseInput(e.target.value) })}
                    />
                  </Field>
                </Row>
                <Row>
                  <Field label="Shipping cost" suffix={s.currency} error={errors.shippingCost} tip="Fixed shipping cost per order">
                    <input
                      className={`${INPUT_CLASS} ${errors.shippingCost ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.shippingCost}
                      onChange={(e) => setMany({ shippingCost: parseInput(e.target.value) })}
                    />
                  </Field>
                  <Field label="Packaging cost" suffix={s.currency} error={errors.packagingCost} tip="Fixed packaging cost per order">
                    <input
                      className={`${INPUT_CLASS} ${errors.packagingCost ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.packagingCost}
                      onChange={(e) => setMany({ packagingCost: parseInput(e.target.value) })}
                    />
                  </Field>
                </Row>
                <Row>
                  <Field label="VAT / Tax" suffix="%" error={errors.vatPercent} tip="VAT percentage applied to net total">
                    <input
                      className={`${INPUT_CLASS} ${errors.vatPercent ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.vatPercent}
                      onChange={(e) => setMany({ vatPercent: parseInput(e.target.value) })}
                    />
                  </Field>
                  <Field label="Margin" suffix="%" hint="Optional markup for quotes" error={errors.marginPercent} tip="Add-on percentage applied on subtotal">
                    <input
                      className={`${INPUT_CLASS} ${errors.marginPercent ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.marginPercent}
                      onChange={(e) => onChangeMargin(e.target.value)}
                    />
                  </Field>
                </Row>
              </Section>
            )}

            <Section title="Notes">
              <Info>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Average power: measure with a smart plug for best accuracy.</li>
                  <li>Failure rate applies as an amortized multiplier over material cost.</li>
                  <li>Depreciation uses straight-line: printer price / lifetime hours.</li>
                  <li>For length-based filament, density & diameter convert to grams.</li>
                  <li>Both dot (.) and comma (,) work as decimal separators.</li>
                </ul>
              </Info>
            </Section>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div className={CARD_CLASS}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Breakdown</h2>
                <div className="flex items-center gap-2">
                  <button className="btn btn-soft btn-primary" onClick={copyBreakdown}>Copy breakdown</button>
                </div>
              </div>
              <div className="space-y-3">
                <InfoLine label="Print time" value={prettyDuration(number(s.printTimeHours, 0), number(s.printTimeMinutes, 0))} />
                <Line label="Material" value={materialCost} currency={s.currency} />
                <Line label="Energy" value={energyCost} currency={s.currency} />
                <Line label="Maintenance" value={maintenanceCost} currency={s.currency} />
                {s.mode === "business" && (
                  <>
                    <Line label="Depreciation" value={depreciationCost} currency={s.currency} />
                    <Line label="Labor" value={laborCost} currency={s.currency} />
                    <Line label="Post-processing" value={number(s.postProcessingFixed, 0)} currency={s.currency} />
                    {shippingCost > 0 && <Line label="Shipping" value={shippingCost} currency={s.currency} />}
                    {packagingCost > 0 && <Line label="Packaging" value={packagingCost} currency={s.currency} />}
                  </>
                )}
                {number(s.marginPercent, 0) > 0 && (
                  <Line label={`Margin (${s.marginPercent}%)`} value={margin} currency={s.currency} />
                )}
                {s.mode === "business" && vatPercent > 0 && (
                  <>
                    <hr className="my-2" />
                    <Line label="Net total" value={netTotal} currency={s.currency} />
                    <Line label={`VAT (${vatPercent}%)`} value={vatAmount} currency={s.currency} />
                  </>
                )}
              </div>
              <hr className="my-4" />
              <div className="flex items-center justify-between">
                <div className="font-semibold">Total</div>
                <div className="text-2xl font-bold">{fmt(total)}</div>
              </div>
            </div>

            {/* Profit Calculator - Business mode only */}
            {s.mode === "business" && (
              <div className={CARD_CLASS}>
                <h2 className="text-lg font-semibold mb-4">Profit Target Calculator</h2>
                <div className="space-y-4">
                  <Field 
                    label="Target profit amount" 
                    suffix={s.currency} 
                    error={errors.targetProfit} 
                    tip="Enter desired profit to calculate required selling price"
                  >
                    <input
                      className={`${INPUT_CLASS} ${errors.targetProfit ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.targetProfit}
                      onChange={(e) => setMany({ targetProfit: parseInput(e.target.value) })}
                    />
                  </Field>
                  {targetProfit > 0 && (
                    <div className="bg-base-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Required selling price:</span>
                        <span className="text-xl font-bold text-primary">{fmt(requiredSellingPrice)}</span>
                      </div>
                      <div className="mt-2 text-sm text-base-content/70">
                        For {fmt(targetProfit)} profit{vatPercent > 0 ? ` (includes ${vatPercent}% VAT)` : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={CARD_CLASS}>
              <h2 className="text-lg font-semibold mb-3">Quick tips</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use slicer estimates for grams and hours, then refine with actuals.</li>
                <li>Track failed prints to tune your failure rate.</li>
                <li>Keep profiles per material brand; spool prices vary a lot.</li>
                <li>Consider separate business overhead (rent, insurance) if applicable.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Toasts */}
        <div className="toast toast-end toast-top">
          {toasts.map((t) => (
            <div key={t.id} className={`alert ${t.kind === 'success' ? 'alert-success' : t.kind === 'error' ? 'alert-error' : 'alert-info'} flex items-center gap-2`}>
              <span>{t.message}</span>
              {t.actionLabel && (
                <button className="btn btn-soft" onClick={() => { t.actionFn && t.actionFn(); removeToast(t.id); }}>{t.actionLabel}</button>
              )}
            </div>
          ))}
        </div>

        <footer className="mt-10 text-center text-xs text-gray-500">
          Built for makers • All calculations client-side • Tailwind-ready
        </footer>
      </div>
    </div>
  );
}
