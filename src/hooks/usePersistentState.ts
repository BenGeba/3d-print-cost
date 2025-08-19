import { useState, useEffect } from 'react';
import { Filament } from '../types';

export function usePersistentState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migration logic: convert legacy single filament to array format
        if (parsed && !Array.isArray(parsed.filaments) && parsed.pricePerKg !== undefined) {
          const legacyFilament: Filament = {
            id: "filament-1",
            name: "Filament 1",
            pricePerKg: parsed.pricePerKg || 25,
            usedGrams: parsed.filamentUsedGrams || 0,
            lengthMeters: parsed.filamentLengthMeters || 0,
            diameter: parsed.filamentDiameter || 1.75,
            density: parsed.densityGcm3 || 1.24,
            material: parsed.material || "PLA"
          };
          parsed.filaments = [legacyFilament];
          // Clean up legacy fields
          delete parsed.pricePerKg;
          delete parsed.filamentUsedGrams;
          delete parsed.filamentLengthMeters;
          delete parsed.filamentDiameter;
          delete parsed.densityGcm3;
          delete parsed.material;
        }
        return { ...initial, ...parsed };
      }
      return initial;
    } catch {
      return initial;
    }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  
  return [state, setState];
}