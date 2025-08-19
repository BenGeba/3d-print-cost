import { LineProps, InfoLineProps } from '../../types';
import { formatToCurrency } from '../../utils';

export function Line({ label, value, currency }: LineProps) {
  const browserLocale =
    (typeof navigator !== "undefined" &&
      (navigator.languages?.[0] || navigator.language)) ||
    "de-DE";
  const formatted = formatToCurrency({
    num: value ?? 0,
    currency,
    decimalPlaces: 2,
    significantDecimalPlaces: 2,
    locale: browserLocale
  });
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium">{formatted}</span>
    </div>
  );
}

export function InfoLine({ label, value }: InfoLineProps) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}