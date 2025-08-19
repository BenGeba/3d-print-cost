// Currency formatting constants
import type { CurrencyConfig } from '../types';

export const DEFAULT_CURRENCY: CurrencyConfig = {
  id: 'USD',
  symbol: '$',
  full: 'USD$',
};

export const SYMBOL_TO_ISO: Record<string, string> = {
  "€": "EUR",
  "$": "USD", 
  "£": "GBP",
  "¥": "JPY",
  "CHF": "CHF",
  "zł": "PLN"
};

// Formatting constraints
export const CURRENCY_FORMATTING = {
  MIN_DECIMAL_PLACES: 0,
  MAX_DECIMAL_PLACES: 20,
  DEFAULT_DECIMAL_PLACES: 2,
  DEFAULT_SIGNIFICANT_DECIMAL_PLACES: 8,
} as const;