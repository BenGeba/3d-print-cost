import { type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from './ui';
import InstallPWAButton from './InstallPWAButton';
import { LanguageSwitcher } from './LanguageSwitcher';
import { presets } from '../constants';

interface HeaderProps {
  mode: "hobby" | "business";
  currency: string;
  isDarkTheme: boolean;
  onModeToggle: (value: boolean) => void;
  onCurrencyChange: (currency: string) => void;
  onThemeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onApplyPreset: (name: string) => void;
  onResetClick: () => void;
}

export function Header({ 
  mode, 
  currency, 
  isDarkTheme, 
  onModeToggle, 
  onCurrencyChange, 
  onThemeChange, 
  onApplyPreset, 
  onResetClick 
}: HeaderProps) {
  const { t } = useTranslation();
  
  return (
    <header className="mb-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">{t('app.title')}</h1>
        <p className="mt-1 text-sm md:text-base text-base-content/70">
            {t('app.subtitle')}
        </p>
      </div>
      
      {/* Controls - Clean single row layout */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="swap swap-rotate">
            <input 
              type="checkbox" 
              className="theme-controller" 
              checked={isDarkTheme} 
              onChange={onThemeChange} 
            />
            <svg className="swap-off h-8 w-8 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            </svg>
            <svg className="swap-on h-8 w-8 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
          </label>
          
          <Switch
            checked={mode === "business"}
            onChange={onModeToggle}
            labelLeft={t('app.modes.hobby')}
            labelRight={t('app.modes.business')}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button className="btn btn-soft btn-error" onClick={onResetClick}>
            {t('buttons.resetSettings')}
          </button>
          <InstallPWAButton />
        </div>
      </div>

      {/* Presets & helpers */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Material presets */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-base-content/70 mr-2">Material Presets:</span>
              {Object.keys(presets).map((k) => (
                <button
                  key={k}
                  onClick={() => onApplyPreset(k)}
                  className="btn btn-sm sm:btn-md btn-soft btn-primary"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          
          {/* Currency selector */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-base-content/70">Currency:</span>
            <select
              className="select select-sm sm:select-md select-neutral min-w-0 w-20"
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
            >
              <option>EUR</option>
              <option>USD</option>
              <option>GBP</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}