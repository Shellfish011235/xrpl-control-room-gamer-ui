// Xaman (XUMM) Configuration
// 
// To enable real Xaman signing:
// 1. Register your app at https://apps.xumm.dev
// 2. Get your API Key (you DON'T need the secret for browser SDK!)
// 3. Create a .env file in the project root with:
//    VITE_XAMAN_API_KEY=your-api-key
//
// The browser SDK (xumm package) handles everything securely
// No backend server needed!

import { xamanService } from '../services/xaman';

export interface XamanConfig {
  apiKey: string | null;
  isConfigured: boolean;
  mode: 'demo' | 'production';
}

/**
 * Initialize Xaman
 * First tries environment variables, then localStorage
 * Call this in your main.tsx or App.tsx
 */
export function initializeXaman(): XamanConfig {
  // First, try environment variables (for developers)
  const envApiKey = import.meta.env.VITE_XAMAN_API_KEY;

  if (envApiKey && envApiKey !== 'YOUR_API_KEY_HERE') {
    xamanService.setApiCredentials(envApiKey);
    console.log('[Xaman] ✅ Production mode (from env) - real signing enabled');
    return {
      apiKey: envApiKey,
      isConfigured: true,
      mode: 'production',
    };
  }

  // Second, try loading saved credentials from localStorage
  if (xamanService.loadSavedCredentials()) {
    console.log('[Xaman] ✅ Production mode (from saved settings) - real signing enabled');
    return {
      apiKey: xamanService.getMaskedApiKey(),
      isConfigured: true,
      mode: 'production',
    };
  }

  console.log('[Xaman] 🎮 Demo mode - configure API Key in Settings to enable real signing');
  
  return {
    apiKey: null,
    isConfigured: false,
    mode: 'demo',
  };
}

/**
 * Check if Xaman is configured for production
 */
export function isXamanConfigured(): boolean {
  return xamanService.hasApiCredentials();
}

/**
 * Get current Xaman mode
 */
export function getXamanMode(): 'demo' | 'production' {
  return xamanService.hasApiCredentials() ? 'production' : 'demo';
}

export default {
  initializeXaman,
  isXamanConfigured,
  getXamanMode,
};
