import { ChangeEvent, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Header, 
  CalculatorPage,
  MaterialProfilesPage,
  ShareModal,
  ImpressumModal,
  VersionDisplay,
  PWAUpdateNotification
} from "./components";
import { usePersistentState, useCalculations, useValidation, useMaterialProfiles } from "./hooks";
import { number, parseInput, prettyDuration, formatToCurrency, parseUrlData, clearUrlData } from "./utils";
import { 
  presets, 
  POWER_PRESETS, 
  MATERIALS, 
  PRINTER_MATERIAL_OVERRIDES, 
  defaultState
} from "./constants";
import { AppState, Filament, Toast, MaterialProfile } from "./types";
import InstallPWAButton from "./components/InstallPWAButton.tsx";

export default function App() {
  const { t } = useTranslation();
  const [s, set] = usePersistentState<AppState>("print-cost-calc:v1", defaultState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [impressumModalOpen, setImpressumModalOpen] = useState(false);
  
  // Get base path from Vite's import.meta.env.BASE_URL
  const basePath = import.meta.env.BASE_URL;
  
  const calculations = useCalculations(s);
  const errors = useValidation(s);
  const materialProfiles = useMaterialProfiles();

  // Check for URL parameters on app startup
  useEffect(() => {
    const urlData = parseUrlData();
    if (urlData) {
      try {
        set(urlData);
        clearUrlData();
        pushToast('success', t('messages.calculationLoaded'), 4000);
      } catch {
        clearUrlData();
        pushToast('error', t('messages.errorLoadingCalculation'), 5000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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

  // copy breakdown to clipboard + toast
  async function copyBreakdown(): Promise<void> {
    try {
      // Add a small delay to show the loading state for user feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const lines: string[] = [];
      lines.push(`Print time: ${prettyDuration(number(s.printTimeHours,0), number(s.printTimeMinutes,0))}`);
      lines.push(`Material: ${fmt(calculations.materialCost)}`);
      lines.push(`Energy: ${fmt(calculations.energyCost)}`);
      lines.push(`Maintenance: ${fmt(calculations.maintenanceCost)}`);
      if (s.mode === 'business') {
        lines.push(`Depreciation: ${fmt(calculations.depreciationCost)}`);
        lines.push(`Labor: ${fmt(calculations.laborCost)}`);
        if (calculations.preparationCost > 0) lines.push(`Preparation: ${fmt(calculations.preparationCost)}`);
        if (calculations.postProcessingCost > 0) lines.push(`Post-processing: ${fmt(calculations.postProcessingCost)}`);
        if (calculations.shippingCost > 0) lines.push(`Shipping: ${fmt(calculations.shippingCost)}`);
        if (calculations.packagingCost > 0) lines.push(`Packaging: ${fmt(calculations.packagingCost)}`);
      }
      if (number(s.marginPercent,0) > 0) {
        lines.push(`Margin (${s.marginPercent}%): ${fmt(calculations.margin)}`);
      }
      if (s.mode === 'business' && calculations.vatPercent > 0) {
        lines.push(`Net total: ${fmt(calculations.netTotal)}`);
        lines.push(`VAT (${calculations.vatPercent}%): ${fmt(calculations.vatAmount)}`);
      }
      lines.push(`Total: ${fmt(calculations.total)}`);
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
      pushToast('success', t('messages.breakdownCopied'));
    } catch {
      pushToast('error', t('messages.copyFailed'));
    }
  }

  // Handle share modal opening
  function handleShare(): void {
    setShareModalOpen(true);
  }

  // Undo-able mode toggle
  function onToggleMode(v: boolean): void {
    const prev = s.mode;
    const next = v ? 'business' : 'hobby';
    if (prev === next) return;
    setMany({ mode: next });
    pushToast('info', t('messages.modeChanged', { mode: t(`app.modes.${next}`) }), 5000, t('messages.undo'), () => setMany({ mode: prev }));
  }

  // Margin change with Undo
  function onChangeMargin(value: string): void {
    const prev = s.marginPercent;
    const next = parseInput(value);
    setMany({ marginPercent: next });
    if (next !== "" && next !== prev) {
      pushToast('info', t('messages.marginChanged', { margin: number(next, 0) }), 5000, t('messages.undo'), () => setMany({ marginPercent: prev }));
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
      pushToast('error', t('messages.cannotRemoveLastFilament'));
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

  // Material Profile functions
  function loadMaterialProfile(profile: MaterialProfile, filamentId?: string): void {
    if (filamentId) {
      // Apply to specific filament
      updateFilament(filamentId, {
        name: profile.name,
        pricePerKg: profile.pricePerKg,
        density: profile.density,
        diameter: profile.diameter,
        material: profile.materialType
      });
      pushToast('success', `Profil "${profile.name}" zu Filament geladen`);
    } else {
      // Apply to all filaments (fallback)
      const updatedFilaments = s.filaments.map(f => ({
        ...f,
        name: profile.name,
        pricePerKg: profile.pricePerKg,
        density: profile.density,
        diameter: profile.diameter,
        material: profile.materialType
      }));
      setMany({ filaments: updatedFilaments });
      pushToast('success', `Profil "${profile.name}" zu allen Filamenten geladen`);
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
    pushToast('success', t('messages.settingsReset'));
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
      pushToast('info', t('messages.customPowerProfile'));
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
    // Apply theme on mount and when it changes with smooth transition
    const theme = isDarkTheme ? 'dracula' : 'nord';
    const root = document.documentElement;
    
    // Add transition class before theme change
    root.classList.add('theme-transitioning');
    
    // Apply new theme
    root.setAttribute('data-theme', theme);
    
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 300);
    
    // Save theme preference to localStorage
    localStorage.setItem('print-cost-calc:theme', isDarkTheme ? 'dark' : 'light');
    }, [isDarkTheme]);

  function onThemeSwapChange(e: ChangeEvent<HTMLInputElement>): void {
    const newTheme = e.target.checked;
    setIsDarkTheme(newTheme);
    pushToast('info', t('messages.themeChanged', { theme: t(`messages.${newTheme ? 'dark' : 'light'}`) }), 2000);
  }

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

  // ---------- UI ----------
  return (
    <Router basename={basePath}>
      <div className="min-h-screen bg-base-200 text-base-content transition-colors">
        <Header
          mode={s.mode}
          currency={s.currency}
          isDarkTheme={isDarkTheme}
          onModeToggle={onToggleMode}
          onCurrencyChange={(currency) => setMany({ currency })}
          onThemeChange={onThemeSwapChange}
        />


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

        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={
              <CalculatorPage
                s={s}
                setMany={setMany}
                calculations={calculations}
                errors={errors}
                materialProfiles={materialProfiles}
                updateFilament={updateFilament}
                addFilament={addFilament}
                removeFilament={removeFilament}
                applyPreset={applyPreset}
                loadMaterialProfile={loadMaterialProfile}
                copyBreakdown={copyBreakdown}
                handleShare={handleShare}
                onChangeMargin={onChangeMargin}
                setTimeHours={setTimeHours}
                setTimeMinutes={setTimeMinutes}
                onChangePowerPreset={onChangePowerPreset}
                onChangeMaterial={onChangeMaterial}
                pushToast={pushToast}
              />
            }
          />
          <Route
            path="/profiles"
            element={
              <MaterialProfilesPage
                materialProfiles={materialProfiles}
                onLoadProfile={loadMaterialProfile}
                pushToast={pushToast}
              />
            }
          />
        </Routes>

        {/* Toasts */}
        <div className="toast toast-end toast-top">
          {toasts.map((t) => (
            <div key={t.id} className={`alert ${t.kind === 'success' ? 'alert-success' : t.kind === 'error' ? 'alert-error' : 'alert-info'} flex items-center gap-2`}>
              <span>{t.message}</span>
              {t.actionLabel && (
                <button className="btn btn-soft" onClick={() => { t.actionFn?.(); removeToast(t.id); }}>{t.actionLabel}</button>
              )}
            </div>
          ))}
        </div>

          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
              <button
                  onClick={openResetModal}
                  className="btn btn-circle btn-error shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  title={t('buttons.resetSettings')}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
              </button>

              <div className="transform hover:scale-105 transition-all duration-200">
                  <InstallPWAButton />
              </div>
          </div>

        {/* Share Modal */}
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          appState={s}
          onSuccess={(message) => pushToast('success', message)}
          onError={(message) => pushToast('error', message)}
        />

        {/* Impressum Modal */}
        <ImpressumModal
          isOpen={impressumModalOpen}
          onClose={() => setImpressumModalOpen(false)}
        />

        {/* PWA Update Notification */}
        <PWAUpdateNotification />
          <footer className="footer footer-horizontal footer-center bg-primary text-primary-content p-10">
              <aside>
                  <svg 
                      width="50" 
                      height="50" 
                      viewBox="0 0 1024 1024"
                      className="inline-block"
                      fill="black"
                  >
                      <path d="M498 65.7c-116.4 3.7-225.5 50.8-307.5 132.8C116.3 272.8 70.8 367.3 58.4 473c-3.5 30.7-2.9 74.9 1.7 109.4 14.2 107 66.2 205.7 146 277 73.1 65.3 157.2 103 256.9 115.3 20.3 2.4 74.9 2.5 96.8 0 137.5-15.5 256.8-88 333-202.2 65.6-98.4 89.8-221.2 66.6-338.5-25.9-131.2-107.5-243.9-224.9-310.5-47.4-26.9-107.5-47-161-53.9-23-2.9-55.1-4.6-75.5-3.9m46.5 48.3c129.8 10.8 245.8 81.6 314.6 192 32.4 51.8 52.2 109 59.5 171.5 2.2 18.7 2.5 66.7.6 85.5-19.1 182.8-157 329.9-338.4 361-29 4.9-67 7-93.3 5.1-88.6-6.4-164.8-35.8-232.7-89.9-17.1-13.6-48.4-44.9-62.2-62.2-36.6-45.9-62.4-97.3-76.6-152.5-10-38.8-13.7-71.8-12.7-112.5 1.1-42.5 7.1-77.1 20.6-118 20.8-63.1 53.3-115.5 101-163 69.6-69.3 157.9-109.2 259.6-117.3 9.8-.8 49.1-.6 60 .3M525 276.1v77.4l-6.1 10.8c-3.3 5.9-6.4 10.7-6.9 10.7-.4 0-3.4-4.6-6.6-10.3l-5.9-10.2-.3-77.3c-.2-42.4-.6-77.2-.9-77.2-.4 0-3.6 1.7-7.2 3.9C328.6 299.4 224 361.7 224 362.9c0 .3 4.5 3.3 10 6.6s10 6.2 10 6.5-4.5 3.2-10 6.4c-5.5 3.3-10 6.2-10 6.5s6.1 4.2 13.5 8.6 13.5 8.2 13.5 8.6c0 .3-5.9 4-13.1 8.3-7.1 4.2-12.9 8.2-12.7 8.8s5.7 4.3 12.1 8.2c6.4 4 12.2 7.7 12.7 8.2.8.8-2.7 3.4-11.9 8.9-7.2 4.2-13.1 8.1-13.1 8.5 0 .5 5.3 4.1 11.8 8.1 6.4 3.9 12.3 7.8 13.1 8.4 1.1 1-1.1 2.7-11.8 9.1-7.2 4.4-13 8.3-12.8 8.8.2.6 5.8 4.4 12.5 8.6 6.6 4.1 12.3 7.8 12.6 8.1.4.3-5.2 4.1-12.4 8.5-7.2 4.3-12.9 8.3-12.7 8.9.2.5 5.7 4.3 12.2 8.2 6.6 4 12.2 7.6 12.6 8 .5.5-5 4.4-12.2 8.8-7.1 4.3-12.9 8.3-12.9 8.7s5.8 4.2 13 8.5c7.1 4.3 12.9 8 13 8.3 0 .3-5.9 4.1-13 8.5-7.2 4.4-13 8.2-13 8.6s5.8 4.2 13 8.5c7.1 4.4 13 8.1 13 8.4s-5.9 4.1-13 8.5c-7.2 4.3-13 8.2-13 8.5 0 .5 12.4 8.4 21.3 13.5 2.6 1.5 4.7 3 4.7 3.3 0 .4-5.9 4.3-13 8.6-7.2 4.4-13 8.3-13 8.7 0 .7 39.8 24.4 163 97.1 91 53.7 121.7 71.7 123.2 72.3 1.3.5 10.6-4.7 52.8-29.7 13.5-7.9 27.2-16 30.5-18 3.3-1.9 24.9-14.6 48-28.3 23.1-13.6 53.5-31.5 67.5-39.8 58.6-34.6 89-52.9 89-53.7 0-.5-5.3-4.1-11.7-8.1-6.5-3.9-12.4-7.7-13.1-8.4-1.1-1 1.2-2.7 11.7-8.9 7.2-4.2 13.1-8 13.1-8.5s-5.6-4.4-12.5-8.6c-6.9-4.3-12.8-8.1-13-8.5s5.4-4.2 12.6-8.4 12.9-8.2 12.7-8.8-6.1-4.6-13.1-8.7c-6.9-4.2-12.6-7.8-12.6-8.1s6-4.1 13.4-8.5 13.5-8.2 13.5-8.5-4.4-3.2-9.8-6.4c-5.3-3.3-11.4-7.1-13.6-8.4l-3.8-2.4 12.2-7.3c6.7-4 12.7-7.8 13.3-8.4 1.4-1.4.5-2-14-10.7-6.2-3.7-11-7-10.8-7.4.2-.3 6.3-4.2 13.5-8.5 11.9-7.2 12.9-8.1 11.3-9.3-1-.7-7.1-4.5-13.5-8.4-6.5-3.9-11.6-7.3-11.4-7.7.3-.4 6.3-4.2 13.5-8.5s13.1-8.1 13.1-8.5-6.1-4.3-13.6-8.8l-13.6-8.2 5.4-3.4c2.9-1.8 9-5.6 13.6-8.3 4.5-2.7 8.2-5.1 8.2-5.4s-6.1-4.1-13.5-8.5c-7.4-4.3-13.5-8.2-13.5-8.5s6.1-4.2 13.5-8.5c7.4-4.4 13.5-8.2 13.5-8.6s-4.5-3.3-10-6.5c-5.5-3.3-10-6.2-10-6.5 0-.4 4.5-3.3 10-6.4s10-6.1 10-6.5c0-.9-24.1-15.5-84.5-51.2-69.4-41-186-110.1-188.2-111.6l-2.3-1.4zm-27.1 104.5c7.1 12 13.5 21.9 14.1 21.9 1.2 0 6.4-8.1 19.6-31l6.9-11.9.5-67.8.5-67.7 13 7.8c19.9 12 179.2 106.2 209.8 124 5.9 3.5 10.7 6.6 10.7 7 0 .3-5.1 3.6-11.2 7.3-6.2 3.7-65 38.4-130.6 77.1l-119.3 70.5-27.2-16.2c-14.9-9-46.3-27.5-69.7-41.3-126-74-164-96.6-164-97.3 0-.5 4.6-3.5 10.3-6.7 5.6-3.3 32.3-19 59.2-35 27-16 74.9-44.3 106.5-63l57.5-34 .3 67.2.2 67.2zm274.1 7.9c.5.6-6.4 5.2-17.9 11.9-27.3 16-190.8 112.6-217.8 128.7-12.7 7.7-23.5 13.9-24.1 13.9-.5 0-13.7-7.6-29.3-16.9-26.1-15.4-45.2-26.7-147.4-87.1-19.2-11.4-44.4-26.2-56-33l-24.9-14.7-3.8-2.5 3.1-1.9c1.7-1 3.6-1.9 4.1-1.9 1 0 6.1 3 93.5 54.7 76.8 45.4 158.3 93.3 159.7 93.8.8.3 20.9-11 44.8-25.1s62.2-36.7 85-50.2c60.5-35.7 88.3-52.2 107.5-63.8l17-10.2 2.8 1.6c1.6.9 3.2 2.1 3.7 2.7m-482.8 40.1c53.1 31.1 88 51.7 117.8 69.4 31.7 18.8 62.9 37.3 90.3 53.4l14.8 8.7 29.2-17.2c16.1-9.5 37.3-22 47.2-27.9 103.2-61.3 169.2-100 170.4-100 1.1 0 12.9 6.9 13.5 7.9.2.3-20.1 12.8-45.2 27.6-74.9 44.2-129.2 76.3-172.8 102.1-22.6 13.4-41.6 24.4-42.3 24.4s-14.3-7.8-30.4-17.4c-16.1-9.5-54.6-32.3-85.7-50.6s-63.5-37.4-72-42.5-28.2-16.7-43.7-26c-15.6-9.2-28.3-17.1-28.3-17.5 0-.9 11.8-8 13.2-8 .4 0 11.2 6.1 24 13.6m23.1 47.5c25.4 15 63.3 37.3 84.2 49.7s55.4 32.8 76.7 45.4l38.8 22.9 14.2-8.4c7.9-4.7 32.1-18.9 53.8-31.7s51-30.1 65-38.5c47.2-28.1 113-66.5 113.9-66.5 1.2 0 12.8 6.8 13.5 7.8.3.5-15.1 10-34.2 21.2s-56.7 33.4-83.7 49.4C565.8 579.8 512.7 611 511.9 611c-.3 0-11.2-6.2-24-13.9-12.9-7.6-42.7-25.2-66.4-39.1-23.6-14-60.5-35.8-82-48.5-21.4-12.7-50.1-29.6-63.7-37.5-13.5-8-24.4-14.8-24.2-15.2.6-.9 12.6-7.8 13.7-7.8.4 0 21.5 12.2 47 27.1m-18.5 23.1c15.3 8.8 38.1 22.3 50.7 29.8 43.4 25.8 121.9 72.1 153.5 90.5 7.4 4.3 13.9 7.8 14.5 7.8.9 0 54.3-31.3 119-69.8 16-9.5 51-30.2 78-46l48.9-28.8 5.2 2.8c2.8 1.5 6 3.5 7.2 4.4 2 1.5-3 4.6-127.5 78.1-71.2 42.1-130.1 76.6-130.8 76.8-.8.2-3.1-.8-5.2-2.2-2.1-1.3-20.9-12.5-41.8-24.9-136.8-80.7-200-118-206.7-121.9l-7.8-4.4 7.3-4.2c3.9-2.3 7.4-4.2 7.5-4.2.2 0 12.8 7.3 28 16.2m474 22.5 5.4 3.5-9.9 5.7c-5.4 3.1-30.9 18.2-56.8 33.6-25.8 15.3-70.6 41.8-99.5 58.8s-61.9 36.6-73.4 43.4c-11.6 6.8-21.6 12.1-22.4 11.8s-21-12.1-45-26.4c-82.8-49-200.4-118.2-211.8-124.7l-3.6-2 7.1-4.3c3.9-2.4 7.7-4.1 8.5-3.8 1.6.7 26.7 15.3 84.6 49.5 22.8 13.5 68.5 40.5 101.4 59.9l59.9 35.3 19.1-11.4 182.6-108c19.5-11.5 37.5-22.1 40-23.6 5-3 4.7-3.1 13.8 2.7m-1.6 32.8 7 4.6-12.3 7.3c-6.8 4-41 24.2-75.9 44.8s-87.1 51.4-116 68.5-53.5 31.5-54.7 32.2c-2.4 1.2-1.2 1.9-155.3-89.1-34.9-20.7-73.4-43.3-85.5-50.3-12.1-7.1-22.1-12.9-22.3-13.1-.2-.1 2.9-2.1 6.8-4.5 6.2-3.6 7.4-4 9.6-3.1 2.5 1.2 44.8 26 105.4 61.9 37.8 22.4 98.8 58.3 123.5 72.8 8.3 4.9 15.5 8.8 16 8.8.6 0 8.9-4.7 18.5-10.5s27.9-16.6 40.5-24A41902 41902 0 0 0 758.8 550c.2 0 3.5 2 7.4 4.5m-.4 33.9c3.4 2.1 6.2 4.2 6.2 4.7 0 .4-8 5.4-17.7 11.1-22.1 13-60.4 35.6-193.8 114.5-24.2 14.3-45 26.5-46.2 27.2-2.1 1-5.6-.8-35.5-18.5-40.9-24.2-48.7-28.8-126.8-74.9-34.4-20.2-69.5-40.9-78-46s-17-10-18.7-10.9c-1.8-.9-3.3-2-3.3-2.4s3-2.4 6.7-4.6c6.4-3.7 6.7-3.8 9.8-2.3 3.2 1.5 34.7 20 144.5 84.9 89.7 52.9 98.4 58.1 99.5 58 .6 0 17.7-9.8 38-21.9 115.4-68.6 208.1-123.2 208.5-123 .3.1 3.4 2 6.8 4.1m0 34.1c3.4 2.1 6.2 4.1 6.2 4.4 0 .7-16.7 10.7-72.2 43.4-20 11.8-62.4 36.8-94.3 55.7s-65.9 39-75.6 44.7L512.3 781l-18.4-10.8C381.9 704 280.2 644 264.3 634.7c-6.8-4-12.3-7.4-12.3-7.7 0-.8 12.4-8 13.8-8 1.1 0 39.5 22.3 100 58.1 137.1 81.2 145.5 86.1 147.3 85.6.9-.2 35.3-20.4 76.5-44.7 41.2-24.4 84.6-50 96.4-57l46.9-27.8c14-8.3 25.7-15 26-14.8s3.4 2 6.9 4.1m0 34c3.4 2.1 6.2 4.1 6.2 4.4 0 .4-15 9.5-33.2 20.3C674 719.4 595 766 553.8 790.3L512 814.9l-6.2-3.8c-3.5-2.1-22.9-13.6-43.3-25.6-42.9-25.2-141.8-83.6-181-106.8-14.8-8.8-27.6-16.5-28.3-17.1-.9-.9.2-2 5.1-4.9 3.5-2 6.9-3.7 7.6-3.7 1.4 0 79.9 46 224.6 131.7 11.5 6.8 21.6 12.2 22.5 12 .8-.2 20.9-11.9 44.5-25.9 23.7-14 71.1-42.1 105.5-62.3s69.9-41.2 79-46.6c9-5.4 16.7-9.6 17-9.5.3.2 3.3 2 6.8 4.1" />
                  </svg>
                  <p className="font-bold">
                      3D Print Cost Calculator
                      <br />
                      Built for makers • All calculations client-side
                  </p>
                  <p>Copyright © {new Date().getFullYear()} - All right reserved - <VersionDisplay /></p>
                  <button
                      onClick={() => setImpressumModalOpen(true)}
                      className="link link-hover text-xs"
                  >
                      {t('impressum.title')}
                  </button>
              </aside>
              <nav>
                  <div className="grid grid-flow-col gap-4">
                      <a href="https://github.com/bengeba/3d-print-cost" className="link link-hover">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                              <path d="M10 0c5.523 0 10 4.59 10 10.253 0 4.529-2.862 8.371-6.833 9.728-.507.101-.687-.219-.687-.492 0-.338.012-1.442.012-2.814 0-.956-.32-1.58-.679-1.898 2.227-.254 4.567-1.121 4.567-5.059 0-1.12-.388-2.034-1.03-2.752.104-.259.447-1.302-.098-2.714 0 0-.838-.275-2.747 1.051A9.396 9.396 0 0 0 10 4.958a9.375 9.375 0 0 0-2.503.345C5.586 3.977 4.746 4.252 4.746 4.252c-.543 1.412-.2 2.455-.097 2.714-.639.718-1.03 1.632-1.03 2.752 0 3.928 2.335 4.808 4.556 5.067-.286.256-.545.708-.635 1.371-.57.262-2.018.715-2.91-.852 0 0-.529-.985-1.533-1.057 0 0-.975-.013-.068.623 0 0 .655.315 1.11 1.5 0 0 .587 1.83 3.369 1.21.005.857.014 1.665.014 1.909 0 .271-.184.588-.683.493C2.865 18.627 0 14.783 0 10.253 0 4.59 4.478 0 10 0"/>
                          </svg>
                      </a>
                  </div>
              </nav>
          </footer>
      </div>
    </Router>
  );
}