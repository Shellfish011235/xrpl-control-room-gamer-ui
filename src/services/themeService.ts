/**
 * Premium Theme Service - Luxury NFT-based UI Customization
 * 
 * Think Chanel, Louis Vuitton - exclusive, personalized, status-symbol quality.
 * 
 * Features:
 * - Rich color palette extraction (primary, accent, highlight, glow)
 * - Animated gradient backgrounds
 * - NFT watermark/ambient backgrounds  
 * - Custom glow and particle effects
 * - Holographic accents and animated borders
 * - Premium "Themed by [NFT]" badge
 * - Safety colors (danger/warning/confirm) remain locked
 */

export interface ColorPalette {
  dominant: string;
  secondary: string;
  accent: string;
  highlight: string;
  background: string;
  surface: string;
  muted: string;
}

export interface ThemeProfile {
  id: string;
  nftTokenId: string;
  nftName: string;
  nftImageUrl: string;
  colors: {
    primary: string;       // Main brand color
    accent: string;        // Secondary accent
    highlight: string;     // Bright highlight for glows
    glow: string;          // Neon glow color (brightest)
    surface: string;       // Panel/card surfaces
    surfaceLight: string;  // Lighter surface variant
    background: string;    // Deep background
    backgroundAlt: string; // Alternate background for gradients
    text: string;          // Primary text
    textMuted: string;     // Muted/secondary text
  };
  effects: {
    glowIntensity: 'subtle' | 'medium' | 'intense';
    animationSpeed: 'slow' | 'normal' | 'fast';
    particleCount: number;
    enableWatermark: boolean;
    enableParticles: boolean;
    enableAnimatedBorders: boolean;
    enableGradientPanels: boolean;
  };
  createdAt: number;
}

// Default cyberpunk theme - the original aesthetic
export const CYBERPUNK_THEME: ThemeProfile = {
  id: 'default_cyberpunk',
  nftTokenId: '',
  nftName: 'Cyberpunk Default',
  nftImageUrl: '',
  colors: {
    primary: '#00d4ff',
    accent: '#a855f7',
    highlight: '#00ffff',
    glow: '#00d4ff',
    surface: '#111827',
    surfaceLight: '#1e293b',
    background: '#050810',
    backgroundAlt: '#0a0f1a',
    text: '#e0e7ff',
    textMuted: '#64748b',
  },
  effects: {
    glowIntensity: 'medium',
    animationSpeed: 'normal',
    particleCount: 30,
    enableWatermark: false,
    enableParticles: false,
    enableAnimatedBorders: true,
    enableGradientPanels: false,
  },
  createdAt: 0,
};

// Safety colors - NEVER override these
const LOCKED_COLORS = {
  danger: '#ff4444',
  warning: '#ffd700',
  confirm: '#00ff88',
};

/**
 * Extract a rich color palette from an image URL
 * Uses canvas sampling with vibrance detection for luxury-quality colors
 */
