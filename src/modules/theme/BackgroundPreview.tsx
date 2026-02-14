/**
 * Preview for the zero-cost generated background (NFT/profile image + palette).
 * Shows a small preview and "Use as background" to switch to the generated style.
 */

import { useEffect, useState } from 'react';
import { generateDashboardBackground, type Palette } from './generateBackground';
import { extractPaletteFromImage, type ColorPalette } from '../../services/themeService';

function colorPaletteToPalette(c: ColorPalette): Palette {
  return {
    primary: c.dominant,
    secondary: c.secondary,
    accent: c.accent,
  };
}

export interface BackgroundPreviewProps {
  /** Profile or NFT image URL to use as base */
  imageUrl: string;
  /** Optional pre-extracted palette; if not provided, extracted from imageUrl */
  palette?: ColorPalette | null;
  /** Preview size (small preview in panel) */
  width?: number;
  height?: number;
  /** Called when user chooses to use this as the page background */
  onUseAsBackground?: () => void;
  /** Whether "generated" is the current background style (show as selected) */
  isActive?: boolean;
  className?: string;
}

export function BackgroundPreview({
  imageUrl,
  palette: paletteProp,
  width = 320,
  height = 180,
  onUseAsBackground,
  isActive = false,
  className = '',
}: BackgroundPreviewProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localPalette, setLocalPalette] = useState<ColorPalette | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        let palette = paletteProp ?? localPalette;
        if (!palette && imageUrl) {
          const extracted = await extractPaletteFromImage(imageUrl);
          if (cancelled) return;
          setLocalPalette(extracted);
          palette = extracted;
        }
        if (!palette) {
          setError('No palette');
          return;
        }
        const url = await generateDashboardBackground(imageUrl, colorPaletteToPalette(palette), {
          width,
          height,
        });
        if (cancelled) return;
        setDataUrl(url);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to generate');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [imageUrl, paletteProp, width, height]);

  if (error) {
    return (
      <div
        className={`rounded-lg border border-cyber-border bg-cyber-darker/50 p-3 text-xs text-cyber-muted ${className}`}
      >
        Generated background unavailable: {error}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className="rounded-lg border border-cyber-border overflow-hidden bg-cyber-darker/50"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-cyber-muted text-xs">
            Generating…
          </div>
        ) : dataUrl ? (
          <img
            src={dataUrl}
            alt="Generated background preview"
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      {onUseAsBackground && dataUrl && (
        <button
          type="button"
          onClick={onUseAsBackground}
          className={`w-full py-2 rounded text-xs font-cyber transition-colors ${
            isActive
              ? 'bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/50'
              : 'bg-cyber-darker border border-cyber-border text-cyber-text hover:border-cyber-glow/50'
          }`}
        >
          {isActive ? 'Using generated background' : 'Use as background'}
        </button>
      )}
    </div>
  );
}
