import { useTranslation } from 'react-i18next';
import { FilamentCardProps } from '../types';
import { presets, MATERIALS, INPUT_CLASS } from '../constants';
import { Field, Row } from './ui';

export function FilamentCard({ 
  filament, 
  filamentPricingMode, 
  onUpdate, 
  onRemove, 
  onApplyPreset,
  onLoadProfile,
  materialProfiles = [],
  errors, 
  canRemove 
}: FilamentCardProps) {
  const { t } = useTranslation();
  
  // Helper to parse input value for controlled components
  const parseInput = (v: string): string | number => {
    if (v === "") return "";
    // Replace comma with dot for internal storage
    return String(v).replace(",", ".");
  };

  return (
    <div className="card bg-base-100 shadow border border-base-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="card-body">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <Field label={t('fields.name')} tip={t('tooltips.filamentName')}>
              <input
                className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02]`}
                type="text"
                placeholder={t('placeholders.filamentName')}
                value={filament.name}
                onChange={(e) => onUpdate(filament.id, { name: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            {/* Material Profiles Dropdown */}
            {onLoadProfile && materialProfiles.length > 0 && (
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-soft btn-sm btn-secondary transition-all duration-200 hover:scale-105 hover:bg-secondary/10">
                  Profile
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
                <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow-xl border border-base-300 max-h-64 overflow-y-auto">
                  {materialProfiles.map((profile) => (
                    <li key={profile.id}>
                      <button 
                        onClick={() => onLoadProfile(profile, filament.id)}
                        className="transition-all duration-200 hover:scale-105 hover:bg-secondary/10 text-left"
                      >
                        <div>
                          <div className="font-medium">{profile.name}</div>
                          <div className="text-xs text-base-content/70">
                            {profile.materialType} • {profile.brand}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Material Presets Dropdown */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-sm btn-ghost transition-all duration-200 hover:scale-105 hover:bg-primary/10">
                {t('buttons.presets')}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor" 
                  className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180"
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-24 p-2 shadow-xl border border-base-300">
                {Object.keys(presets).map((k) => (
                  <li key={k}>
                    <button 
                      onClick={() => onApplyPreset(k, filament.id)}
                      className="transition-all duration-200 hover:scale-105 hover:bg-primary/10"
                    >
                      {k}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {canRemove && (
              <button
                className="btn btn-sm btn-error btn-soft transition-all duration-200 hover:scale-110 hover:rotate-90 hover:bg-error/20"
                onClick={() => onRemove(filament.id)}
                title={t('buttons.removeFilament')}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor" 
                  className="w-4 h-4 transition-transform duration-200"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <Row>
          <Field label={t('fields.material')}>
            <select
              className="select select-bordered transition-all duration-200 focus:scale-[1.02] hover:border-primary/50"
              value={filament.material}
              onChange={(e) => onUpdate(filament.id, { material: e.target.value })}
            >
              {MATERIALS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </Field>
          <Field 
            label={t('fields.pricePerKg')} 
            error={errors[`filament-${filament.id}-pricePerKg` as keyof typeof errors]} 
            tip={t('tooltips.materialPrice')}
          >
            <input
              className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02] ${errors[`filament-${filament.id}-pricePerKg` as keyof typeof errors] ? 'input-error' : ''}`}
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
              label={t('fields.usedAmount')} 
              suffix={t('units.grams')} 
              error={errors[`filament-${filament.id}-usedGrams` as keyof typeof errors]} 
              tip={t('tooltips.usedAmount')}
            >
              <input
                className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02] ${errors[`filament-${filament.id}-usedGrams` as keyof typeof errors] ? 'input-error' : ''}`}
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
                label={t('fields.length')} 
                suffix="m" 
                error={errors[`filament-${filament.id}-lengthMeters` as keyof typeof errors]} 
                tip={t('tooltips.filamentLength')}
              >
                <input
                  className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02] ${errors[`filament-${filament.id}-lengthMeters` as keyof typeof errors] ? 'input-error' : ''}`}
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={filament.lengthMeters}
                  onChange={(e) => onUpdate(filament.id, { lengthMeters: parseInput(e.target.value) })}
                />
              </Field>
              <Field 
                label={t('fields.diameter')} 
                suffix={t('units.millimeters')} 
                error={errors[`filament-${filament.id}-diameter` as keyof typeof errors]} 
                tip={t('tooltips.filamentDiameter')}
              >
                <input
                  className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02] ${errors[`filament-${filament.id}-diameter` as keyof typeof errors] ? 'input-error' : ''}`}
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
              label={t('fields.density')} 
              suffix="g/cm³" 
              hint={t('hints.densityHint')} 
              error={errors[`filament-${filament.id}-density` as keyof typeof errors]} 
              tip={t('tooltips.densityConversion')}
            >
              <input
                className={`${INPUT_CLASS} transition-all duration-200 focus:scale-[1.02] ${errors[`filament-${filament.id}-density` as keyof typeof errors] ? 'input-error' : ''}`}
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