export async function extractPaletteFromImage(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Higher resolution for better color detection
        const sampleSize = 100;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;

        // Collect colors with saturation/vibrance weighting
        const colorData: Array<{ r: number; g: number; b: number; count: number; vibrance: number }> = [];
        const colorMap = new Map<string, { r: number; g: number; b: number; count: number; vibrance: number }>();
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          
          if (a < 128) continue;
          
          // Quantize
          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          
          // Calculate vibrance (saturation * brightness balance)
          const max = Math.max(qr, qg, qb);
          const min = Math.min(qr, qg, qb);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const brightness = (qr + qg + qb) / 3;
          const vibrance = saturation * (1 - Math.abs(brightness - 128) / 128);
          
          const key = `${qr},${qg},${qb}`;
          const existing = colorMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            colorMap.set(key, { r: qr, g: qg, b: qb, count: 1, vibrance });
          }
        }

        // Convert to array and sort by weighted score (count * vibrance bonus)
        colorMap.forEach((value) => colorData.push(value));
        colorData.sort((a, b) => {
          const scoreA = a.count * (1 + a.vibrance * 2);
          const scoreB = b.count * (1 + b.vibrance * 2);
          return scoreB - scoreA;
        });

        // Filter for usable colors (not too dark, not too light)
        const usableColors = colorData.filter(c => {
          const brightness = (c.r + c.g + c.b) / 3;
          return brightness > 25 && brightness < 235;
        });

        // Get vibrant colors for accents
        const vibrantColors = usableColors.filter(c => c.vibrance > 0.2).slice(0, 5);
        
        // Fallback colors
        const colors = vibrantColors.length >= 3 ? vibrantColors : usableColors.slice(0, 5);

        const toHex = (c: { r: number; g: number; b: number }) => 
          `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;

        const dominant = colors[0] || { r: 0, g: 212, b: 255 };
        const secondary = colors[1] || colors[0] || { r: 168, g: 85, b: 247 };
        const accent = colors[2] || colors[1] || { r: 0, g: 255, b: 136 };
        const highlight = colors[3] || colors[0] || { r: 255, g: 215, b: 0 };

        // Compute darker variants for backgrounds
        const background = {
          r: Math.max(5, Math.floor(dominant.r * 0.06)),
          g: Math.max(8, Math.floor(dominant.g * 0.06)),
          b: Math.max(16, Math.floor(dominant.b * 0.08)),
        };
        
        const surface = {
          r: Math.max(17, Math.floor(dominant.r * 0.12)),
          g: Math.max(24, Math.floor(dominant.g * 0.12)),
          b: Math.max(39, Math.floor(dominant.b * 0.15)),
        };

        // Muted color for secondary text
        const muted = {
          r: Math.min(255, Math.floor(dominant.r * 0.4 + 80)),
          g: Math.min(255, Math.floor(dominant.g * 0.4 + 80)),
          b: Math.min(255, Math.floor(dominant.b * 0.4 + 100)),
        };

        resolve({
          dominant: toHex(dominant),
          secondary: toHex(secondary),
          accent: toHex(accent),
          highlight: toHex(highlight),
          background: toHex(background),
          surface: toHex(surface),
          muted: toHex(muted),
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for palette extraction'));
    };

    img.src = imageUrl;
  });
}

/**
 * Build a premium theme profile from an extracted palette
 */
export function buildThemeProfileFromPalette(
  palette: ColorPalette,
  nftTokenId: string,
  nftName: string,
  nftImageUrl: string
): ThemeProfile {
  // Compute text color based on background brightness
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 224, g: 231, b: 255 };
  };

  const dominantRgb = hexToRgb(palette.dominant);
  const brightness = (dominantRgb.r * 299 + dominantRgb.g * 587 + dominantRgb.b * 114) / 1000;
  const textColor = '#e0e7ff'; // Always light text on our dark backgrounds

  // Calculate glow color (brightest, most saturated version)
  const glowColor = adjustSaturation(adjustBrightness(palette.dominant, 1.4), 1.3);

  // Determine effect intensity based on color vibrance
  const avgVibrance = calculateVibrance(palette.dominant);
  const glowIntensity: ThemeProfile['effects']['glowIntensity'] = 
    avgVibrance > 0.5 ? 'intense' : avgVibrance > 0.25 ? 'medium' : 'subtle';

  return {
    id: `theme_${nftTokenId}_${Date.now()}`,
    nftTokenId,
    nftName,
    nftImageUrl,
    colors: {
      primary: palette.dominant,
      accent: palette.secondary,
      highlight: palette.highlight,
      glow: glowColor,
      surface: palette.surface,
      surfaceLight: adjustBrightness(palette.surface, 1.5),
      background: palette.background,
      backgroundAlt: adjustBrightness(palette.background, 1.3),
      text: textColor,
      textMuted: palette.muted,
    },
    effects: {
      glowIntensity,
      animationSpeed: 'normal',
      particleCount: 25,
      enableWatermark: true,
      enableParticles: true,
      enableAnimatedBorders: true,
      enableGradientPanels: true,
    },
    createdAt: Date.now(),
  };
}

/**
 * Apply a premium theme to CSS variables and effects
 */
export function applyThemeToCssVars(theme: ThemeProfile | null): void {
  const root = document.documentElement;
  const body = document.body;
  
  // Remove any existing theme elements
  document.getElementById('theme-watermark')?.remove();
  document.getElementById('theme-particles')?.remove();
  document.getElementById('theme-badge')?.remove();

  if (!theme || theme.id === 'default_cyberpunk') {
    // Reset to cyberpunk defaults
    resetToCyberpunkDefaults(root);
    body.classList.remove('themed');
    body.classList.add('cyberpunk-default');
    console.log('[ThemeService] Reset to Cyberpunk default');
    return;
  }

  body.classList.remove('cyberpunk-default');
  body.classList.add('themed');

  // Apply color variables
  root.style.setProperty('--theme-primary', theme.colors.primary);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  root.style.setProperty('--theme-highlight', theme.colors.highlight);
  root.style.setProperty('--theme-glow', theme.colors.glow);
  root.style.setProperty('--theme-surface', theme.colors.surface);
  root.style.setProperty('--theme-surface-light', theme.colors.surfaceLight);
  root.style.setProperty('--theme-background', theme.colors.background);
  root.style.setProperty('--theme-background-alt', theme.colors.backgroundAlt);
  root.style.setProperty('--theme-text', theme.colors.text);
  root.style.setProperty('--theme-text-muted', theme.colors.textMuted);
  
  // Update cyber colors to theme
  root.style.setProperty('--cyber-glow', theme.colors.primary);
  root.style.setProperty('--cyber-purple', theme.colors.accent);
  root.style.setProperty('--cyber-cyan', theme.colors.highlight);
  root.style.setProperty('--cyber-blue', theme.colors.primary);

  // Glow intensity
  const glowOpacity = theme.effects.glowIntensity === 'intense' ? 0.6 
    : theme.effects.glowIntensity === 'medium' ? 0.4 : 0.2;
  root.style.setProperty('--theme-glow-opacity', glowOpacity.toString());

  // Animation speed
  const animSpeed = theme.effects.animationSpeed === 'fast' ? '10s' 
    : theme.effects.animationSpeed === 'slow' ? '30s' : '20s';
  root.style.setProperty('--theme-animation-speed', animSpeed);

  // Create watermark background if enabled
  if (theme.effects.enableWatermark && theme.nftImageUrl) {
    createWatermark(theme.nftImageUrl, theme.colors.primary);
  }

  // Create floating particles if enabled
  if (theme.effects.enableParticles) {
    createParticles(theme.colors.primary, theme.colors.accent, theme.effects.particleCount);
  }

  console.log('[ThemeService] Applied premium theme:', theme.nftName, theme.colors);
}

/**
 * Reset to cyberpunk default theme
 */
function resetToCyberpunkDefaults(root: HTMLElement): void {
  const cyber = CYBERPUNK_THEME.colors;
  
  root.style.setProperty('--theme-primary', cyber.primary);
  root.style.setProperty('--theme-accent', cyber.accent);
  root.style.setProperty('--theme-highlight', cyber.highlight);
  root.style.setProperty('--theme-glow', cyber.glow);
  root.style.setProperty('--theme-surface', cyber.surface);
  root.style.setProperty('--theme-surface-light', cyber.surfaceLight);
  root.style.setProperty('--theme-background', cyber.background);
  root.style.setProperty('--theme-background-alt', cyber.backgroundAlt);
  root.style.setProperty('--theme-text', cyber.text);
  root.style.setProperty('--theme-text-muted', cyber.textMuted);
  
  root.style.setProperty('--cyber-glow', '#00d4ff');
  root.style.setProperty('--cyber-purple', '#a855f7');
  root.style.setProperty('--cyber-cyan', '#00ffff');
  root.style.setProperty('--cyber-blue', '#00aaff');
  
  root.style.setProperty('--theme-glow-opacity', '0.4');
  root.style.setProperty('--theme-animation-speed', '20s');
}

/**
 * Create ambient NFT watermark background
 */
function createWatermark(imageUrl: string, tintColor: string): void {
  const watermark = document.createElement('div');
  watermark.id = 'theme-watermark';
  watermark.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.04;
    background-image: url(${imageUrl});
    background-size: 60% auto;
    background-position: center center;
    background-repeat: no-repeat;
    filter: blur(40px) saturate(1.5);
    mix-blend-mode: screen;
    animation: watermarkFloat 30s ease-in-out infinite;
  `;
  
  // Add animation keyframes
  if (!document.getElementById('theme-animations')) {
    const style = document.createElement('style');
    style.id = 'theme-animations';
    style.textContent = `
      @keyframes watermarkFloat {
        0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.04; }
        25% { transform: scale(1.05) translate(2%, 1%); opacity: 0.05; }
        50% { transform: scale(1.1) translate(0, 2%); opacity: 0.06; }
        75% { transform: scale(1.05) translate(-2%, 1%); opacity: 0.05; }
      }
      
      @keyframes particleFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
        10% { opacity: 0.8; }
        90% { opacity: 0.8; }
        100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
      }
      
      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 20px var(--theme-glow), 0 0 40px color-mix(in srgb, var(--theme-glow) 50%, transparent); }
        50% { box-shadow: 0 0 30px var(--theme-glow), 0 0 60px color-mix(in srgb, var(--theme-glow) 70%, transparent); }
      }
      
      @keyframes borderGlow {
        0%, 100% { border-color: var(--theme-primary); }
        50% { border-color: var(--theme-accent); }
      }
      
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      
      body.themed .cyber-panel {
        background: linear-gradient(
          135deg, 
          color-mix(in srgb, var(--theme-surface) 90%, transparent) 0%, 
          color-mix(in srgb, var(--theme-background-alt) 95%, transparent) 100%
        );
        border-color: color-mix(in srgb, var(--theme-primary) 30%, transparent);
      }
      
      body.themed .cyber-panel::before {
        background: linear-gradient(90deg, transparent, var(--theme-primary), transparent);
      }
      
      body.themed .cyber-glow {
        box-shadow: 
          0 0 10px color-mix(in srgb, var(--theme-glow) calc(var(--theme-glow-opacity) * 100%), transparent),
          0 0 20px color-mix(in srgb, var(--theme-glow) calc(var(--theme-glow-opacity) * 50%), transparent),
          inset 0 0 20px color-mix(in srgb, var(--theme-glow) 10%, transparent);
        animation: glowPulse 4s ease-in-out infinite;
      }
      
      body.themed .cyber-progress-bar {
        background: linear-gradient(90deg, var(--theme-primary), var(--theme-accent));
        box-shadow: 0 0 10px var(--theme-glow);
      }
      
      body.themed .cyber-btn {
        background: linear-gradient(135deg, var(--theme-surface-light) 0%, var(--theme-surface) 100%);
        border-color: var(--theme-primary);
      }
      
      body.themed .cyber-btn:hover {
        box-shadow: 0 0 20px var(--theme-glow);
        border-color: var(--theme-highlight);
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(watermark);
}

/**
 * Create floating particle effects
 */
function createParticles(primaryColor: string, accentColor: string, count: number): void {
  const container = document.createElement('div');
  container.id = 'theme-particles';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
  `;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 4 + 2;
    const color = Math.random() > 0.5 ? primaryColor : accentColor;
    const left = Math.random() * 100;
    const delay = Math.random() * 20;
    const duration = Math.random() * 20 + 15;
    
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      left: ${left}%;
      bottom: -10px;
      opacity: 0;
      box-shadow: 0 0 ${size * 2}px ${color};
      animation: particleFloat ${duration}s ease-in-out ${delay}s infinite;
    `;
    
    container.appendChild(particle);
  }
  
  document.body.appendChild(container);
}

/**
 * Adjust brightness of a hex color
 */
function adjustBrightness(hex: string, factor: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = Math.min(255, Math.max(0, Math.floor(parseInt(result[1], 16) * factor)));
  const g = Math.min(255, Math.max(0, Math.floor(parseInt(result[2], 16) * factor)));
  const b = Math.min(255, Math.max(0, Math.floor(parseInt(result[3], 16) * factor)));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Adjust saturation of a hex color
 */
function adjustSaturation(hex: string, factor: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);
  
  const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
  
  r = Math.min(255, Math.max(0, Math.floor(gray + factor * (r - gray))));
  g = Math.min(255, Math.max(0, Math.floor(gray + factor * (g - gray))));
  b = Math.min(255, Math.max(0, Math.floor(gray + factor * (b - gray))));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Calculate vibrance of a color (saturation * brightness balance)
 */
function calculateVibrance(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const brightness = (r + g + b) / 3 / 255;
  
  return saturation * (1 - Math.abs(brightness - 0.5) * 2);
}

/**
 * Get the default cyberpunk theme
 */
export function getDefaultTheme(): ThemeProfile {
  return CYBERPUNK_THEME;
}

// Export locked safety colors for reference
export { LOCKED_COLORS };
