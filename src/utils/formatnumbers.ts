// Codesnippets from https://gist.github.com/alamilladev/52c873f1d956afbc533e3e58256fd314

export const defaultCurrency = {
  id: 'USD',
  symbol: '$',
  full: 'USD$',
};

/**
 * ===========================================
 * |******** CURRENCY FORMAT METHODS ********|
 * ===========================================
 */

/**
 * Converts a number in scientific notation to its non-scientific representation.
 * @param numString - The number in scientific notation as a string.
 * @returns The number in non-scientific notation as a string.
 */
function convertToNonScientific(num: string | number): string {
  if (typeof num === 'number') {
    num = String(num);
  }

  // Check if the number string is in scientific notation
  if (num.includes('e')) {
    // Convert to non-exponential form
    const arrNum: string[] = num.split('e-');
    const strDecimal: string = arrNum[0].replace('.', '');
    const numDecimalsToSubtract: number = arrNum[0].split('.')[0].length;
    const numZeros = Number(arrNum[1]) - numDecimalsToSubtract;

    return '0.' + '0'.repeat(numZeros) + strDecimal;
  }

  return String(num);
}

/**
 * Formats a number with the specified decimal places, ensuring the significant digits are retained.
 * @param number - The number to format.
 * @param decimalPlaces - The number of decimal places to keep after rounding.
 * @returns The formatted number as a string with the specified decimal places.
 */
function formatWithSignificantDecimals(
  number: number,
  decimalPlaces: number
): string {
  // Convert the number to a string
  let strNum: string = String(number);
  strNum = convertToNonScientific(strNum);

  // Find the decimal part of the number
  const numParts: string[] = strNum.split('.');
  const decimalPart: string | undefined = numParts[1];

  // Find the number of leading zeros in the decimal part
  let leadingZeros: number = 0;
  if (decimalPart) {
    while (decimalPart[leadingZeros] === '0') {
      leadingZeros++;
    }
  }

  // Determine the total digits after the decimal point considering leading zeros
  const totalDigits: number = leadingZeros + decimalPlaces;

  // Round the number
  const roundedNumber: number =
    Math.round(parseFloat(strNum) * Math.pow(10, totalDigits)) /
    Math.pow(10, totalDigits);

  return convertToNonScientific(roundedNumber);
}

export type FormatCurrencyInput = {
  num?: number | string | null;
  currency?: string | null;
  locale?: string;
  decimalPlaces?: number | null;
  significantDecimalPlaces?: number | null;
};

const symbolToISO: Record<string, string> = {
  "€": "EUR",
  "$": "USD",
  "£": "GBP",
  "¥": "JPY",
  "CHF": "CHF",
  "zł": "PLN"
  // ggf. erweitern
};

function toISO4217(cur?: string | null): string {
  const fallback = (typeof defaultCurrency?.id === "string" && defaultCurrency.id) || "USD";
  if (!cur) return fallback;
  const c = cur.trim();
  if (/^[A-Za-z]{3}$/.test(c)) return c.toUpperCase();
  return symbolToISO[c] || fallback;
}

export function formatToCurrency(input: FormatCurrencyInput): string {
  const n = typeof input.num === "string" ? Number(input.num) : (input.num ?? 0);
  const abs = Math.abs(n);
  const locale = input.locale || undefined;
  const currency = toISO4217(input.currency);
  const dp = input.decimalPlaces ?? 2;
  const sdp = input.significantDecimalPlaces ?? 8;

  let minFD = dp;
  let maxFD = dp;
  let value = n;

  if (abs < 1) {
    const withSig = formatWithSignificantDecimals(abs, sdp);
    const decLen = withSig.split(".")[1]?.length ?? 0;
    const [minFD, maxFD] = safeDigits(2, Math.max(2, Math.min(decLen, sdp)));
    value = Math.sign(n) < 0 ? -Number(withSig) : Number(withSig);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    useGrouping: true,
    minimumFractionDigits: minFD,
    maximumFractionDigits: maxFD,
  }).format(value);
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const safeDigits = (minFD: number, maxFD: number) => {
  const min = clamp(minFD, 0, 20);
  const maxClamped = clamp(maxFD, 0, 20);
  const max = Math.max(min, maxClamped);
  return [min, max] as const;
};