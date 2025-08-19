import { number } from './calculations';

export function validateRange(value: string | number, min: number, max: number): boolean {
  if (value === "") return true; // Empty values are handled elsewhere
  const n = number(value);
  return n >= min && n <= max;
}

export function validatePositive(value: string | number): boolean {
  if (value === "") return true; // Empty values are handled elsewhere
  return number(value) >= 0;
}

export function validateGreaterThanZero(value: string | number): boolean {
  if (value === "") return true; // Empty values are handled elsewhere
  return number(value) > 0;
}