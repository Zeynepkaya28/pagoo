import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Path, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { T } from '@/ui/primitives';

export function LogoMark({ size = 44 }: { size?: number }) {
  const t = useTheme();
  const [a, b, c] = t.c.gradient;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <SvgGrad id="lg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={a} />
          <Stop offset="0.55" stopColor={b} />
          <Stop offset="1" stopColor={c} />
        </SvgGrad>
      </Defs>
      <Rect x="0" y="0" width="64" height="64" rx={t.style === 'harmony' ? 20 : t.style === 'android' ? 32 : 15} fill="url(#lg)" />
      {/* a page wearing reading glasses */}
      <Path d="M19 12h19l9 9v29a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3z" fill="#fff" />
      <Path d="M38 12v6a3 3 0 0 0 3 3h6z" fill="#fff" opacity={0.6} />
      <Circle cx={25.5} cy={33} r={5.2} fill="none" stroke={a} strokeWidth={2.6} />
      <Circle cx={39} cy={33} r={5.2} fill="none" stroke={b} strokeWidth={2.6} />
      <Path d="M30.7 32.2c.9-1 2.1-1 3 0" stroke={a} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Path d="M24 44.5c2.6 2 6.4 2.6 9.6 1.6" stroke={c} strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function Wordmark({ size = 30, color }: { size?: number; color?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }}>
      <LogoMark size={size * 1.25} />
      <T style={{ fontFamily: t.font.display, fontSize: size, color: color ?? t.c.text, letterSpacing: -0.5 }}>Pagoo</T>
    </View>
  );
}
