// src/lib/themes.ts
export interface ThemeConfig {
  name: string;
  label: string;
  colors: {
    background: string;
    backgroundSecondary: string;
    cardBackground: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
    primaryDark: string;
    primaryLight: string;
    accent?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
}

export const themes: Record<string, ThemeConfig> = {
  blue: {
    name: 'blue',
    label: 'Ocean Breeze',
    colors: {
      background: '#0a0f1c',
      backgroundSecondary: '#1a1a2e',
      cardBackground: 'rgba(15, 23, 42, 0.85)',
      cardBorder: 'rgba(30, 58, 138, 0.2)',
      textPrimary: '#e2e8f0',
      textSecondary: '#94a3b8',
      primary: '#3b82f6',
      primaryDark: '#1e3a8a',
      primaryLight: '#bfdbfe',
      accent: '#10b981'
    },
    fonts: {
      heading: "'Space Grotesk', sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }
  },
  wood: {
    name: 'wood',
    label: 'Natural Wood',
    colors: {
      background: '#f5f1e6',
      backgroundSecondary: '#e8e0d4',
      cardBackground: '#fff9f0',
      cardBorder: '#d7ccc8',
      textPrimary: '#5d4037',
      textSecondary: '#8d6e63',
      primary: '#8d6e63',
      primaryDark: '#6d4c41',
      primaryLight: '#d7ccc8',
      accent: '#66bb6a'
    },
    fonts: {
      heading: "'Playfair Display', serif",
      body: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }
  }
  // Add more themes here
};

export type ThemeName = keyof typeof themes;