import { Field } from './ui';
import { CARD_CLASS, INPUT_CLASS } from '../constants';
import { ValidationErrors } from '../types';
import { formatToCurrency, number } from '../utils';

interface ProfitCalculatorProps {
  targetProfit: number | string;
  currency: string;
  requiredSellingPrice: number;
  vatPercent: number;
  errors: ValidationErrors;
  onTargetProfitChange: (value: string | number) => void;
}

export function ProfitCalculator({
  targetProfit,
  currency,
  requiredSellingPrice,
  vatPercent,
  errors,
  onTargetProfitChange
}: ProfitCalculatorProps) {
  // Helper to parse input value for controlled components
  const parseInput = (v: string): string | number => {
    if (v === "") return "";
    // Replace comma with dot for internal storage
    return String(v).replace(",", ".");
  };

  const fmt = (v: number): string => {
    const browserLocale =
      (typeof navigator !== "undefined" &&
        (navigator.languages?.[0] || navigator.language)) ||
      "de-DE";
    return formatToCurrency({
      num: v ?? 0,
      currency,
      decimalPlaces: 2,
      significantDecimalPlaces: 8,
      locale: browserLocale
    });
  };

  const targetProfitNum = number(targetProfit, 0);

  return (
    <div className={CARD_CLASS}>
      <h2 className="text-lg font-semibold mb-4">Profit Target Calculator</h2>
      <div className="space-y-4">
        <Field 
          label="Target profit amount" 
          suffix={currency} 
          error={errors.targetProfit} 
          tip="Enter desired profit to calculate required selling price"
        >
          <input
            className={`${INPUT_CLASS} ${errors.targetProfit ? 'input-error' : ''}`}
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={targetProfit}
            onChange={(e) => onTargetProfitChange(parseInput(e.target.value))}
          />
        </Field>
        {targetProfitNum > 0 && (
          <div className="bg-base-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Required selling price:</span>
              <span className="text-xl font-bold text-primary">{fmt(requiredSellingPrice)}</span>
            </div>
            <div className="mt-2 text-sm text-base-content/70">
              For {fmt(targetProfitNum)} profit{vatPercent > 0 ? ` (includes ${vatPercent}% VAT)` : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}