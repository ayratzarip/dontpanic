import WebApp from '@twa-dev/sdk';
import type { Theme } from '../types';

/**
 * Check if app is running inside Telegram
 */
export function isTelegramEnvironment(): boolean {
  try {
    // Check if WebApp is available and properly initialized
    return !!(
      WebApp &&
      WebApp.initData &&
      WebApp.initDataUnsafe &&
      WebApp.initDataUnsafe.user
    );
  } catch {
    return false;
  }
}

/**
 * Initialize Telegram WebApp
 */
export function initTelegram(): void {
  try {
    WebApp.ready();
    WebApp.expand();
    
    // Enable closing confirmation if there are unsaved changes
    WebApp.enableClosingConfirmation();
  } catch (error) {
    console.warn('Telegram WebApp not available:', error);
  }
}

/**
 * Get current theme from Telegram
 */
export function getTelegramTheme(): Theme {
  try {
    return WebApp.colorScheme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/**
 * Setup back button handler
 * Returns a cleanup function to remove the handler
 */
export function setupBackButton(callback: () => void | Promise<void>): () => void {
  try {
    WebApp.BackButton.show();
    
    let isProcessing = false;
    
    // Wrap callback to handle async properly and prevent multiple calls
    const wrappedCallback = async () => {
      // Защита от множественных одновременных вызовов
      if (isProcessing) return;
      isProcessing = true;

      try {
        const result = callback();
        // If callback is async, await it
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error('Back button callback error:', error);
      } finally {
        // Сбрасываем флаг после небольшой задержки
        setTimeout(() => {
          isProcessing = false;
        }, 300);
      }
    };
    
    // onClick автоматически заменяет предыдущий обработчик
    WebApp.BackButton.onClick(wrappedCallback);
    
    // Return cleanup function
    return () => {
      try {
        // Устанавливаем пустой обработчик для очистки
        WebApp.BackButton.onClick(() => {});
        WebApp.BackButton.hide();
      } catch {
        // Ignore errors on cleanup
      }
    };
  } catch {
    // BackButton not available outside Telegram
    return () => {}; // Return no-op cleanup
  }
}

/**
 * Hide back button
 */
export function hideBackButton(): void {
  try {
    WebApp.BackButton.hide();
  } catch {
    // BackButton not available outside Telegram
  }
}

/**
 * Show confirmation dialog
 */
export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      WebApp.showConfirm(message, (confirmed) => {
        resolve(confirmed);
      });
    } catch {
      // Fallback to native confirm
      resolve(window.confirm(message));
    }
  });
}

/**
 * Show alert
 */
export function showAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      WebApp.showAlert(message, () => {
        resolve();
      });
    } catch {
      // Fallback to native alert
      window.alert(message);
      resolve();
    }
  });
}

/**
 * Trigger haptic feedback
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): void {
  try {
    if (type === 'success' || type === 'warning' || type === 'error') {
      WebApp.HapticFeedback.notificationOccurred(type);
    } else {
      WebApp.HapticFeedback.impactOccurred(type);
    }
  } catch {
    // Haptic feedback not available
  }
}

/**
 * Set header color
 */
export function setHeaderColor(color: string): void {
  try {
    WebApp.setHeaderColor(color as `#${string}`);
  } catch {
    // Header color not available
  }
}

/**
 * Set background color
 */
export function setBackgroundColor(color: string): void {
  try {
    WebApp.setBackgroundColor(color as `#${string}`);
  } catch {
    // Background color not available
  }
}

/**
 * Disable closing confirmation
 */
export function disableClosingConfirmation(): void {
  try {
    WebApp.disableClosingConfirmation();
  } catch {
    // Not available
  }
}

