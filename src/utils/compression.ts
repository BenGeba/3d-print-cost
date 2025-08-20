import LZString from 'lz-string';
import { AppState } from '../types';

// Shortened field names for compression (maps full field names to short ones)
const FIELD_MAP: Record<string, string> = {
  mode: 'm',
  filamentPricingMode: 'fpm',
  filaments: 'f',
  pricePerKg: 'ppk',
  filamentUsedGrams: 'fug',
  filamentDiameter: 'fd',
  filamentLengthMeters: 'flm',
  densityGcm3: 'dg',
  material: 'mat',
  supportWastePercent: 'swp',
  failureRatePercent: 'frp',
  powerProfile: 'pp',
  avgPowerW: 'apw',
  printTimeHours: 'pth',
  printTimeMinutes: 'ptm',
  energyPricePerKWh: 'epk',
  printerPrice: 'prp',
  printerLifetimeHours: 'plh',
  maintenanceEurPerHour: 'meh',
  laborRatePerHour: 'lrh',
  laborMinutes: 'lm',
  preparationMinutes: 'pm',
  preparationHourlyRate: 'phr',
  postProcessingMinutes: 'ppm',
  postProcessingHourlyRate: 'pphr',
  marginPercent: 'mp',
  shippingCost: 'sc',
  packagingCost: 'pc',
  vatPercent: 'vp',
  targetProfit: 'tp',
  currency: 'c'
};

// Reverse mapping for decompression
const REVERSE_FIELD_MAP = Object.fromEntries(
  Object.entries(FIELD_MAP).map(([key, value]) => [value, key])
);

// Filament field mapping
const FILAMENT_FIELD_MAP: Record<string, string> = {
  id: 'i',
  name: 'n',
  pricePerKg: 'p',
  usedGrams: 'u',
  lengthMeters: 'l',
  diameter: 'd',
  density: 'den',
  material: 'm'
};

const REVERSE_FILAMENT_FIELD_MAP = Object.fromEntries(
  Object.entries(FILAMENT_FIELD_MAP).map(([key, value]) => [value, key])
);

const DEFAULT_VALUES: Partial<AppState> = {
  mode: 'hobby',
  filamentPricingMode: 'grams',
  supportWastePercent: 0,
  failureRatePercent: 0,
  powerProfile: 'custom',
  avgPowerW: 0,
  printTimeHours: 0,
  printTimeMinutes: 0,
  energyPricePerKWh: 0,
  printerPrice: 0,
  printerLifetimeHours: 0,
  maintenanceEurPerHour: 0,
  laborRatePerHour: 0,
  laborMinutes: 0,
  preparationMinutes: 0,
  preparationHourlyRate: 0,
  postProcessingMinutes: 0,
  postProcessingHourlyRate: 0,
  marginPercent: 0,
  shippingCost: 0,
  packagingCost: 0,
  vatPercent: 0,
  targetProfit: 0,
  currency: 'EUR'
};

function optimizeForCompression(appState: AppState): any {
  const optimized: any = {};
  
  // Process main fields
  for (const [fullKey, shortKey] of Object.entries(FIELD_MAP)) {
    const value = (appState as any)[fullKey];
    const defaultValue = (DEFAULT_VALUES as any)[fullKey];
    
    // Skip if value equals default or is empty/null/undefined
    if (value !== undefined && value !== null && value !== '' && value !== defaultValue) {
      // Convert string numbers to actual numbers where possible for better compression
      if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
        optimized[shortKey] = Number(value);
      } else {
        optimized[shortKey] = value;
      }
    }
  }
  
  // Process filaments with shortened field names
  if (appState.filaments && appState.filaments.length > 0) {
    optimized.f = appState.filaments.map(filament => {
      const optimizedFilament: any = {};
      for (const [fullKey, shortKey] of Object.entries(FILAMENT_FIELD_MAP)) {
        const value = (filament as any)[fullKey];
        if (value !== undefined && value !== null && value !== '') {
          // Convert string numbers to actual numbers where possible
          if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
            optimizedFilament[shortKey] = Number(value);
          } else {
            optimizedFilament[shortKey] = value;
          }
        }
      }
      return optimizedFilament;
    });
  }
  
  return optimized;
}

