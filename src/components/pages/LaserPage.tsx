import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CostBreakdown, CostChart, Section, Field, Row, Switch } from '../index';
import { INPUT_CLASS, CARD_CLASS } from '../../constants';
import { usePersistentState, useLaserCalculations, useLaserValidation } from '../../hooks';
import { parseInput, number, formatToCurrency, prettyDuration } from '../../utils';
import { LASER_POWER_PRESETS, LASER_MATERIAL_PRESETS, defaultLaserState } from '../../constants/laser';
import type { LaserState } from '../../types/laser-state';
import type { Toast } from '../../types';

export function LaserPage() {
  const { t } = useTranslation();
  const [s, set] = usePersistentState<LaserState>('laser-cost-calc:v1', defaultLaserState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const calculations = useLaserCalculations(s);
  const errors = useLaserValidation(s);

  // --- Helpers ---
  function setMany(patch: Partial<LaserState>): void {
    set({ ...s, ...patch });
  }

  function pushToast(
    kind: Toast['kind'],
    message: string,
    ms = 3500,
    actionLabel?: string,
    actionFn?: () => void
  ): void {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message, actionLabel, actionFn }]);
    if (ms > 0) setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), ms);
  }

  const fmt = (v: number) => {
    const locale =
      (typeof navigator !== 'undefined' && (navigator.languages?.[0] || navigator.language)) ||
      'de-DE';
    return formatToCurrency({ num: v ?? 0, currency: s.currency, decimalPlaces: 2, significantDecimalPlaces: 8, locale });
  };

  // --- Time helpers ---
  function setJobTimeHours(v: string): void {
    const parsed = parseInput(v);
    if (parsed === '') { setMany({ jobTimeHours: '' }); return; }
    setMany({ jobTimeHours: Math.max(0, Math.floor(number(parsed, 0))) });
  }

  function setJobTimeMinutes(v: string): void {
    const parsed = parseInput(v);
    if (parsed === '') { setMany({ jobTimeMinutes: '' }); return; }
    let m = Math.max(0, Math.floor(number(parsed, 0)));
    const extra = Math.floor(m / 60);
    m = m % 60;
    const h = Math.max(0, Math.floor(number(s.jobTimeHours, 0))) + extra;
    setMany({ jobTimeHours: h, jobTimeMinutes: m });
  }

  // --- Preset handlers ---
  function onChangePowerPreset(key: string): void {
    const preset = LASER_POWER_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    if (preset.watts == null) {
      setMany({ powerProfile: 'custom' });
      pushToast('info', t('messages.customPowerProfile'));
    } else {
      setMany({ powerProfile: preset.key, avgPowerW: preset.watts });
      pushToast('info', `${t(preset.labelKey)} → ${preset.watts} W`);
    }
  }

  function onChangeMaterialPreset(key: string): void {
    const preset = LASER_MATERIAL_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    if (key === 'custom') {
      setMany({ materialPreset: 'custom' });
    } else {
      setMany({ materialPreset: preset.key, pricePerBlank: preset.pricePerBlank });
      pushToast('info', `${t(preset.labelKey)} → ${fmt(preset.pricePerBlank)}`);
    }
  }

  // --- Copy breakdown ---
  async function copyBreakdown(): Promise<void> {
    try {
      await new Promise((r) => setTimeout(r, 300));
      const lines: string[] = [];
      lines.push(`Jobdauer: ${prettyDuration(number(s.jobTimeHours, 0), number(s.jobTimeMinutes, 0))}`);
      lines.push(`Material: ${fmt(calculations.materialCost)}`);
      lines.push(`Energie: ${fmt(calculations.energyCost)}`);
      lines.push(`Wartung: ${fmt(calculations.maintenanceCost)}`);
      if (s.mode === 'business') {
        lines.push(`Abschreibung: ${fmt(calculations.depreciationCost)}`);
        lines.push(`Arbeitskosten: ${fmt(calculations.laborCost)}`);
        if (calculations.shippingCost > 0) lines.push(`Versand: ${fmt(calculations.shippingCost)}`);
        if (calculations.packagingCost > 0) lines.push(`Verpackung: ${fmt(calculations.packagingCost)}`);
      }
      if (number(s.marginPercent, 0) > 0) lines.push(`Gewinnspanne (${s.marginPercent}%): ${fmt(calculations.margin)}`);
      if (s.mode === 'business' && calculations.vatPercent > 0) {
        lines.push(`Nettosumme: ${fmt(calculations.netTotal)}`);
        lines.push(`MwSt. (${calculations.vatPercent}%): ${fmt(calculations.vatAmount)}`);
      }
      lines.push(`Gesamt: ${fmt(calculations.total)}`);
      lines.push(`Kosten pro Stück: ${fmt(calculations.costPerItem)}`);
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(lines.join('\n'));
      } else {
        const ta = document.createElement('textarea');
        ta.value = lines.join('\n');
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

  // --- Reset ---
  function confirmReset(): void {
    set(defaultLaserState);
    const dlg = document.getElementById('laserResetModal') as HTMLDialogElement | null;
    dlg?.close();
    pushToast('success', t('messages.settingsReset'));
  }

  // Shared CostBreakdown props
  const breakdownProps = {
    mode: s.mode,
    currency: s.currency,
    printTimeHours: s.jobTimeHours,
    printTimeMinutes: s.jobTimeMinutes,
    timeLabel: t('laser.fields.jobTime'),
    materialCost: calculations.materialCost,
    energyCost: calculations.energyCost,
    maintenanceCost: calculations.maintenanceCost,
    depreciationCost: calculations.depreciationCost,
    laborCost: calculations.laborCost,
    shippingCost: calculations.shippingCost,
    packagingCost: calculations.packagingCost,
    marginPercent: s.marginPercent,
    margin: calculations.margin,
    netTotal: calculations.netTotal,
    vatPercent: calculations.vatPercent,
    vatAmount: calculations.vatAmount,
    total: calculations.total,
    onCopyBreakdown: copyBreakdown,
    onShare: () => {},
    onSave: () => {},
  };

  const chartProps = {
    mode: s.mode,
    currency: s.currency,
    materialCost: calculations.materialCost,
    energyCost: calculations.energyCost,
    maintenanceCost: calculations.maintenanceCost,
    depreciationCost: calculations.depreciationCost,
    laborCost: calculations.laborCost,
    shippingCost: calculations.shippingCost,
    packagingCost: calculations.packagingCost,
    vatAmount: calculations.vatAmount,
    margin: calculations.margin,
    total: calculations.total,
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 pb-20 lg:pb-8">

        {/* Mobile: Breakdown at top */}
        <div className="lg:hidden mb-6">
          <CostBreakdown {...breakdownProps} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input columns */}
          <div className="lg:col-span-2 space-y-6">

            {/* Mode + Currency (mobile only) */}
            <div className="flex items-center justify-between md:hidden">
              <Switch
                checked={s.mode === 'business'}
                onChange={(v) => setMany({ mode: v ? 'business' : 'hobby' })}
                labelLeft={t('app.modes.hobby')}
                labelRight={t('app.modes.business')}
              />
              <select
                className="select select-sm select-bordered w-20"
                value={s.currency}
                onChange={(e) => setMany({ currency: e.target.value })}
              >
                <option>EUR</option>
                <option>USD</option>
                <option>GBP</option>
              </select>
            </div>

            {/* Job Settings */}
            <Section title={t('laser.sections.job')}>
              <Row>
                <Field
                  label={t('laser.fields.jobTime')}
                  error={errors.jobTimeHours || errors.jobTimeMinutes}
                  tip={t('tooltips.printTime')}
                >
                  <div className="flex items-center gap-2">
                    <input
                      className={`${INPUT_CLASS} ${errors.jobTimeHours ? 'input-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={s.jobTimeHours}
                      onChange={(e) => setJobTimeHours(e.target.value)}
                    />
                    <span className="text-sm text-base-content/60">h</span>
                    <input
                      className={`${INPUT_CLASS} ${errors.jobTimeMinutes ? 'input-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={s.jobTimeMinutes}
                      onChange={(e) => setJobTimeMinutes(e.target.value)}
                    />
                    <span className="text-sm text-base-content/60">min</span>
                  </div>
                </Field>
                <Field
                  label={t('laser.fields.itemsPerJob')}
                  error={errors.itemsPerJob}
                  tip={t('laser.tooltips.itemsPerJob')}
                >
                  <input
                    className={`${INPUT_CLASS} ${errors.itemsPerJob ? 'input-error' : ''}`}
                    type="text"
                    inputMode="numeric"
                    placeholder="1"
                    value={s.itemsPerJob}
                    onChange={(e) => setMany({ itemsPerJob: parseInput(e.target.value) })}
                  />
                </Field>
              </Row>
            </Section>

            {/* Material */}
            <Section title={t('laser.sections.material')}>
              <Row>
                <Field label={t('laser.fields.materialPreset')}>
                  <select
                    className="select select-bordered w-full"
                    value={s.materialPreset}
                    onChange={(e) => onChangeMaterialPreset(e.target.value)}
                  >
                    {LASER_MATERIAL_PRESETS.map((p) => (
                      <option key={p.key} value={p.key}>{t(p.labelKey)}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={t('laser.fields.pricePerBlank')}
                  suffix={s.currency}
                  error={errors.pricePerBlank}
                  tip={t('laser.tooltips.pricePerBlank')}
                >
                  <input
                    className={`${INPUT_CLASS} ${errors.pricePerBlank ? 'input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={s.pricePerBlank}
                    onChange={(e) => setMany({ pricePerBlank: parseInput(e.target.value), materialPreset: 'custom' })}
                  />
                </Field>
              </Row>
              <Row>
                <Field
                  label={t('laser.fields.blanksUsed')}
                  error={errors.blanksUsed}
                  tip={t('laser.tooltips.blanksUsed')}
                >
                  <input
                    className={`${INPUT_CLASS} ${errors.blanksUsed ? 'input-error' : ''}`}
                    type="text"
                    inputMode="numeric"
                    placeholder="1"
                    value={s.blanksUsed}
                    onChange={(e) => setMany({ blanksUsed: parseInput(e.target.value) })}
                  />
                </Field>
                <Field
                  label={t('laser.fields.wastePercent')}
                  suffix="%"
                  error={errors.wastePercent}
                  tip={t('laser.tooltips.wastePercent')}
                >
                  <input
                    className={`${INPUT_CLASS} ${errors.wastePercent ? 'input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={s.wastePercent}
                    onChange={(e) => setMany({ wastePercent: parseInput(e.target.value) })}
                  />
                </Field>
              </Row>
            </Section>

            {/* Energy */}
            <Section title={t('sections.energy')}>
              <Row>
                <Field
                  label={t('fields.averagePower')}
                  suffix="W"
                  error={errors.avgPowerW}
                  tip={t('tooltips.averagePower')}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <select
                      className="select select-bordered"
                      value={s.powerProfile}
                      onChange={(e) => onChangePowerPreset(e.target.value)}
                    >
                      {LASER_POWER_PRESETS.map((p) => (
                        <option key={p.key} value={p.key}>{t(p.labelKey)}</option>
                      ))}
                    </select>
                    <input
                      className={`${INPUT_CLASS} ${errors.avgPowerW ? 'input-error' : ''} ${s.powerProfile !== 'custom' ? 'opacity-50' : ''}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={s.avgPowerW}
                      onChange={(e) => setMany({ avgPowerW: parseInput(e.target.value), powerProfile: 'custom' })}
                      disabled={s.powerProfile !== 'custom'}
                    />
                  </div>
                </Field>
                <Field
                  label={t('fields.energyPrice')}
                  suffix={`${s.currency}${t('units.perKWh')}`}
                  error={errors.energyPricePerKwh}
                  tip={t('tooltips.energyPrice')}
                >
                  <input
                    className={`${INPUT_CLASS} ${errors.energyPricePerKwh ? 'input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={s.energyPricePerKwh}
                    onChange={(e) => setMany({ energyPricePerKwh: parseInput(e.target.value) })}
                  />
                </Field>
              </Row>
            </Section>

            {/* Business factors */}
            {s.mode === 'business' && (
              <Section title={t('sections.businessFactors')}>
                <div className="space-y-4">
                  {/* Core costing */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300">
                    <input type="checkbox" defaultChecked />
                    <div className="collapse-title text-lg font-semibold text-primary">
                      {t('business.coreCosting')}
                    </div>
                    <div className="collapse-content">
                      <div className="space-y-4 pt-2">
                        <Row>
                          <Field
                            label={t('laser.fields.machinePrice')}
                            error={errors.machinePrice}
                            tip={t('tooltips.printerPrice')}
                          >
                            <input
                              className={`${INPUT_CLASS} ${errors.machinePrice ? 'input-error' : ''}`}
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={s.machinePrice}
                              onChange={(e) => setMany({ machinePrice: parseInput(e.target.value) })}
                            />
                          </Field>
                          <Field
                            label={t('fields.lifetime')}
                            suffix={t('units.hours')}
                            error={errors.lifetimeHours}
                            tip={t('tooltips.lifetime')}
                          >
                            <input
                              className={`${INPUT_CLASS} ${errors.lifetimeHours ? 'input-error' : ''}`}
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={s.lifetimeHours}
                              onChange={(e) => setMany({ lifetimeHours: parseInput(e.target.value) })}
                            />
                          </Field>
                        </Row>
                        <Row>
                          <Field
                            label={t('fields.maintenance')}
                            suffix={`${s.currency}${t('units.perH')}`}
                            error={errors.maintenancePerHour}
                            tip={t('tooltips.maintenance')}
                          >
                            <input
                              className={`${INPUT_CLASS} ${errors.maintenancePerHour ? 'input-error' : ''}`}
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={s.maintenancePerHour}
                              onChange={(e) => setMany({ maintenancePerHour: parseInput(e.target.value) })}
                            />
                          </Field>
                        </Row>
                      </div>
                    </div>
                  </div>

                  {/* Labor */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300">
                    <input type="checkbox" defaultChecked />
                    <div className="collapse-title text-lg font-semibold text-primary">
                      {t('business.labor')}
                    </div>
                    <div className="collapse-content">
                      <div className="pt-2">
                        <Row>
                          <Field
                            label={t('fields.laborRate')}
                            suffix={`${s.currency}${t('units.perH')}`}
                            error={errors.laborRate}
                            tip={t('tooltips.laborRate')}
                          >
                            <input
                              className={`${INPUT_CLASS} ${errors.laborRate ? 'input-error' : ''}`}
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={s.laborRate}
                              onChange={(e) => setMany({ laborRate: parseInput(e.target.value) })}
                            />
                          </Field>
                          <Field
                            label={t('fields.laborTime')}
                            suffix={t('units.minutes')}
                            error={errors.laborMinutes}
                            tip={t('tooltips.laborTime')}
                          >
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
                      </div>
                    </div>
                  </div>

                  {/* Additional costs */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300">
                    <input type="checkbox" />
                    <div className="collapse-title text-lg font-semibold text-primary">
                      {t('business.additionalCosts')}
                    </div>
                    <div className="collapse-content">
                      <div className="space-y-4 pt-2">
                        <Row>
                          <Field
                            label={t('fields.shippingCost')}
                            suffix={s.currency}
                            error={errors.shippingCost}
                            tip={t('tooltips.shippingCost')}
                          >
                            <input
                              className={`${INPUT_CLASS} ${errors.shippingCost ? 'input-error' : ''}`}
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={s.shippingCost}
                              onChange={(e) => setMany({ shippingCost: parseInput(e.target.value) })}
                            />
                          </Field>
                          <Field
                            label={t('fields.packagingCost')}
                            suffix={s.currency}
                            error={errors.packagingCost}
                            tip={t('tooltips.packagingCost')}
                          >
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
                          <Field
                            label={t('fields.margin')}
                            suffix="%"
                            hint={t('hints.optionalMarkup')}
                            error={errors.marginPercent}
                            tip={t('tooltips.margin')}
                          >
                            <input
                              className={`${INPUT_CLASS} ${errors.marginPercent ? 'input-error' : ''}`}
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={s.marginPercent}
                              onChange={(e) => setMany({ marginPercent: parseInput(e.target.value) })}
                            />
                          </Field>
                          <Field
                            label={t('fields.vatTax')}
                            suffix="%"
                            error={errors.vatPercent}
                            tip={t('tooltips.vatTax')}
                          >
                            <input
                              className={`${INPUT_CLASS} ${errors.vatPercent ? 'input-error' : ''}`}
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={s.vatPercent}
                              onChange={(e) => setMany({ vatPercent: parseInput(e.target.value) })}
                            />
                          </Field>
                        </Row>
                      </div>
                    </div>
                  </div>
                </div>
              </Section>
            )}
          </div>

          {/* Right: Breakdown + Cost per item + Chart */}
          <div className="hidden lg:flex lg:flex-col gap-6">
            <CostBreakdown {...breakdownProps} />

            {/* Cost per item highlight */}
            <div className={CARD_CLASS}>
              <p className="text-sm text-base-content/60 mb-1">{t('laser.fields.costPerItem')}</p>
              <p className="text-3xl font-bold text-primary">{fmt(calculations.costPerItem)}</p>
              <p className="text-xs text-base-content/50 mt-1">
                {calculations.itemsPerJob} {t('laser.fields.itemsPerJob').toLowerCase()}
              </p>
            </div>

            <CostChart {...chartProps} />
          </div>
        </div>

        {/* Mobile: Cost per item + Chart below inputs */}
        <div className="lg:hidden mt-6 space-y-4">
          <div className={CARD_CLASS}>
            <p className="text-sm text-base-content/60 mb-1">{t('laser.fields.costPerItem')}</p>
            <p className="text-3xl font-bold text-primary">{fmt(calculations.costPerItem)}</p>
            <p className="text-xs text-base-content/50 mt-1">
              {calculations.itemsPerJob} {t('laser.fields.itemsPerJob').toLowerCase()}
            </p>
          </div>
          <CostChart {...chartProps} />
        </div>
      </div>

      {/* Reset modal */}
      <dialog id="laserResetModal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">{t('laser.resetTitle')}</h3>
          <p className="py-2">{t('laser.resetDescription')}</p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2">
              <button className="btn btn-soft">{t('buttons.cancel')}</button>
              <button type="button" className="btn btn-soft btn-error" onClick={confirmReset}>
                {t('buttons.resetSettings')}
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* Reset FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => (document.getElementById('laserResetModal') as HTMLDialogElement)?.showModal()}
          className="btn btn-circle btn-error shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          title={t('buttons.resetSettings')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Toasts */}
      <div className="toast toast-end toast-top">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`alert ${toast.kind === 'success' ? 'alert-success' : toast.kind === 'error' ? 'alert-error' : 'alert-info'} flex items-center gap-2`}
          >
            <span>{toast.message}</span>
            {toast.actionLabel && (
              <button
                className="btn btn-soft btn-sm"
                onClick={() => { toast.actionFn?.(); setToasts((p) => p.filter((t) => t.id !== toast.id)); }}
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
