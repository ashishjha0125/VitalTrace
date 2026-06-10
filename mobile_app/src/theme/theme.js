// VitalTrace Design System - Matching Reference Design
export const Theme = {
  colors: {
    primary: '#FF453A',          // Red accent (from design images)
    primaryDim: 'rgba(255, 59, 48, 0.12)',
    primaryGlow: 'rgba(255, 59, 48, 0.4)',
    secondary: '#007AFF',        // Blue
    secondaryDim: 'rgba(0, 122, 255, 0.12)',
    accent: '#00E5FF',           // Cyan for ECG line
    accentDim: 'rgba(0, 229, 255, 0.12)',

    background: '#000000',       // Pure black
    surface: '#0D0D0D',
    surfaceLow: '#1A1A1A',
    surfaceMid: '#222222',
    surfaceHigh: '#333333',

    error: '#FF3B30',
    errorDim: 'rgba(255, 59, 48, 0.12)',
    warning: '#FF9500',
    warningDim: 'rgba(255, 149, 0, 0.12)',
    success: '#34C759',
    successDim: 'rgba(52, 199, 89, 0.12)',
    live: '#39FF14',
    liveDim: 'rgba(57, 255, 20, 0.12)',
    ai: '#10B981',
    aiDim: 'rgba(16, 185, 129, 0.12)',

    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textMuted: '#636366',
    border: '#2C2C2E',
    outline: '#2C2C2E',
    outlineFocus: '#FF3B30',

    ecgLine: '#00E5FF',
    ecgGlow: 'rgba(0, 229, 255, 0.5)',
    grid: 'rgba(0, 229, 255, 0.05)',
    gridMajor: 'rgba(0, 229, 255, 0.1)',

    tabActive: '#FF3B30',
    tabInactive: '#636366',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  roundness: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
  },
  fonts: {
    display: 'System',
    body: 'System',
    label: 'System',
    mono: 'monospace',
  },
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    glow: {
      shadowColor: '#FF3B30',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
  },
};
