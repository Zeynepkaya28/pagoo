export type UIStyle = 'ios' | 'android' | 'harmony';
export type Scheme = 'light' | 'dark';

export interface Palette {
  bg: string;
  bgElevated: string;
  card: string;
  cardAlt: string;
  text: string;
  textSoft: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  onPrimarySoft: string;
  accent: string;
  danger: string;
  success: string;
  warning: string;
  star: string;
  tabBar: string;
  overlay: string;
  gradient: [string, string, string];
  aurora: [string, string, string];
  shadow: string;
}

export interface Shape {
  radiusSm: number;
  radius: number;
  radiusLg: number;
  radiusSheet: number;
  button: number;
  buttonHeight: number;
  input: number;
  inputHeight: number;
  tabBarHeight: number;
}

export interface Typo {
  ui: string;
  uiMedium: string;
  uiBold: string;
  display: string;
  displayItalic: string;
  largeTitle: number;
  largeTitleWeight: '400' | '600' | '700' | '800';
  title: number;
  body: number;
  caption: number;
  letterSpacingTitle: number;
}

export interface Theme {
  style: UIStyle;
  scheme: Scheme;
  c: Palette;
  shape: Shape;
  font: Typo;
}

const ios: Record<Scheme, Palette> = {
  light: {
    bg: '#F2F2F7', bgElevated: '#FFFFFF', card: '#FFFFFF', cardAlt: '#EFEFF4',
    text: '#0B0B0F', textSoft: '#3C3C43', textMuted: '#8A8A8E', border: 'rgba(60,60,67,0.16)',
    primary: '#5B4BDB', onPrimary: '#FFFFFF', primarySoft: '#ECE9FF', onPrimarySoft: '#3B2DB0',
    accent: '#FF5A7A', danger: '#FF3B30', success: '#34C759', warning: '#FF9500', star: '#FFB800',
    tabBar: 'rgba(249,249,251,0.82)', overlay: 'rgba(0,0,0,0.35)',
    gradient: ['#6A5BFF', '#B05CFF', '#FF6A88'], aurora: ['#A99BFF', '#FFB4C8', '#9FE3FF'],
    shadow: '#1B1446',
  },
  dark: {
    bg: '#000000', bgElevated: '#1C1C1E', card: '#1C1C1E', cardAlt: '#2C2C2E',
    text: '#FFFFFF', textSoft: '#EBEBF5', textMuted: '#8D8D93', border: 'rgba(84,84,88,0.5)',
    primary: '#8E80FF', onPrimary: '#0B0820', primarySoft: '#2A2550', onPrimarySoft: '#CFC8FF',
    accent: '#FF6B8B', danger: '#FF453A', success: '#30D158', warning: '#FF9F0A', star: '#FFC933',
    tabBar: 'rgba(22,22,24,0.78)', overlay: 'rgba(0,0,0,0.55)',
    gradient: ['#5B4BDB', '#9B4BFF', '#FF5A7A'], aurora: ['#3B2DB0', '#7A1E58', '#0B4E6B'],
    shadow: '#000000',
  },
};

// Material 3 tonal palette (seed: plum violet)
const android: Record<Scheme, Palette> = {
  light: {
    bg: '#FEF7FF', bgElevated: '#F7F2FA', card: '#F3EDF7', cardAlt: '#ECE6F0',
    text: '#1D1B20', textSoft: '#49454F', textMuted: '#79747E', border: '#CAC4D0',
    primary: '#65558F', onPrimary: '#FFFFFF', primarySoft: '#E9DDFF', onPrimarySoft: '#21005D',
    accent: '#7D5260', danger: '#B3261E', success: '#386A20', warning: '#8C5000', star: '#E8A317',
    tabBar: '#F3EDF7', overlay: 'rgba(0,0,0,0.32)',
    gradient: ['#65558F', '#8E6FBF', '#D58FA7'], aurora: ['#D0BCFF', '#FFD8E4', '#C2E8D8'],
    shadow: '#21005D',
  },
  dark: {
    bg: '#141218', bgElevated: '#1D1B20', card: '#211F26', cardAlt: '#2B2930',
    text: '#E6E0E9', textSoft: '#CAC4D0', textMuted: '#938F99', border: '#49454F',
    primary: '#D0BCFE', onPrimary: '#381E72', primarySoft: '#4F378B', onPrimarySoft: '#EADDFF',
    accent: '#EFB8C8', danger: '#F2B8B5', success: '#9CD67D', warning: '#FFB870', star: '#F5C451',
    tabBar: '#211F26', overlay: 'rgba(0,0,0,0.5)',
    gradient: ['#4F378B', '#7B4F9E', '#B0607C'], aurora: ['#4F378B', '#633B48', '#1F4D3E'],
    shadow: '#000000',
  },
};

