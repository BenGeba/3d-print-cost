// PWA-related types for InstallPWAButton component

export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState = 'available' | 'installing' | 'installed' | 'failed' | 'unavailable';