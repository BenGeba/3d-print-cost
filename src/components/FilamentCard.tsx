import { FilamentCardProps } from '../types';
import { presets, MATERIALS, INPUT_CLASS } from '../constants';
import { Field, Row } from './ui';

export function FilamentCard({ 
  filament, 
  filamentPricingMode, 
  onUpdate, 
  onRemove, 
  onApplyPreset, 
  errors, 
  canRemove 
}: FilamentCardProps) {
  // Helper to parse input value for controlled components
  const parseInput = (v: string): string | number => {
    if (v === "") return "";
    // Replace comma with dot for internal storage
    return String(v).replace(",", ".");
  };

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
            error={errors[`filament-${filament.id}-pricePerKg` as keyof typeof errors]} 
            tip="Material price per kilogram"
          >
            <input
              className={`${INPUT_CLASS} ${errors[`filament-${filament.id}-pricePerKg` as keyof typeof errors] ? 'input-error' : ''}`}
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
              error={errors[`filament-${filament.id}-usedGrams` as keyof typeof errors]} 
              tip="Use slicer estimate or measured weight"
            >
              <input
                className={`${INPUT_CLASS} ${errors[`filament-${filament.id}-usedGrams` as keyof typeof errors] ? 'input-error' : ''}`}
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
                error={errors[`filament-${filament.id}-lengthMeters` as keyof typeof errors]} 
                tip="From slicer or spool meter counter"
              >
                <input
                  className={`${INPUT_CLASS} ${errors[`filament-${filament.id}-lengthMeters` as keyof typeof errors] ? 'input-error' : ''}`}
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
                error={errors[`filament-${filament.id}-diameter` as keyof typeof errors]} 
                tip="Typical: 1.75 mm or 2.85 mm"
              >
                <input
                  className={`${INPUT_CLASS} ${errors[`filament-${filament.id}-diameter` as keyof typeof errors] ? 'input-error' : ''}`}
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
              error={errors[`filament-${filament.id}-density` as keyof typeof errors]} 
              tip="Material density for length→grams conversion"
            >
              <input
                className={`${INPUT_CLASS} ${errors[`filament-${filament.id}-density` as keyof typeof errors] ? 'input-error' : ''}`}
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