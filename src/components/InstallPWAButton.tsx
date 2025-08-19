import { useState, useEffect, useCallback } from 'react';
import type { BeforeInstallPromptEvent, InstallState } from '../types';
import { 
    PWA_TIMEOUTS, 
    PWA_ERROR_MESSAGES, 
    PWA_BUTTON_TEXT, 
    PWA_BUTTON_CLASSES 
} from '../constants';

export default function InstallPWAButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installState, setInstallState] = useState<InstallState>('unavailable');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Check if app is already installed
    const checkInstallationStatus = useCallback(() => {
        // Check for standalone mode (app is installed)
        if (window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true) {
            setInstallState('installed');
            return true;
        }
        return false;
    }, []);

    useEffect(() => {
        // Early check for already installed app
        if (checkInstallationStatus()) {
            return;
        }

        let isListenerActive = true;

        const handleBeforeInstallPrompt = (e: Event) => {
            // Only proceed if listener is still active (prevents race conditions)
            if (!isListenerActive) return;

            try {
                e.preventDefault();
                const promptEvent = e as BeforeInstallPromptEvent;

                // Validate the prompt event has required methods
                if (typeof promptEvent.prompt === 'function' &&
                    promptEvent.userChoice instanceof Promise) {
                    setDeferredPrompt(promptEvent);
                    setInstallState('available');
                    setErrorMessage(null);
                } else {
                    console.warn('Invalid beforeinstallprompt event received');
                    setInstallState('unavailable');
                }
            } catch (error) {
                console.error('Error handling beforeinstallprompt:', error);
                setInstallState('unavailable');
            }
        };

        const handleAppInstalled = () => {
            if (!isListenerActive) return;
            setInstallState('installed');
            setDeferredPrompt(null);
            setErrorMessage(null);
        };

        // Add event listeners
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Cleanup function
        return () => {
            isListenerActive = false;
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [checkInstallationStatus]);

    const handleInstall = async () => {
        if (!deferredPrompt || installState !== 'available') {
            setErrorMessage(PWA_ERROR_MESSAGES.PROMPT_NOT_AVAILABLE);
            return;
        }

        setInstallState('installing');
        setErrorMessage(null);

        try {
            // Call the prompt method with timeout protection
            const promptPromise = deferredPrompt.prompt();
            const timeoutPromise = new Promise<void>((_, reject) =>
                setTimeout(() => reject(new Error('Install prompt timeout')), PWA_TIMEOUTS.INSTALL_PROMPT)
            );

            await Promise.race([promptPromise, timeoutPromise]);

            // Wait for user choice with timeout protection
            const choiceTimeoutPromise = new Promise<{ outcome: 'accepted' | 'dismissed' }>((_, reject) =>
                setTimeout(() => reject(new Error('User choice timeout')), PWA_TIMEOUTS.USER_CHOICE)
            );

            const result = await Promise.race([
                deferredPrompt.userChoice,
                choiceTimeoutPromise
            ]);

            if (result.outcome === 'accepted') {
                setInstallState('installed');
                setDeferredPrompt(null);
            } else {
                // User dismissed the prompt
                setInstallState('available');
                setErrorMessage(PWA_ERROR_MESSAGES.INSTALLATION_CANCELLED);
                // Clear the prompt as it's typically single-use
                setDeferredPrompt(null);
                setTimeout(() => setErrorMessage(null), PWA_TIMEOUTS.ERROR_MESSAGE_DISPLAY);
            }

        } catch (error) {
            console.error('Installation failed:', error);
            setInstallState('failed');

            // Provide user-friendly error messages
            let userMessage: string = PWA_ERROR_MESSAGES.INSTALLATION_FAILED;

            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    userMessage = PWA_ERROR_MESSAGES.INSTALLATION_TIMEOUT;
                } else if (error.message.includes('aborted')) {
                    userMessage = PWA_ERROR_MESSAGES.INSTALLATION_ABORTED;
                }
            }

            setErrorMessage(userMessage);
            setDeferredPrompt(null);

            // Reset to available state after a delay if prompt might be available again
            setTimeout(() => {
                setInstallState('unavailable');
                setErrorMessage(null);
            }, PWA_TIMEOUTS.RETRY_RESET);
        }
    };

    const handleRetry = () => {
        setInstallState('unavailable');
        setErrorMessage(null);
        // Recheck installation status
        checkInstallationStatus();
    };

    // Don't render if app is already installed
    if (installState === 'installed') {
        return null;
    }

    // Don't render if installation is not available
    if (installState === 'unavailable') {
        return null;
    }

    const getButtonText = () => {
        switch (installState) {
            case 'installing':
                return PWA_BUTTON_TEXT.INSTALLING;
            case 'failed':
                return PWA_BUTTON_TEXT.RETRY;
            default:
                return PWA_BUTTON_TEXT.INSTALL;
        }
    };

    const getButtonClass = () => {
        const baseClass = PWA_BUTTON_CLASSES.BASE;
        switch (installState) {
            case 'installing':
                return `${baseClass} ${PWA_BUTTON_CLASSES.INSTALLING}`;
            case 'failed':
                return `${baseClass} ${PWA_BUTTON_CLASSES.FAILED}`;
            default:
                return `${baseClass} ${PWA_BUTTON_CLASSES.DEFAULT}`;
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                className={getButtonClass()}
                onClick={installState === 'failed' ? handleRetry : handleInstall}
                disabled={installState === 'installing'}
                aria-label={installState === 'installing' ? 'Installing app...' : 'Install this app'}
            >
                {installState === 'installing' && (
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                )}
                {getButtonText()}
            </button>

            {errorMessage && (
                <div className="alert alert-warning alert-sm max-w-xs" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-xs">{errorMessage}</span>
                </div>
            )}
        </div>
    );
}