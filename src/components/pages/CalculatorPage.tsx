import { useTranslation } from "react-i18next";
import { 
  FilamentCard, 
  CostBreakdown, 
  ProfitCalculator,
  CostChart,
  Section,
  Field,
  Row,
  Switch,
  Info
} from "../index";
import { 
  presets, 
  POWER_PRESETS, 
  MATERIALS, 
  PRINTER_MATERIAL_OVERRIDES, 
  INPUT_CLASS,
  CARD_CLASS
} from "../../constants";
import { AppState, Filament, ValidationErrors, MaterialProfile } from "../../types";
import { number, parseInput, prettyDuration } from "../../utils";

interface CalculatorPageProps {
  s: AppState;
  setMany: (patch: Partial<AppState>) => void;
  calculations: any;
  errors: ValidationErrors;
  materialProfiles: {
    profiles: MaterialProfile[];
    addProfile: (profileData: Omit<MaterialProfile, 'id' | 'createdAt' | 'updatedAt' | 'costPerGram'>) => MaterialProfile;
    updateProfile: (id: string, updates: Partial<MaterialProfile>) => void;
    deleteProfile: (id: string) => void;
    getProfile: (id: string) => MaterialProfile | undefined;
    duplicateProfile: (id: string, newName?: string) => MaterialProfile | null;
  };
  updateFilament: (id: string, updates: Partial<Filament>) => void;
  addFilament: () => void;
  removeFilament: (id: string) => void;
  applyPreset: (name: string, filamentId?: string) => void;
  loadMaterialProfile: (profile: MaterialProfile, filamentId?: string) => void;
  copyBreakdown: () => Promise<void>;
  handleShare: () => void;
  onChangeMargin: (value: string) => void;
  setTimeHours: (v: string) => void;
  setTimeMinutes: (v: string) => void;
  onChangePowerPreset: (key: string) => void;
  onChangeMaterial: (matKey: string) => void;
  pushToast: (kind: 'success' | 'error' | 'info', message: string, ms?: number, actionLabel?: string, actionFn?: () => void) => void;
}

export default function CalculatorPage({
  s,
  setMany,
  calculations,
  errors,
  materialProfiles,
  updateFilament,
  addFilament,
  removeFilament,
  applyPreset,
  loadMaterialProfile,
  copyBreakdown,
  handleShare,
  onChangeMargin,
  setTimeHours,
  setTimeMinutes,
  onChangePowerPreset,
  onChangeMaterial,
  pushToast
}: CalculatorPageProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-base-200 text-base-content transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 pb-20 lg:pb-8">
        {/* Mobile Cost Summary - Show at top on mobile */}
        <div className="lg:hidden mb-6">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 field-group">
            {/* Filaments */}
            <div className="form-section-enter">
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
                    onLoadProfile={loadMaterialProfile}
                    materialProfiles={materialProfiles.profiles}
                    errors={errors}
                    canRemove={s.filaments.length > 1}
                  />
                ))}
                
                <div className="flex justify-center pt-2">
                  <button
                    className="btn btn-soft btn-primary gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                    onClick={addFilament}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor" 
                      className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90"
                    >
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    {t('buttons.addFilament')}
                  </button>
                </div>
              </div>
              
              <Row>
                <Field label={t('fields.supportWaste')} suffix="%" error={errors.supportWastePercent} tip={t('tooltips.supportWaste')}>
                  <input
                    className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02] ${errors.supportWastePercent ? 'input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={s.supportWastePercent}
                    onChange={(e) => setMany({ supportWastePercent: parseInput(e.target.value) })}
                  />
                </Field>
                <Field label={t('fields.failureRate')} suffix="%" hint={t('hints.amortizedReprints')} error={errors.failureRatePercent} tip={t('tooltips.failureRate')}>
                  <input
                    className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02] ${errors.failureRatePercent ? 'input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={s.failureRatePercent}
                    onChange={(e) => setMany({ failureRatePercent: parseInput(e.target.value) })}
                  />
                </Field>
              </Row>
              </Section>
            </div>

            {/* Energy */}
            <div className="form-section-enter">
              <Section title={t('sections.energy')}>
              <Row>
                <Field label={t('fields.material')}>
                  <select
                    className="select select-bordered transition-all duration-200 focus:scale-[1.02] hover:border-primary/50"
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
                      className="select select-bordered transition-all duration-200 focus:scale-[1.02] hover:border-primary/50"
                      value={s.powerProfile}
                      onChange={(e) => onChangePowerPreset(e.target.value)}
                    >
                      {POWER_PRESETS.map((p) => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </select>
                    <input
                      className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02] ${errors.avgPowerW ? 'input-error' : ''} ${s.powerProfile !== "custom" ? 'opacity-50' : ''}`}
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
                      className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02] ${errors.printTimeHours ? 'input-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={s.printTimeHours}
                      onChange={(e) => setTimeHours(e.target.value)}
                    />
                    <span className="text-sm text-gray-500 transition-colors duration-200">h</span>
                    <input
                      className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02] ${errors.printTimeMinutes ? 'input-error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={s.printTimeMinutes}
                      onChange={(e) => setTimeMinutes(e.target.value)}
                    />
                    <span className="text-sm text-gray-500 transition-colors duration-200">min</span>
                  </div>
                </Field>
              </Row>
              <Row>
                <Field label={t('fields.energyPrice')} suffix={`${s.currency}${t('units.perKWh')}`} error={errors.energyPricePerKWh} tip={t('tooltips.energyPrice')}>
                  <input
                    className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02] ${errors.energyPricePerKWh ? 'input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={s.energyPricePerKWh}
                    onChange={(e) => setMany({ energyPricePerKWh: parseInput(e.target.value) })}
                  />
                </Field>
              </Row>
              </Section>
            </div>

            {/* Business-only - Progressive Form Disclosure */}
            {s.mode === "business" && (
              <div className="form-section-enter">
                <Section title={t('sections.businessFactors')}>
                <div className="space-y-4">
                  {/* Core Costs - Default Open */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300">
                    <input type="checkbox" defaultChecked />
                    <div className="collapse-title text-lg font-semibold text-primary">
                      {t('business.coreCosting', 'Core Costing')}
                    </div>
                    <div className="collapse-content">
                      <div className="space-y-4 pt-2">
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
                      </div>
                    </div>
                  </div>

                  {/* Labor & Processing - Collapsible */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300">
                    <input type="checkbox" />
                    <div className="collapse-title text-lg font-semibold text-secondary">
                      {t('business.laborProcessing', 'Labor & Processing')}
                    </div>
                    <div className="collapse-content">
                      <div className="space-y-4 pt-2">
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
                      </div>
                    </div>
                  </div>

                  {/* Additional Costs - Collapsible */}
                  <div className="collapse collapse-arrow bg-base-100 border border-base-300">
                    <input type="checkbox" />
                    <div className="collapse-title text-lg font-semibold text-accent">
                      {t('business.additionalCosts', 'Additional Costs')}
                    </div>
                    <div className="collapse-content">
                      <div className="space-y-4 pt-2">
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
                      </div>
                    </div>
                  </div>
                </div>
                </Section>
              </div>
            )}

            <div className="form-section-enter">
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
          </div>

          {/* Summary - Desktop only */}
          <div className="max-lg:hidden space-y-6">
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
      </div>
    </div>
  );
}