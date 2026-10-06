import { useColorScheme } from 'react-native';

const light = {
  bg: '#FAFAFA', surface: '#FFFFFF', surfaceAlt: '#F4F4F5', border: '#EAEAEA', borderStrong: '#D4D4D8',
  text: '#0A0A0A', muted: '#666666', faint: '#A1A1AA',
  primary: '#0A0A0A', onPrimary: '#FFFFFF', accent: '#0070F3',
  under_budget: '#0A7F3F', on_budget: '#B45309', over_budget: '#DC2626',
  under_budget_bg: '#E7F7EE', on_budget_bg: '#FEF3C7', over_budget_bg: '#FEE2E2',
  danger: '#DC2626', overlay: 'rgba(250,250,250,0.94)',
};
const dark: typeof light = {
  bg: '#000000', surface: '#0A0A0A', surfaceAlt: '#171717', border: '#262626', borderStrong: '#3F3F46',
  text: '#EDEDED', muted: '#A1A1A1', faint: '#6B6B73',
  primary: '#EDEDED', onPrimary: '#0A0A0A', accent: '#3291FF',
  under_budget: '#4ADE80', on_budget: '#FBBF24', over_budget: '#F87171',
  under_budget_bg: '#052E16', on_budget_bg: '#422006', over_budget_bg: '#450A0A',
  danger: '#F87171', overlay: 'rgba(0,0,0,0.94)',
};

export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);

export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
} as const;

export const categoryColors = {
  accommodation: '#0070F3',
  food: '#F5A623',
  activities: '#7928CA',
  transit: '#10B981',
} as const;

export const money = (n: number, currency: string) =>
  `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const GRADIENTS: [string, string][] = [
  ['#FF6B6B', '#F7B267'], ['#4F46E5', '#06B6D4'], ['#0F766E', '#84CC16'],
  ['#BE185D', '#F97316'], ['#1D4ED8', '#A855F7'], ['#0EA5E9', '#10B981'],
  ['#7C3AED', '#EC4899'], ['#B45309', '#EAB308'],
];
/** Stable gradient per destination so each trip has its own identity. */
export function gradientFor(name: string): [string, string] {
  let h = 0;
  for (const c of name.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}
