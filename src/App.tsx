import React, {type ChangeEvent, useEffect, useMemo, useState} from "react";
import InstallPWAButton from "./components/InstallPWAButton";
import { formatToCurrency } from "./utils/formatnumbers";

// Type definitions
interface AppState {
  mode: "hobby" | "business";
  filamentPricingMode: "grams" | "length";
  pricePerKg: number | string;
  filamentUsedGrams: number | string;
  filamentDiameter: number | string;
  filamentLengthMeters: number | string;
  densityGcm3: number | string;
  supportWastePercent: number | string;
  failureRatePercent: number | string;
  powerProfile: string;
  material: string;
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

type ValidationErrors = Partial<Record<keyof AppState, string>>;

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
  pricePerKg: 25,
  filamentUsedGrams: 28,
  filamentDiameter: 1.75,
  filamentLengthMeters: 0,
  densityGcm3: 1.24,
  supportWastePercent: 10,
  failureRatePercent: 5,
  powerProfile: "custom",
  material: "PLA",
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
      return raw ? { ...initial, ...JSON.parse(raw) } : initial;
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
    significantDecimalPlaces: 8,
    locale: browserLocale
  });
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium">{formatted}</span>
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

  // Derived: filament grams
  const filamentUsedGrams = useMemo(() => {
    if (s.filamentPricingMode === "grams") return number(s.filamentUsedGrams, 0);
    // Convert from length + diameter + density → grams
    const d = number(s.filamentDiameter, 1.75) / 10; // mm → cm
    const r = d / 2;
    const area = Math.PI * r * r; // cm^2
    const lengthCm = number(s.filamentLengthMeters, 0) * 100;
    const volumeCm3 = area * lengthCm; // cm^3
    const density = number(s.densityGcm3, 1.24); // g/cm^3
    return volumeCm3 * density; // grams
  }, [s.filamentPricingMode, s.filamentUsedGrams, s.filamentDiameter, s.filamentLengthMeters, s.densityGcm3]);

  const materialWasteFactor = 1 + number(s.supportWastePercent, 0) / 100;
  const failureFactor = 1 + number(s.failureRatePercent, 0) / 100;

  const materialCost = useMemo(() => {
    const gramsWithWaste = filamentUsedGrams * materialWasteFactor;
    const kg = gramsWithWaste / 1000;
    const base = kg * number(s.pricePerKg, 0);
    return base * failureFactor;
  }, [filamentUsedGrams, materialWasteFactor, failureFactor, s.pricePerKg]);

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
  const margin = baseSubtotal * (number(s.marginPercent, 0) / 100);
  const total = baseSubtotal + margin;

  const fmt = (v: number): string => `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${s.currency}`;

  // --- Inline validation ---
  const errors = useMemo<ValidationErrors>(() => {
    const e: ValidationErrors = {};
    // Allow empty fields, only validate if there's a value
    if (s.pricePerKg !== "" && number(s.pricePerKg) < 0) e.pricePerKg = "Must be ≥ 0";
    if (s.filamentPricingMode === 'grams') {
      if (s.filamentUsedGrams !== "" && number(s.filamentUsedGrams) < 0) e.filamentUsedGrams = "Must be ≥ 0";
    } else {
      if (s.filamentLengthMeters !== "" && number(s.filamentLengthMeters) < 0) e.filamentLengthMeters = "Must be ≥ 0";
      if (s.filamentDiameter !== "" && number(s.filamentDiameter) <= 0) e.filamentDiameter = "Must be > 0";
      if (s.densityGcm3 !== "" && number(s.densityGcm3) <= 0) e.densityGcm3 = "Must be > 0";
    }
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
      }
      if (number(s.marginPercent,0) > 0) {
        lines.push(`Margin (${s.marginPercent}%): ${fmt(margin)}`);
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

  function applyPreset(name: string): void {
    const p = presets[name];
    if (p) {
      setMany(p);
      pushToast('info', `${name} preset applied`);
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
            {/* Filament */}
            <Section
              title="Filament"
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
              <Row>
                <Field label="Price per kg" error={errors.pricePerKg} tip="Material price per kilogram">
                  <input
                    className={`${INPUT_CLASS} ${errors.pricePerKg ? 'input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={s.pricePerKg}
                    onChange={(e) => setMany({ pricePerKg: parseInput(e.target.value) })}
                  />
                </Field>
                {s.filamentPricingMode === "grams" ? (
                  <Field label="Filament used" suffix="grams" error={errors.filamentUsedGrams} tip="Use slicer estimate or measured weight">
                    <input
                      className={`${INPUT_CLASS} ${errors.filamentUsedGrams ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.filamentUsedGrams}
                      onChange={(e) => setMany({ filamentUsedGrams: parseInput(e.target.value) })}
                    />
                  </Field>
                ) : (
                  <>
                    <Field label="Filament length" suffix="meters" error={errors.filamentLengthMeters} tip="From slicer or spool meter counter">
                      <input
                        className={`${INPUT_CLASS} ${errors.filamentLengthMeters ? 'input-error' : ''}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={s.filamentLengthMeters}
                        onChange={(e) => setMany({ filamentLengthMeters: parseInput(e.target.value) })}
                      />
                    </Field>
                    <Field label="Diameter" suffix="mm" error={errors.filamentDiameter} tip="Typical: 1.75 mm or 2.85 mm">
                      <input
                        className={`${INPUT_CLASS} ${errors.filamentDiameter ? 'input-error' : ''}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="1.75"
                        value={s.filamentDiameter}
                        onChange={(e) => setMany({ filamentDiameter: parseInput(e.target.value) })}
                      />
                    </Field>
                    <Field label="Density" suffix="g/cm³" hint="PLA≈1.24, PETG≈1.27, ABS≈1.04, TPU≈1.21" error={errors.densityGcm3} tip="Material density for length→grams conversion">
                      <input
                        className={`${INPUT_CLASS} ${errors.densityGcm3 ? 'input-error' : ''}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="1.24"
                        value={s.densityGcm3}
                        onChange={(e) => setMany({ densityGcm3: parseInput(e.target.value) })}
                      />
                    </Field>
                  </>
                )}
              </Row>

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
                  </>
                )}
                {number(s.marginPercent, 0) > 0 && (
                  <Line label={`Margin (${s.marginPercent}%)`} value={margin} currency={s.currency} />
                )}
              </div>
              <hr className="my-4" />
              <div className="flex items-center justify-between">
                <div className="font-semibold">Total</div>
                <div className="text-2xl font-bold">{fmt(total)}</div>
              </div>
            </div>

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
