import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { buildTheme, Scheme, Theme, UIStyle } from './tokens';

export type SchemePref = 'system' | Scheme;
export type StylePref = 'auto' | UIStyle;

interface Ctx {
  theme: Theme;
  schemePref: SchemePref;
  stylePref: StylePref;
  detectedStyle: UIStyle;
  setSchemePref: (s: SchemePref) => void;
  setStylePref: (s: StylePref) => void;
  ready: boolean;
}

const ThemeCtx = createContext<Ctx | null>(null);
const KEY = 'pagoo.appearance.v1';

/** Works out which design language fits the device the app runs on. */
export function detectStyle(): UIStyle {
  const os = Platform.OS as string;
  if (os === 'ios') return 'ios';
  if (os === 'harmony') return 'harmony';
  if (os === 'android') {
    const maker = `${Device.manufacturer ?? ''} ${Device.brand ?? ''}`.toLowerCase();
    return /huawei|honor/.test(maker) ? 'harmony' : 'android';
  }
  if (os === 'web' && typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (/HarmonyOS|OpenHarmony|ArkWeb|HUAWEI|HONOR/i.test(ua)) return 'harmony';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod|Macintosh/i.test(ua)) return 'ios';
    if (/Windows|Linux|CrOS/i.test(ua)) return 'android';
  }
  return 'ios';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [schemePref, setSchemePrefState] = useState<SchemePref>('system');
  const [stylePref, setStylePrefState] = useState<StylePref>('auto');
  const [ready, setReady] = useState(false);
  const detectedStyle = useMemo(detectStyle, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const v = JSON.parse(raw);
        if (v.scheme) setSchemePrefState(v.scheme);
        if (v.style) setStylePrefState(v.style);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const persist = (scheme: SchemePref, style: StylePref) =>
    AsyncStorage.setItem(KEY, JSON.stringify({ scheme, style })).catch(() => {});

  const scheme: Scheme = schemePref === 'system' ? (system === 'dark' ? 'dark' : 'light') : schemePref;
  const style: UIStyle = stylePref === 'auto' ? detectedStyle : stylePref;
  const theme = useMemo(() => buildTheme(style, scheme), [style, scheme]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = theme.c.bg;
      document.documentElement.style.colorScheme = scheme;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme.c.bg);
    }
  }, [theme, scheme]);

  const value: Ctx = {
    theme,
    schemePref,
    stylePref,
    detectedStyle,
    ready,
    setSchemePref: (s) => {
      setSchemePrefState(s);
      persist(s, stylePref);
    },
    setStylePref: (s) => {
      setStylePrefState(s);
      persist(schemePref, s);
    },
  };
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useAppearance() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('ThemeProvider missing');
  return ctx;
}

export function useTheme(): Theme {
  return useAppearance().theme;
}
