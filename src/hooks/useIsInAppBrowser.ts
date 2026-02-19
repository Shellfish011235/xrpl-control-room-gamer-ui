import { useState, useEffect } from 'react';

/**
 * Detects X / Twitter, Facebook, Instagram, Line in-app browsers.
 * In these WebViews, modals/overlays often render blank or glitchy;
 * use this to show full-page alternatives or simplify layout (no AnimatePresence).
 *
 * X app may send "Twitter for iPhone", "X for iPhone", or similar; we match both.
 */
export function useIsInAppBrowser(): boolean {
  const [value, setValue] = useState(false);
  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const inApp =
      /Twitter|FBAN|FBAV|Instagram|Line\//i.test(ua) ||
      /\bX\s+for\s+iPhone\b/i.test(ua) ||
      /^Mozilla\/5\.0.*\bMobile\/.*\bX\b/i.test(ua);
    setValue(inApp);
  }, []);
  return value;
}
