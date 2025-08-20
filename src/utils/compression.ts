import LZString from 'lz-string';
import { AppState } from '../types';

/**
 * Compresses AppState data to a URL-safe string using lz-string
 */
export function compressAppState(appState: AppState): string {
  try {
    const json = JSON.stringify(appState);
    return LZString.compressToEncodedURIComponent(json);
  } catch (error) {
    throw new Error('Error compressing data');
  }
}

/**
 * Decompresses URL-safe string back to AppState using lz-string
 */
export function decompressAppState(compressedData: string): AppState {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressedData);
    if (!json) {
      throw new Error('Error decompressing data');
    }
    const parsed = JSON.parse(json);
    
    // Basic validation to ensure it looks like AppState
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid data structure');
    }
    
    // Check for required fields
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