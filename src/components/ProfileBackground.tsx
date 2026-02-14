/**
 * Fun, customizable background that coordinates with the user's profile picture.
 * Extracts dominant colors from the profile image and renders gradient/mesh/bubbles
 * with a dark base so content stays readable.
 */

import { useEffect, useState, useMemo } from 'react';
import { useProfileStore, type BackgroundStyle } from '../store/profileStore';
import { extractPaletteFromImage, type ColorPalette } from '../services/themeService';
import { generateDashboardBackground } from '../modules/theme/generateBackground';

const DEFAULT_PROFILE_IMAGE = '/profile-default.png';

function isDefaultProfileImage(src: string | null): boolean {
  return !src || src === DEFAULT_PROFILE_IMAGE || src.startsWith('/profile-default.png');
}

// Cache palette by image URL so we don't re-extract on every render
const paletteCache = new Map<string, ColorPalette>();
// Cache generated background data URL by image URL (zero-cost: no server)
const generatedBgCache = new Map<string, string>();

async function getPaletteForImage(url: string): Promise<ColorPalette | null> {
  const cached = paletteCache.get(url);
  if (cached) return cached;
  try {
    const palette = await extractPaletteFromImage(url);
    paletteCache.set(url, palette);
    return palette;
  } catch {
    return null;
  }
}

async function getGeneratedBackground(url: string): Promise<string | null> {
  const cached = generatedBgCache.get(url);
  if (cached) return cached;
  const palette = await getPaletteForImage(url);
  if (!palette) return null;
  try {
    const dataUrl = await generateDashboardBackground(url, {
      primary: palette.dominant,
      secondary: palette.secondary,
      accent: palette.accent,
    });
    generatedBgCache.set(url, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

export function ProfileBackground() {
  const { profileImage, backgroundStyle, backgroundIntensity } = useProfileStore();
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedLoading, setGeneratedLoading] = useState(false);

  const useProfileColors = useMemo(() => {
    if (backgroundStyle === 'cyber' || backgroundStyle === 'generated') return false;
    if (backgroundStyle === 'auto') return !isDefaultProfileImage(profileImage);
    return true; // gradient | mesh | bubbles
  }, [backgroundStyle, profileImage]);

  const useGenerated = backgroundStyle === 'generated' && profileImage && !isDefaultProfileImage(profileImage);

  useEffect(() => {
    if (!useProfileColors || !profileImage || isDefaultProfileImage(profileImage)) {
      setPalette(null);
      return;
    }
    setLoading(true);
    getPaletteForImage(profileImage)
      .then((p) => {
        setPalette(p ?? null);
      })
      .finally(() => setLoading(false));
  }, [useProfileColors, profileImage]);

  useEffect(() => {
    if (!useGenerated || !profileImage) {
      setGeneratedUrl(null);
      return;
    }
    setGeneratedLoading(true);
    getGeneratedBackground(profileImage)
      .then((url) => {
        setGeneratedUrl(url ?? null);
      })
      .finally(() => setGeneratedLoading(false));
  }, [useGenerated, profileImage]);

  const opacity = 0.04 + backgroundIntensity * 0.14; // ~0.06–0.18 so it's subtle but visible

  // Always render the base layer (dark + grid/hex). Then overlay generated image or profile-colored effects.
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Base: dark and pattern — always present */}
      <div className="absolute inset-0 bg-[#050810]" />
      <div className="absolute inset-0 cyber-grid hex-pattern opacity-100" />

      {/* Generated background (blurred image + palette wash + vignette + noise + stars) */}
      {useGenerated && generatedUrl && !generatedLoading && (
        <img
          src={generatedUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Ambient orbs: when not generated, and when no profile colors or still loading */}
      {!useGenerated && (!useProfileColors || loading || !palette) && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl bg-cyber-glow/5" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl bg-cyber-purple/5" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl bg-cyber-blue/5 transform -translate-x-1/2 -translate-y-1/2" />
        </>
      )}

      {useProfileColors && palette && !loading && (
        <ProfileColoredLayer
          palette={palette}
          style={(backgroundStyle === 'auto' ? 'gradient' : backgroundStyle === 'cyber' ? 'gradient' : backgroundStyle) as 'gradient' | 'mesh' | 'bubbles'}
          opacity={opacity}
        />
      )}
    </div>
  );
}

function ProfileColoredLayer({
  palette,
  style,
  opacity,
}: {
  palette: ColorPalette;
  style: 'gradient' | 'mesh' | 'bubbles';
  opacity: number;
}) {
  const { dominant, secondary, accent, highlight } = palette;
  const d = hexToRgba(dominant, opacity);
  const s = hexToRgba(secondary, opacity);
  const a = hexToRgba(accent, opacity);
  const h = hexToRgba(highlight, opacity * 0.8);

  if (style === 'mesh') {
    return (
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 20% 20%, ${d}, transparent 50%),
            radial-gradient(ellipse 100% 100% at 80% 60%, ${s}, transparent 45%),
            radial-gradient(ellipse 80% 120% at 50% 80%, ${a}, transparent 40%)
          `,
        }}
      />
    );
  }

  if (style === 'bubbles') {
    return (
      <div className="absolute inset-0">
        <div
          className="absolute top-[10%] left-[15%] w-[min(90vw,400px)] h-[min(90vw,400px)] rounded-full blur-3xl animate-pulse"
          style={{ background: d, animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-[20%] right-[10%] w-[min(70vw,320px)] h-[min(70vw,320px)] rounded-full blur-3xl animate-pulse"
          style={{ background: s, animationDuration: '10s', animationDelay: '1s' }}
        />
        <div
          className="absolute top-[50%] left-[50%] w-[min(50vw,240px)] h-[min(50vw,240px)] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{ background: a, animationDuration: '7s', animationDelay: '0.5s' }}
        />
        <div
          className="absolute top-[70%] left-[20%] w-[min(40vw,180px)] h-[min(40vw,180px)] rounded-full blur-3xl animate-pulse"
          style={{ background: h, animationDuration: '9s', animationDelay: '2s' }}
        />
      </div>
    );
  }

  // gradient (default): large soft orbs
  return (
    <div className="absolute inset-0">
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl transition-opacity duration-500"
        style={{ background: d }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl transition-opacity duration-500"
        style={{ background: s }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500"
        style={{ background: a }}
      />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,212,255,${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
