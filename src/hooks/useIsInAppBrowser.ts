import { useState, useEffect } from 'react';

/**
 * Detects X / Twitter, Facebook, Instagram, Line in-app browsers.
 * In these WebViews, modals/overlays often render blank or glitchy;
 * use this to show full-page alternatives or simplify layout (no AnimatePresence).
 */
export function useIsInAppBrowser(): boolean {
  const [value, setValue] = useState(false);
  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    setValue(/Twitter|FBAN|FBAV|Instagram|Line\//i.test(ua));
  }, []);
  return value;
}