function restoreFromOptimized(optimized: any): AppState {
  const restored: any = { ...DEFAULT_VALUES };

  for (const [shortKey, fullKey] of Object.entries(REVERSE_FIELD_MAP)) {
    if (optimized[shortKey] !== undefined) {
      restored[fullKey] = optimized[shortKey];
    }
  }

  if (optimized.f && Array.isArray(optimized.f)) {
    restored.filaments = optimized.f.map((filament: any) => {
      const restoredFilament: any = {};
      for (const [shortKey, fullKey] of Object.entries(REVERSE_FILAMENT_FIELD_MAP)) {
        if (filament[shortKey] !== undefined) {
          restoredFilament[fullKey] = filament[shortKey];
        }
      }
      return restoredFilament;
    });
  } else {
    restored.filaments = [];
  }
  
  return restored as AppState;
}

export function compressAppState(appState: AppState): string {
  try {
    const optimized = optimizeForCompression(appState);
    const json = JSON.stringify(optimized);
    return LZString.compressToEncodedURIComponent(json);
  } catch (error) {
    throw new Error('Error compressing data');
  }
}

export function decompressAppState(compressedData: string): AppState {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressedData);
    if (!json) {
      throw new Error('Error decompressing data');
    }
    const parsed = JSON.parse(json);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid data structure');
    }

    const hasShortKeys = Object.keys(parsed).some(key => Object.values(FIELD_MAP).includes(key));
    
    if (hasShortKeys) {
      const restored = restoreFromOptimized(parsed);

      if (!['hobby', 'business'].includes(restored.mode)) {
        throw new Error('Invalid mode');
      }
      
      if (!Array.isArray(restored.filaments)) {
        throw new Error('Invalid filament data');
      }
      
      return restored;
    } else {
      // Legacy format - validate and return as-is for backward compatibility
      const requiredFields = ['mode', 'filaments', 'currency'] as const;
      for (const field of requiredFields) {
        if (!(field in parsed)) {
          throw new Error(`Missing field: ${field}`);
        }
      }
      
      // Validate mode field
      if (!['hobby', 'business'].includes(parsed.mode)) {
        throw new Error('Invalid mode');
      }
      
      // Validate filaments array
      if (!Array.isArray(parsed.filaments)) {
        throw new Error('Invalid filament data');
      }
      
      // Validate currency
      if (typeof parsed.currency !== 'string' || !parsed.currency.trim()) {
        throw new Error('Invalid currency');
      }
      
      return parsed as AppState;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error decompressing data: ${error.message}`);
    }
    throw new Error('Error decompressing data');
  }
}

/**
 * Generates a shareable URL with compressed app state data
 */
export function generateShareUrl(appState: AppState, baseUrl: string = window.location.origin): string {
  try {
    const compressedData = compressAppState(appState);
    const url = new URL(baseUrl);
    // lz-string compressToEncodedURIComponent already produces URL-safe strings
    url.hash = `?data=${compressedData}`;
    
    // Check URL length limit (2000 chars for safety)
    const finalUrl = url.toString();
    if (finalUrl.length > 2000) {
      throw new Error('URL too long - data cannot be compressed');
    }
    
    return finalUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error creating share URL');
  }
}

/**
 * Parses URL parameters to extract compressed app state data
 */
export function parseUrlData(): AppState | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#?')) {
      return null;
    }
    
    const params = new URLSearchParams(hash.substring(2));
    const data = params.get('data');
    
    if (!data) {
      return null;
    }
    
    // lz-string compressToEncodedURIComponent already handles URL encoding
    return decompressAppState(data);
  } catch (error) {
    // Return null for parsing errors - caller should handle appropriately
    return null;
  }
}

/**
 * Clears the URL parameters after successful import
 */
export function clearUrlData(): void {
  try {
    if (window.location.hash.startsWith('#?')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch (error) {
    // Silently ignore errors when clearing URL
    console.warn('Failed to clear URL data:', error);
  }
}