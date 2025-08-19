// PWA installation constants

// Timeout configurations (in milliseconds)
export const PWA_TIMEOUTS = {
  INSTALL_PROMPT: 10000,
  USER_CHOICE: 15000,
  ERROR_MESSAGE_DISPLAY: 3000,
  RETRY_RESET: 5000,
} as const;

// Error messages
export const PWA_ERROR_MESSAGES = {
  PROMPT_NOT_AVAILABLE: 'Installation prompt is not available',
  INSTALLATION_CANCELLED: 'Installation was cancelled',
  INSTALLATION_FAILED: 'Installation failed. Please try again.',
  INSTALLATION_TIMEOUT: 'Installation timed out. Please try again.',
  INSTALLATION_ABORTED: 'Installation was cancelled.',
} as const;

// Button text configurations
export const PWA_BUTTON_TEXT = {
  INSTALL: 'Install App',
  INSTALLING: 'Installing...',
  RETRY: 'Retry Install',
} as const;

// CSS classes for button states
export const PWA_BUTTON_CLASSES = {
  BASE: 'btn btn-sm transition-all duration-200',
  INSTALLING: 'btn-disabled loading',
  FAILED: 'btn-warning',
  DEFAULT: 'btn-primary hover:btn-primary-focus',
} as const;