// HarmonyOS design (brand blue, layered surfaces)
const harmony: Record<Scheme, Palette> = {
  light: {
    bg: '#F1F3F5', bgElevated: '#FFFFFF', card: '#FFFFFF', cardAlt: '#E9ECF0',
    text: '#182431', textSoft: 'rgba(24,36,49,0.78)', textMuted: 'rgba(24,36,49,0.5)', border: 'rgba(24,36,49,0.1)',
    primary: '#0A59F7', onPrimary: '#FFFFFF', primarySoft: '#E3ECFE', onPrimarySoft: '#0A59F7',
    accent: '#00B8C2', danger: '#E84026', success: '#64BB5C', warning: '#ED6F21', star: '#FFAA00',
    tabBar: 'rgba(255,255,255,0.86)', overlay: 'rgba(0,0,0,0.3)',
    gradient: ['#0A59F7', '#3C8BFF', '#00C6CF'], aurora: ['#9FC2FF', '#A8F0EE', '#D9CCFF'],
    shadow: '#0A2A6B',
  },
  dark: {
    bg: '#000000', bgElevated: '#141414', card: '#1A1A1C', cardAlt: '#262629',
    text: 'rgba(255,255,255,0.92)', textSoft: 'rgba(255,255,255,0.72)', textMuted: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.1)',
    primary: '#317AF7', onPrimary: '#FFFFFF', primarySoft: '#10264F', onPrimarySoft: '#8BB4FF',
    accent: '#1DD3DC', danger: '#F06A55', success: '#7AD172', warning: '#F58F4B', star: '#FFBB33',
    tabBar: 'rgba(30,30,32,0.86)', overlay: 'rgba(0,0,0,0.55)',
    gradient: ['#1E4FD8', '#317AF7', '#0FB5BF'], aurora: ['#0E3A8F', '#06505A', '#2C1E66'],
    shadow: '#000000',
  },
};

export const palettes: Record<UIStyle, Record<Scheme, Palette>> = { ios, android, harmony };

export const shapes: Record<UIStyle, Shape> = {
  ios: { radiusSm: 8, radius: 12, radiusLg: 16, radiusSheet: 14, button: 12, buttonHeight: 50, input: 11, inputHeight: 48, tabBarHeight: 50 },
  android: { radiusSm: 8, radius: 12, radiusLg: 28, radiusSheet: 28, button: 100, buttonHeight: 48, input: 4, inputHeight: 56, tabBarHeight: 80 },
  harmony: { radiusSm: 12, radius: 20, radiusLg: 24, radiusSheet: 32, button: 100, buttonHeight: 44, input: 20, inputHeight: 48, tabBarHeight: 64 },
};

export const typography: Record<UIStyle, Typo> = {
  ios: {
    ui: 'System', uiMedium: 'System', uiBold: 'System',
    display: 'Fraunces_700Bold', displayItalic: 'Fraunces_400Regular_Italic',
    largeTitle: 34, largeTitleWeight: '800', title: 20, body: 16, caption: 13, letterSpacingTitle: 0.2,
  },
  android: {
    ui: 'PlusJakartaSans_400Regular', uiMedium: 'PlusJakartaSans_600SemiBold', uiBold: 'PlusJakartaSans_700Bold',
    display: 'Fraunces_600SemiBold', displayItalic: 'Fraunces_400Regular_Italic',
    largeTitle: 30, largeTitleWeight: '400', title: 20, body: 15, caption: 12.5, letterSpacingTitle: 0,
  },
  harmony: {
    ui: 'PlusJakartaSans_400Regular', uiMedium: 'PlusJakartaSans_600SemiBold', uiBold: 'PlusJakartaSans_800ExtraBold',
    display: 'Fraunces_700Bold', displayItalic: 'Fraunces_400Regular_Italic',
    largeTitle: 28, largeTitleWeight: '700', title: 19, body: 15, caption: 12.5, letterSpacingTitle: 0,
  },
};

export function buildTheme(style: UIStyle, scheme: Scheme): Theme {
  return { style, scheme, c: palettes[style][scheme], shape: shapes[style], font: typography[style] };
}

// Cover palettes for generated covers
export const coverPalettes: [string, string, string][] = [
  ['#1F3A5F', '#F2C14E', '#F7F1E3'],
  ['#7A1E2C', '#F4D6C6', '#FFF6EE'],
  ['#0F4C45', '#E8B04A', '#F3EEDF'],
  ['#2B1B4C', '#FF8C69', '#FDF0E6'],
  ['#3D2C1E', '#D9A441', '#F6EBD9'],
  ['#14213D', '#FCA311', '#E5E5E5'],
  ['#5C2751', '#F7C1BB', '#FFF4F2'],
  ['#264653', '#E9C46A', '#F4F1E8'],
  ['#8E3B46', '#E0D3B6', '#FBF6EC'],
  ['#1B4332', '#B7E4C7', '#F1FAF4'],
  ['#3A0CA3', '#F72585', '#F5EEFF'],
  ['#283618', '#DDA15E', '#FEFAE0'],
  ['#0B3954', '#FF5A5F', '#F3F8FB'],
  ['#4A4E69', '#F2E9E4', '#FFFFFF'],
  ['#6B2D5C', '#F0A202', '#FFF8EC'],
  ['#102542', '#F87060', '#F3EFE7'],
];
