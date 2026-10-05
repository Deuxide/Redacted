export const THEME_KEY = 'undercover.theme.v1';

export const PRESETS = [
  { id: 'amber', color: '#f0b429' },
  { id: 'ocean', color: '#3b82f6' },
  { id: 'purple', color: '#8b5cf6' },
  { id: 'forest', color: '#22c55e' },
  { id: 'sunset', color: '#f97316' },
  { id: 'rose', color: '#f43f5e' },
] as const;

export type PresetId = (typeof PRESETS)[number]['id'] | 'custom';

export interface ThemeChoice {
  preset: PresetId;
  color: string;
}

export const DEFAULT_THEME: ThemeChoice = { preset: 'amber', color: '#f0b429' };

export function readTheme(): ThemeChoice {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw) as Partial<ThemeChoice>;
    const color = normalizeHex(parsed.color);
    if (!color) return DEFAULT_THEME;
    const preset = PRESETS.some((item) => item.id === parsed.preset) || parsed.preset === 'custom' ? parsed.preset : 'custom';
    return { preset: preset ?? 'custom', color };
  } catch {
    return DEFAULT_THEME;
  }
}

export function writeTheme(theme: ThemeChoice): void {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  } catch {
    // Theme still applies for this visit.
  }
}

export function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^#?([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toLowerCase()}` : null;
}

export function contrastText(hex: string): string {
  const rgb = hexToRgb(hex);
  return relativeLuminance(rgb) > 0.42 ? '#1b1403' : '#f7f4ee';
}

export function applyTheme(theme: ThemeChoice): void {
  const color = normalizeHex(theme.color) ?? DEFAULT_THEME.color;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', color);
  root.style.setProperty('--accent', color);
  root.style.setProperty('--color-primary-text', contrastText(color));
  root.style.setProperty('--on-accent', contrastText(color));
  root.style.setProperty('--focus', color);
}

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function relativeLuminance([red, green, blue]: [number, number, number]): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}
