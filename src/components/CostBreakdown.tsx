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
  onShare: () => void;
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
  onCopyBreakdown,
  onShare
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
          <button className="btn btn-soft btn-primary" onClick={onCopyBreakdown} title="Copy breakdown">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="btn btn-soft btn-secondary" onClick={onShare} title="Share">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
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
        <div className="text-2xl text-primary font-bold">{fmt(total)}</div>
      </div>
    </div>
  );
}