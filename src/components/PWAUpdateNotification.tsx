import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePWAUpdate } from '../hooks';

export default function PWAUpdateNotification() {
  const { t } = useTranslation();
  const { updateAvailable, isUpdating, updateApp } = usePWAUpdate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isErrored, setIsErrored] = useState(false);

  // Don't show if no update available or user dismissed
  if (!updateAvailable || isDismissed) {
    return null;
  }

  const handleUpdate = async () => {
    try {
      setIsErrored(false);
      await updateApp();
    } catch (error) {
      console.error('Failed to update app:', error);
      setIsErrored(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="alert alert-info shadow-lg">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{t('pwa.updateAvailable')}</h3>
          <div className="text-xs opacity-90">
            {t('pwa.updateDescription')}
          </div>
          {isErrored && (
            <div className="text-xs text-error mt-1">
              {t('pwa.updateError')}
            </div>
          )}
        </div>
        <div className="flex-none">
          <div className="flex gap-2">
            <button 
              className="btn btn-ghost btn-xs"
              onClick={handleDismiss}
              disabled={isUpdating}
            >
              {t('pwa.updateLater')}
            </button>
            <button 
              className="btn btn-primary btn-xs"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  {t('pwa.updating')}
                </>
              ) : (
                t('pwa.updateNow')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}