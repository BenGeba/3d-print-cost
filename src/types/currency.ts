// Currency formatting types

export interface CurrencyConfig {
  id: string;
  symbol: string;
  full: string;
}

export interface FormatCurrencyInput {
  num?: number | string | null;
  currency?: string | null;
  locale?: string;
  decimalPlaces?: number | null;
  significantDecimalPlaces?: number | null;
}