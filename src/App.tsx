import { type ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Header, 
  FilamentCard, 
  CostBreakdown, 
  ProfitCalculator,
  CostChart,
  Section,
  Field,
  Row,
  Switch,
  Info,
  ShareModal
} from "./components";
import { usePersistentState, useCalculations, useValidation } from "./hooks";
import { number, parseInput, prettyDuration, formatToCurrency, parseUrlData, clearUrlData } from "./utils";
import { 
  presets, 
  POWER_PRESETS, 
  MATERIALS, 
  PRINTER_MATERIAL_OVERRIDES, 
  defaultState, 
  INPUT_CLASS,
  CARD_CLASS
} from "./constants";
import { AppState, Filament, Toast } from "./types";

export default function App() {
  const { t } = useTranslation();
  const [s, set] = usePersistentState<AppState>("print-cost-calc:v1", defaultState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  const calculations = useCalculations(s);
  const errors = useValidation(s);

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
    <div className="min-h-screen bg-base-200 text-base-content transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <Header
          mode={s.mode}
          currency={s.currency}
          isDarkTheme={isDarkTheme}
          onModeToggle={onToggleMode}
          onCurrencyChange={(currency) => setMany({ currency })}
          onThemeChange={onThemeSwapChange}
          onApplyPreset={applyPreset}
          onResetClick={openResetModal}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Filaments */}
            <Section
              title={t('sections.filaments')}
              aside={
                  <Switch
                    checked={s.filamentPricingMode === "length"}
                    onChange={(v) => setMany({ filamentPricingMode: v ? "length" : "grams" })}
                    labelLeft={t('toggles.byGrams')}
                    labelRight={t('toggles.byLength')}
                  />
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
                      {t('buttons.addFilament')}
                  </button>
                </div>
              </div>
              
              <Row>
                <Field label={t('fields.supportWaste')} suffix="%" error={errors.supportWastePercent} tip={t('tooltips.supportWaste')}>
                  <input
                    className={`${INPUT_CLASS} ${errors.supportWastePercent ? 'input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={s.supportWastePercent}
                    onChange={(e) => setMany({ supportWastePercent: parseInput(e.target.value) })}
                  />
                </Field>
                <Field label={t('fields.failureRate')} suffix="%" hint={t('hints.amortizedReprints')} error={errors.failureRatePercent} tip={t('tooltips.failureRate')}>
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
            <Section title={t('sections.energy')}>
              <Row>
                <Field label={t('fields.material')}>
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
                <Field label={t('fields.averagePower')} suffix="W" error={errors.avgPowerW} tip={t('tooltips.averagePower')}>
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
                <Field label={t('fields.printTime')} error={errors.printTimeHours || errors.printTimeMinutes} tip={t('tooltips.printTime')}>
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
                <Field label={t('fields.energyPrice')} suffix={`${s.currency}${t('units.perKWh')}`} error={errors.energyPricePerKWh} tip={t('tooltips.energyPrice')}>
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
              <Section title={t('sections.businessFactors')}>
                <Row>
                  <Field label={t('fields.printerPrice')} error={errors.printerPrice} tip={t('tooltips.printerPrice')}>
                    <input
                      className={`${INPUT_CLASS} ${errors.printerPrice ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.printerPrice}
                      onChange={(e) => setMany({ printerPrice: parseInput(e.target.value) })}
                    />
                  </Field>
                  <Field label={t('fields.lifetime')} suffix={t('units.hours')} error={errors.printerLifetimeHours} tip={t('tooltips.lifetime')}>
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
                  <Field label={t('fields.maintenance')} suffix={`${s.currency}${t('units.perH')}`} error={errors.maintenanceEurPerHour} tip={t('tooltips.maintenance')}>
                    <input
                      className={`${INPUT_CLASS} ${errors.maintenanceEurPerHour ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.maintenanceEurPerHour}
                      onChange={(e) => setMany({ maintenanceEurPerHour: parseInput(e.target.value) })}
                    />
                  </Field>
                </Row>
                  <div className="divider divider-primary"/>
                <Row>
                    <Field label={t('fields.laborRate')} suffix={`${s.currency}${t('units.perH')}`} error={errors.laborRatePerHour} tip={t('tooltips.laborRate')}>
                        <input
                            className={`${INPUT_CLASS} ${errors.laborRatePerHour ? 'input-error' : ''}`}
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={s.laborRatePerHour}
                            onChange={(e) => setMany({ laborRatePerHour: parseInput(e.target.value) })}
                        />
                    </Field>
                  <Field label={t('fields.laborTime')} suffix={t('units.minutes')} error={errors.laborMinutes} tip={t('tooltips.laborTime')}>
                    <input
                      className={`${INPUT_CLASS} ${errors.laborMinutes ? 'input-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={s.laborMinutes}
                      onChange={(e) => setMany({ laborMinutes: parseInput(e.target.value) })}
                    />
                  </Field>
                </Row>
                  <div className="divider divider-primary"/>
                <Row>
                  <Field label={t('fields.preparationTime')} suffix={t('units.minutes')} error={errors.preparationMinutes} tip={t('tooltips.preparationTime')}>
                    <input
                      className={`${INPUT_CLASS} ${errors.preparationMinutes ? 'input-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={s.preparationMinutes}
                      onChange={(e) => setMany({ preparationMinutes: parseInput(e.target.value) })}
                    />
                  </Field>
                  <Field label={t('fields.preparationRate')} suffix={`${s.currency}${t('units.perH')}`} error={errors.preparationHourlyRate} tip={t('tooltips.preparationRate')}>
                    <input
                      className={`${INPUT_CLASS} ${errors.preparationHourlyRate ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.preparationHourlyRate}
                      onChange={(e) => setMany({ preparationHourlyRate: parseInput(e.target.value) })}
                    />
                  </Field>
                </Row>
                <Row>
                  <Field label={t('fields.postProcessingTime')} suffix={t('units.minutes')} error={errors.postProcessingMinutes} tip={t('tooltips.postProcessingTime')}>
                    <input
                      className={`${INPUT_CLASS} ${errors.postProcessingMinutes ? 'input-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={s.postProcessingMinutes}
                      onChange={(e) => setMany({ postProcessingMinutes: parseInput(e.target.value) })}
                    />
                  </Field>
                  <Field label={t('fields.postProcessingRate')} suffix={`${s.currency}${t('units.perH')}`} error={errors.postProcessingHourlyRate} tip={t('tooltips.postProcessingRate')}>
                    <input
                      className={`${INPUT_CLASS} ${errors.postProcessingHourlyRate ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.postProcessingHourlyRate}
                      onChange={(e) => setMany({ postProcessingHourlyRate: parseInput(e.target.value) })}
                    />
                  </Field>
                </Row>
                  <div className="divider divider-primary"/>
                <Row>
                  <Field label={t('fields.shippingCost')} suffix={s.currency} error={errors.shippingCost} tip={t('tooltips.shippingCost')}>
                    <input
                      className={`${INPUT_CLASS} ${errors.shippingCost ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.shippingCost}
                      onChange={(e) => setMany({ shippingCost: parseInput(e.target.value) })}
                    />
                  </Field>
                  <Field label={t('fields.packagingCost')} suffix={s.currency} error={errors.packagingCost} tip={t('tooltips.packagingCost')}>
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
                  <Field label={t('fields.vatTax')} suffix="%" error={errors.vatPercent} tip={t('tooltips.vatTax')}>
                    <input
                      className={`${INPUT_CLASS} ${errors.vatPercent ? 'input-error' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.vatPercent}
                      onChange={(e) => setMany({ vatPercent: parseInput(e.target.value) })}
                    />
                  </Field>
                  <Field label={t('fields.margin')} suffix="%" hint={t('hints.optionalMarkup')} error={errors.marginPercent} tip={t('tooltips.margin')}>
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

            <Section title={t('sections.notes')}>
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
            <CostBreakdown
              mode={s.mode}
              currency={s.currency}
              printTimeHours={s.printTimeHours}
              printTimeMinutes={s.printTimeMinutes}
              materialCost={calculations.materialCost}
              energyCost={calculations.energyCost}
              maintenanceCost={calculations.maintenanceCost}
              depreciationCost={calculations.depreciationCost}
              laborCost={calculations.laborCost}
              preparationCost={calculations.preparationCost}
              postProcessingCost={calculations.postProcessingCost}
              shippingCost={calculations.shippingCost}
              packagingCost={calculations.packagingCost}
              marginPercent={s.marginPercent}
              margin={calculations.margin}
              netTotal={calculations.netTotal}
              vatPercent={calculations.vatPercent}
              vatAmount={calculations.vatAmount}
              total={calculations.total}
              onCopyBreakdown={copyBreakdown}
              onShare={handleShare}
            />

            <CostChart
              mode={s.mode}
              currency={s.currency}
              materialCost={calculations.materialCost}
              energyCost={calculations.energyCost}
              maintenanceCost={calculations.maintenanceCost}
              depreciationCost={calculations.depreciationCost}
              laborCost={calculations.laborCost}
              preparationCost={calculations.preparationCost}
              postProcessingCost={calculations.postProcessingCost}
              shippingCost={calculations.shippingCost}
              packagingCost={calculations.packagingCost}
              vatAmount={calculations.vatAmount}
              margin={calculations.margin}
              total={calculations.total}
            />

            {/* Profit Calculator - Business mode only */}
            {s.mode === "business" && (
              <ProfitCalculator
                targetProfit={s.targetProfit}
                currency={s.currency}
                requiredSellingPrice={calculations.requiredSellingPrice}
                vatPercent={calculations.vatPercent}
                errors={errors}
                onTargetProfitChange={(value) => setMany({ targetProfit: value })}
              />
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

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        appState={s}
        onSuccess={(message) => pushToast('success', message)}
        onError={(message) => pushToast('error', message)}
      />
    </div>
  );
}