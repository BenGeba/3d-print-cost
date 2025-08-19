// Convert value to number, supporting both comma and dot as decimal separator
export function number(v: string | number | undefined | null, fallback: number = 0): number {
  if (v === "" || v === null || v === undefined) return fallback;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

// Parse input value, allowing empty strings and supporting both decimal separators
export function parseInput(v: string): string | number {
  if (v === "") return "";
  // Replace comma with dot for internal storage
  return String(v).replace(",", ".");
}

export function prettyDuration(hours: number | string, minutes: number | string): string {
  const totalMinutes = Math.max(0, Math.round((number(hours, 0) + number(minutes, 0) / 60) * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h} h ${m} min`;
}