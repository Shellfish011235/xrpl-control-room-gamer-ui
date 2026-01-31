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

  // Create immersive NFT background if enabled
  if (theme.effects.enableWatermark && theme.nftImageUrl) {
    createWatermark(theme.nftImageUrl, theme.colors);
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
 * Create immersive NFT-inspired background
 * Multiple layers for a rich, dimensional ambient effect
 */
function createWatermark(imageUrl: string, colors: ThemeProfile['colors']): void {
  // Create container for all background layers
  const bgContainer = document.createElement('div');
  bgContainer.id = 'theme-watermark';
  bgContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  `;

  // Layer 1: Base gradient from NFT colors
  const gradientLayer = document.createElement('div');
  gradientLayer.style.cssText = `
    position: absolute;
    top: -50%;
    left: -50%;
    right: -50%;
    bottom: -50%;
    background: 
      radial-gradient(ellipse at 20% 20%, ${colors.primary}15 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, ${colors.accent}12 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, ${colors.highlight}10 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, ${colors.primary}08 0%, transparent 40%),
      linear-gradient(180deg, ${colors.background} 0%, ${colors.backgroundAlt} 100%);
    animation: gradientRotate 60s linear infinite;
  `;
  bgContainer.appendChild(gradientLayer);

  // Layer 2: Large blurred NFT image (main ambient)
  const nftAmbient = document.createElement('div');
  nftAmbient.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 150%;
    height: 150%;
    transform: translate(-50%, -50%);
    background-image: url(${imageUrl});
    background-size: cover;
    background-position: center;
    filter: blur(100px) saturate(1.8) brightness(0.6);
    opacity: 0.35;
    mix-blend-mode: screen;
    animation: ambientPulse 20s ease-in-out infinite;
  `;
  bgContainer.appendChild(nftAmbient);

  // Layer 3: Secondary NFT (offset, different blur)
  const nftSecondary = document.createElement('div');
  nftSecondary.style.cssText = `
    position: absolute;
    top: 30%;
    right: -20%;
    width: 80%;
    height: 80%;
    background-image: url(${imageUrl});
    background-size: cover;
    background-position: center;
    filter: blur(80px) saturate(2) hue-rotate(15deg);
    opacity: 0.2;
    mix-blend-mode: overlay;
    animation: ambientDrift 30s ease-in-out infinite;
  `;
  bgContainer.appendChild(nftSecondary);

  // Layer 4: Animated color orbs
  const orbColors = [colors.primary, colors.accent, colors.highlight];
  orbColors.forEach((color, i) => {
    const orb = document.createElement('div');
    const size = 300 + i * 100;
    const positions = [
      { top: '20%', left: '10%' },
      { top: '60%', right: '5%' },
      { bottom: '10%', left: '30%' }
    ];
    orb.style.cssText = `
      position: absolute;
      ${Object.entries(positions[i]).map(([k, v]) => `${k}: ${v}`).join('; ')};
      width: ${size}px;
      height: ${size}px;
      background: radial-gradient(circle, ${color}40 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(60px);
      animation: orbFloat${i} ${25 + i * 5}s ease-in-out infinite;
    `;
    bgContainer.appendChild(orb);
  });

  // Layer 5: Vignette overlay
  const vignette = document.createElement('div');
  vignette.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(ellipse at center, transparent 0%, transparent 40%, ${colors.background}90 100%);
    pointer-events: none;
  `;
  bgContainer.appendChild(vignette);

  // Layer 6: Subtle scanlines for cyber effect
  const scanlines = document.createElement('div');
  scanlines.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      ${colors.background}08 2px,
      ${colors.background}08 4px
    );
    pointer-events: none;
    opacity: 0.5;
  `;
  bgContainer.appendChild(scanlines);

  // Add animation keyframes
  if (!document.getElementById('theme-animations')) {
    const style = document.createElement('style');
    style.id = 'theme-animations';
    style.textContent = `
      @keyframes gradientRotate {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.1); }
        100% { transform: rotate(360deg) scale(1); }
      }
      
      @keyframes ambientPulse {
        0%, 100% { 
          transform: translate(-50%, -50%) scale(1); 
          opacity: 0.35;
          filter: blur(100px) saturate(1.8) brightness(0.6);
        }
        50% { 
          transform: translate(-50%, -50%) scale(1.1); 
          opacity: 0.4;
          filter: blur(120px) saturate(2) brightness(0.7);
        }
      }
      
      @keyframes ambientDrift {
        0%, 100% { 
          transform: translate(0, 0) scale(1);
          opacity: 0.2;
        }
        33% { 
          transform: translate(-5%, 3%) scale(1.05);
          opacity: 0.25;
        }
        66% { 
          transform: translate(3%, -2%) scale(0.98);
          opacity: 0.18;
        }
      }
      
      @keyframes orbFloat0 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(30px, -20px) scale(1.1); }
        50% { transform: translate(-20px, 30px) scale(0.95); }
        75% { transform: translate(15px, 15px) scale(1.05); }
      }
      
      @keyframes orbFloat1 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(-40px, 20px) scale(1.15); }
        66% { transform: translate(25px, -30px) scale(0.9); }
      }
      
      @keyframes orbFloat2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(50px, -40px) scale(1.2); }
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
          color-mix(in srgb, var(--theme-surface) 85%, transparent) 0%, 
          color-mix(in srgb, var(--theme-background-alt) 90%, transparent) 100%
        );
        border-color: color-mix(in srgb, var(--theme-primary) 40%, transparent);
        backdrop-filter: blur(10px);
      }
      
      body.themed .cyber-panel::before {
        background: linear-gradient(90deg, transparent, var(--theme-primary), transparent);
      }
      
      body.themed .cyber-glow {
        box-shadow: 
          0 0 15px color-mix(in srgb, var(--theme-glow) calc(var(--theme-glow-opacity) * 100%), transparent),
          0 0 30px color-mix(in srgb, var(--theme-glow) calc(var(--theme-glow-opacity) * 60%), transparent),
          inset 0 0 30px color-mix(in srgb, var(--theme-glow) 15%, transparent);
        animation: glowPulse 4s ease-in-out infinite;
      }
      
      body.themed .cyber-progress-bar {
        background: linear-gradient(90deg, var(--theme-primary), var(--theme-accent), var(--theme-highlight));
        background-size: 200% 100%;
        animation: gradientShift 3s ease infinite;
        box-shadow: 0 0 15px var(--theme-glow);
      }
      
      body.themed .cyber-btn {
        background: linear-gradient(135deg, var(--theme-surface-light) 0%, var(--theme-surface) 100%);
        border-color: var(--theme-primary);
        backdrop-filter: blur(5px);
      }
      
      body.themed .cyber-btn:hover {
        box-shadow: 0 0 25px var(--theme-glow);
        border-color: var(--theme-highlight);
      }
      
      /* Ensure content stays above background */
      body.themed > *:not(#theme-watermark):not(#theme-particles) {
        position: relative;
        z-index: 1;
      }
      
      body.themed #root {
        position: relative;
        z-index: 1;
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(bgContainer);
}

/**
 * Create floating particle effects with variety
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
    z-index: 2;
    overflow: hidden;
  `;

  // Mix of particle types
  const particleTypes = [
    { shape: 'circle', sizeRange: [2, 5], glowMultiplier: 2 },
    { shape: 'circle', sizeRange: [1, 3], glowMultiplier: 3 },
    { shape: 'diamond', sizeRange: [3, 6], glowMultiplier: 1.5 },
  ];

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const type = particleTypes[i % particleTypes.length];
    const size = Math.random() * (type.sizeRange[1] - type.sizeRange[0]) + type.sizeRange[0];
    const color = Math.random() > 0.6 ? primaryColor : accentColor;
    const left = Math.random() * 100;
    const delay = Math.random() * 25;
    const duration = Math.random() * 25 + 20;
    const drift = (Math.random() - 0.5) * 200; // Horizontal drift
    
    let shapeStyles = '';
    if (type.shape === 'diamond') {
      shapeStyles = `
        width: ${size}px;
        height: ${size}px;
        transform: rotate(45deg);
        border-radius: 2px;
      `;
    } else {
      shapeStyles = `
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
      `;
    }
    
    particle.style.cssText = `
      position: absolute;
      ${shapeStyles}
      background: ${color};
      left: ${left}%;
      bottom: -20px;
      opacity: 0;
      box-shadow: 
        0 0 ${size * type.glowMultiplier}px ${color},
        0 0 ${size * type.glowMultiplier * 2}px ${color}40;
      animation: particleRise${i % 3} ${duration}s ease-out ${delay}s infinite;
      --drift: ${drift}px;
    `;
    
    container.appendChild(particle);
  }
  
  // Add particle animation variants
  const particleStyles = document.createElement('style');
  particleStyles.id = 'theme-particle-animations';
  particleStyles.textContent = `
    @keyframes particleRise0 {
      0% { 
        transform: translateY(0) translateX(0) scale(0); 
        opacity: 0; 
      }
      10% { 
        opacity: 0.9;
        transform: translateY(-10vh) translateX(calc(var(--drift) * 0.1)) scale(1);
      }
      90% { 
        opacity: 0.6;
        transform: translateY(-90vh) translateX(calc(var(--drift) * 0.9)) scale(0.8);
      }
      100% { 
        transform: translateY(-100vh) translateX(var(--drift)) scale(0); 
        opacity: 0; 
      }
    }
    
    @keyframes particleRise1 {
      0% { 
        transform: translateY(0) translateX(0) rotate(0deg) scale(0); 
        opacity: 0; 
      }
      15% { 
        opacity: 1;
        transform: translateY(-15vh) translateX(calc(var(--drift) * 0.15)) rotate(90deg) scale(1);
      }
      85% { 
        opacity: 0.5;
        transform: translateY(-85vh) translateX(calc(var(--drift) * 0.85)) rotate(270deg) scale(0.6);
      }
      100% { 
        transform: translateY(-100vh) translateX(var(--drift)) rotate(360deg) scale(0); 
        opacity: 0; 
      }
    }
    
    @keyframes particleRise2 {
      0% { 
        transform: translateY(0) translateX(0) scale(0); 
        opacity: 0; 
      }
      5% { 
        opacity: 0.7;
        transform: translateY(-5vh) translateX(calc(var(--drift) * 0.05)) scale(1.2);
      }
      50% {
        opacity: 0.8;
        transform: translateY(-50vh) translateX(calc(var(--drift) * 0.5 + 20px)) scale(1);
      }
      95% { 
        opacity: 0.3;
        transform: translateY(-95vh) translateX(calc(var(--drift) * 0.95)) scale(0.5);
      }
      100% { 
        transform: translateY(-100vh) translateX(var(--drift)) scale(0); 
        opacity: 0; 
      }
    }
  `;
  
  // Remove old particle animations if they exist
  document.getElementById('theme-particle-animations')?.remove();
  document.head.appendChild(particleStyles);
  
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
