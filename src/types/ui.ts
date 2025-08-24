import * as React from 'react';
import { Filament, MaterialProfile } from './filament';
import { ValidationErrors } from './app-state';

// UI component prop types
export interface FieldProps {
  label: string;
  suffix?: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
  tip?: string;
}

export interface SwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  labelLeft?: string;
  labelRight?: string;
  name?: string;
}

export interface SectionProps {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}

export interface LineProps {
  label: string;
  value: number;
  currency: string;
}

export interface InfoLineProps {
  label: string;
  value: string;
}

export interface FilamentCardProps {
  filament: Filament;
  filamentPricingMode: "grams" | "length";
  onUpdate: (id: string, updates: Partial<Filament>) => void;
  onRemove: (id: string) => void;
  onApplyPreset: (name: string, filamentId: string) => void;
  onLoadProfile?: (profile: MaterialProfile, filamentId: string) => void;
  materialProfiles?: MaterialProfile[];
  errors: ValidationErrors;
  canRemove: boolean;
}

export interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
  actionLabel?: string;
  actionFn?: () => void;
}