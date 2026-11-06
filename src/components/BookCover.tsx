import React, { memo, useState } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { coverPalettes } from '@/theme/tokens';
import { hash } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

export interface CoverBook {
  id: string;
  title: string;
  cover_url?: string | null;
  author?: { name: string } | null;
}

function Pattern({ kind, w, h, ink, accent }: { kind: number; w: number; h: number; ink: string; accent: string }) {
  switch (kind) {
    case 0:
      return (
        <G>
          {[0.62, 0.48, 0.34, 0.2].map((r, i) => (
            <Circle key={i} cx={w * 0.78} cy={h * 0.8} r={w * r} fill={i % 2 ? ink : accent} opacity={0.9 - i * 0.12} />
          ))}
        </G>
      );
    case 1:
      return (
        <G opacity={0.95}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Rect key={i} x={-w + i * (w / 3.2)} y={h * 0.55} width={w / 9} height={h} fill={i % 3 === 0 ? accent : ink} opacity={0.75} transform={`rotate(-28 ${w / 2} ${h / 2})`} />
          ))}
        </G>
      );
    case 2:
      return (
        <G>
          <Circle cx={w / 2} cy={h * 1.02} r={w * 0.62} fill={accent} />
          <Circle cx={w / 2} cy={h * 1.02} r={w * 0.4} fill={ink} opacity={0.85} />
          <Line x1={0} y1={h * 0.5} x2={w} y2={h * 0.5} stroke={accent} strokeWidth={1.2} opacity={0.6} />
        </G>
      );
    case 3:
      return (
        <G>
          {Array.from({ length: 7 }).map((_, r) =>
            Array.from({ length: 5 }).map((__, c) => (
              <Circle key={`${r}-${c}`} cx={w * 0.14 + c * w * 0.18} cy={h * 0.5 + r * h * 0.075} r={w * 0.028 + ((r + c) % 3) * w * 0.01} fill={(r + c) % 4 === 0 ? accent : ink} opacity={0.85} />
            )),
          )}
        </G>
      );
    case 4:
      return (
        <G>
          <Rect x={w * 0.08} y={h * 0.5} width={w * 0.22} height={h * 0.5} fill={accent} />
          <Rect x={w * 0.34} y={h * 0.62} width={w * 0.22} height={h * 0.38} fill={ink} opacity={0.8} />
          <Rect x={w * 0.6} y={h * 0.44} width={w * 0.32} height={h * 0.56} fill={accent} opacity={0.55} />
          <Circle cx={w * 0.76} cy={h * 0.44} r={w * 0.1} fill={ink} />
        </G>
      );
    default:
      return (
        <G>
          {Array.from({ length: 8 }).map((_, i) => {
            const y0 = h * 0.52 + i * h * 0.06;
            return (
              <Path
                key={i}
                d={`M0 ${y0} C ${w * 0.25} ${y0 - h * 0.05}, ${w * 0.5} ${y0 + h * 0.05}, ${w * 0.75} ${y0} S ${w} ${y0 - h * 0.03}, ${w * 1.1} ${y0}`}
                stroke={i % 2 ? accent : ink}
                strokeWidth={w * 0.022}
                fill="none"
                opacity={0.85}
              />
            );
          })}
        </G>
      );
  }
}

function GeneratedCover({ book, width, height }: { book: CoverBook; width: number; height: number }) {
  const h = hash(book.id + book.title);
  const [bg, accent, paper] = coverPalettes[h % coverPalettes.length];
  const light = (h >> 4) % 3 === 0; // some covers use paper background
  const base = light ? paper : bg;
  const ink = light ? bg : paper;
  const kind = (h >> 8) % 6;
  const titleSize = Math.max(9, Math.min(width * 0.13, (width * 1.5) / Math.max(6, book.title.length * 0.55)));
  return (
    <View style={{ width, height, backgroundColor: base, overflow: 'hidden' }}>
      <Svg width={width} height={height} style={{ position: 'absolute' }}>
        <Pattern kind={kind} w={width} h={height} ink={ink} accent={accent} />
      </Svg>
      <View style={{ padding: width * 0.09, paddingTop: width * 0.11 }}>
        <Text numberOfLines={4} style={{ fontFamily: 'Fraunces_700Bold', color: ink, fontSize: titleSize, lineHeight: titleSize * 1.12, letterSpacing: -0.2 }}>
          {book.title}
        </Text>
        <View style={{ width: width * 0.16, height: Math.max(1.5, width * 0.012), backgroundColor: accent, marginVertical: width * 0.05 }} />
        {!!book.author?.name && (
          <Text numberOfLines={1} style={{ fontFamily: 'PlusJakartaSans_700Bold', color: ink, opacity: 0.85, fontSize: Math.max(6.5, width * 0.06), letterSpacing: width * 0.006, textTransform: 'uppercase' }}>
            {book.author.name}
          </Text>
        )}
      </View>
    </View>
  );
}

export const BookCover = memo(function BookCover({
  book, width = 100, radius, style, shadow = true, spine = true,
}: { book: CoverBook; width?: number; radius?: number; style?: StyleProp<ViewStyle>; shadow?: boolean; spine?: boolean }) {
  const t = useTheme();
  const height = Math.round(width * 1.5);
  const [failed, setFailed] = useState(false);
  const r = radius ?? Math.max(3, Math.round(width * 0.04));
  return (
    <View
      style={[
        { width, height, borderRadius: r, backgroundColor: t.c.cardAlt },
        shadow && { shadowColor: '#000', shadowOpacity: t.scheme === 'dark' ? 0.5 : 0.22, shadowRadius: width * 0.08, shadowOffset: { width: 0, height: width * 0.05 }, elevation: 6 },
        style,
      ]}
    >
      <View style={{ flex: 1, borderRadius: r, overflow: 'hidden' }}>
        {book.cover_url && !failed ? (
          <Image source={{ uri: book.cover_url }} style={{ width, height }} contentFit="cover" transition={250} onError={() => setFailed(true)} />
        ) : (
          <GeneratedCover book={book} width={width} height={height} />
        )}
        {spine && (
          <LinearGradient
            colors={['rgba(0,0,0,0.28)', 'rgba(255,255,255,0.18)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0)']}
            locations={[0, 0.035, 0.07, 0.14]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            pointerEvents="none"
          />
        )}
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.6 }}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          pointerEvents="none"
        />
      </View>
    </View>
  );
});

export function coverColors(book: { id: string; title: string }) {
  const h = hash(book.id + book.title);
  return coverPalettes[h % coverPalettes.length];
}
