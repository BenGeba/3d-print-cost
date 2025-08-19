import { Line, InfoLine } from './ui';
import { CARD_CLASS } from '../constants';
import { formatToCurrency, number, prettyDuration } from '../utils';

interface CostBreakdownProps {
  mode: "hobby" | "business";
  currency: string;
  printTimeHours: number | string;
  printTimeMinutes: number | string;
  materialCost: number;
  energyCost: number;
  maintenanceCost: number;
  depreciationCost: number;
  laborCost: number;
  preparationCost: number;
  postProcessingCost: number;
  shippingCost: number;
  packagingCost: number;
  marginPercent: number | string;
  margin: number;
  netTotal: number;
  vatPercent: number;
  vatAmount: number;
  total: number;
  onCopyBreakdown: () => void;
}

export function CostBreakdown({
  mode,
  currency,
  printTimeHours,
  printTimeMinutes,
  materialCost,
  energyCost,
  maintenanceCost,
  depreciationCost,
  laborCost,
  preparationCost,
  postProcessingCost,
  shippingCost,
  packagingCost,
  marginPercent,
  margin,
  netTotal,
  vatPercent,
  vatAmount,
  total,
  onCopyBreakdown
}: CostBreakdownProps) {
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

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Breakdown</h2>
        <div className="flex items-center gap-2">
          <button className="btn btn-soft btn-primary" onClick={onCopyBreakdown}>
            Copy breakdown
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <InfoLine 
          label="Print time" 
          value={prettyDuration(number(printTimeHours, 0), number(printTimeMinutes, 0))} 
        />
        <Line label="Material" value={materialCost} currency={currency} />
        <Line label="Energy" value={energyCost} currency={currency} />
        <Line label="Maintenance" value={maintenanceCost} currency={currency} />
        {mode === "business" && (
          <>
            <Line label="Depreciation" value={depreciationCost} currency={currency} />
            <Line label="Labor" value={laborCost} currency={currency} />
            {preparationCost > 0 && <Line label="Preparation" value={preparationCost} currency={currency} />}
            {postProcessingCost > 0 && <Line label="Post-processing" value={postProcessingCost} currency={currency} />}
            {shippingCost > 0 && <Line label="Shipping" value={shippingCost} currency={currency} />}
            {packagingCost > 0 && <Line label="Packaging" value={packagingCost} currency={currency} />}
          </>
        )}
        {number(marginPercent, 0) > 0 && (
          <Line label={`Margin (${marginPercent}%)`} value={margin} currency={currency} />
        )}
        {mode === "business" && vatPercent > 0 && (
          <>
            <hr className="my-2" />
            <Line label="Net total" value={netTotal} currency={currency} />
            <Line label={`VAT (${vatPercent}%)`} value={vatAmount} currency={currency} />
          </>
        )}
      </div>
      <hr className="my-4" />
      <div className="flex items-center justify-between">
        <div className="font-semibold">Total</div>
        <div className="text-2xl font-bold">{fmt(total)}</div>
      </div>
    </div>
  );
}