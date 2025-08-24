 import { useState, useEffect, useCallback } from 'react';
import { Workbox } from 'workbox-window';

export interface PWAUpdateState {
  updateAvailable: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
  needsRefresh: boolean;
}

export interface PWAUpdateActions {
  updateApp: () => Promise<void>;
  skipWaiting: () => void;
  checkForUpdate: () => Promise<void>;
}

export function usePWAUpdate(): PWAUpdateState & PWAUpdateActions {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [wb, setWb] = useState<Workbox | null>(null);

  useEffect(() => {
    // Only initialize in production and if service workers are supported
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
      return;
    }

    const workbox = new Workbox('/sw.js');
    setWb(workbox);

    // Event: SW is waiting to activate (update available)
    workbox.addEventListener('waiting', () => {
      setUpdateAvailable(true);
    });

    // Event: SW has been installed for the first time
    workbox.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        setUpdateAvailable(true);
      }
    });

    // Event: SW is now controlling the page (update complete)
    workbox.addEventListener('controlling', () => {
      setNeedsRefresh(true);
      setIsUpdating(false);
    });

    // Register the service worker
    workbox.register()
      .then((reg) => {
        setRegistration(reg);
        console.log('PWA: Service worker registered successfully');
      })
      .catch((err) => {
        console.error('PWA: Service worker registration failed:', err);
      });

    return () => {
      // Cleanup event listeners
      workbox.removeEventListener('waiting', () => {});
      workbox.removeEventListener('installed', () => {});
      workbox.removeEventListener('controlling', () => {});
    };
  }, []);

  const updateApp = useCallback(async (): Promise<void> => {
    if (!wb || !updateAvailable) {
      return;
    }

    try {
      setIsUpdating(true);
      
      // Tell the waiting service worker to skip waiting and become active
      wb.messageSkipWaiting();
      
      // The 'controlling' event will fire and handle the refresh
    } catch (error) {
      console.error('PWA: Failed to update app:', error);
      setIsUpdating(false);
      throw error;
    }
  }, [wb, updateAvailable]);

  const skipWaiting = useCallback(() => {
    if (wb) {
      wb.messageSkipWaiting();
    }
  }, [wb]);

  const checkForUpdate = useCallback(async (): Promise<void> => {
    if (!registration) {
      return;
    }

    try {
      await registration.update();
    } catch (error) {
      console.error('PWA: Failed to check for updates:', error);
    }
  }, [registration]);

  // Auto-refresh when needsRefresh is true
  useEffect(() => {
    if (needsRefresh) {
      // Small delay to ensure smooth user experience
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, [needsRefresh]);

  return {
    updateAvailable,
    isUpdating,
    registration,
    needsRefresh,
    updateApp,
    skipWaiting,
    checkForUpdate,
  };
}