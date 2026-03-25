import React, { useState, useEffect } from 'react';
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
        
        // Clean up removed fields from localStorage
        delete parsed.preparationMinutes;
        delete parsed.preparationHourlyRate;
        delete parsed.postProcessingMinutes;
        delete parsed.postProcessingHourlyRate;
        delete parsed.postProcessingFixed;

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
    } catch {
      // Silently ignore localStorage errors (e.g., when storage is full)
    }
  }, [key, state]);
  
  return [state, setState];
}