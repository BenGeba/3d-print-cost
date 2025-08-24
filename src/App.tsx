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
      } catch (error) {
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
    } catch (e) {
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
                <button className="btn btn-soft" onClick={() => { t.actionFn && t.actionFn(); removeToast(t.id); }}>{t.actionLabel}</button>
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

        <footer className="mt-10 mb-20 lg:mb-0 text-center text-xs text-base-content/60">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <span>Built for makers • All calculations client-side • Tailwind-ready</span>
            <span className="hidden sm:inline">•</span>
            <button
              onClick={() => setImpressumModalOpen(true)}
              className="link link-hover text-xs"
            >
              {t('impressum.title')}
            </button>
            <span className="hidden sm:inline">•</span>
            <div className="relative">
              <VersionDisplay />
            </div>
          </div>
        </footer>

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
      </div>
    </Router>
  );
}