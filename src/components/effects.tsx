import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing, interpolate, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DeviceMotion } from 'expo-sensors';
import { useTheme } from '@/theme/ThemeProvider';
import { haptic, T } from '@/ui/primitives';

/* ---------- Aurora: slow drifting colour fields ---------- */
function Blob({ color, size, from, to, duration, delay = 0 }: { color: string; size: number; from: [number, number]; to: [number, number]; duration: number; delay?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(p.value, [0, 1], [from[0], to[0]]) },
      { translateY: interpolate(p.value, [0, 1], [from[1], to[1]]) },
      { scale: interpolate(p.value, [0, 0.5, 1], [1, 1.15, 0.95]) },
    ],
  }));
  const id = useMemo(() => `g${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size, left: -size / 2, top: -size / 2 }, style]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.85} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.28} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

export function Aurora({ height = 420, style, intensity = 1 }: { height?: number; style?: StyleProp<ViewStyle>; intensity?: number }) {
  const t = useTheme();
  const [w, setW] = useState(400);
  const [a, b, c] = t.c.aurora;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, height, overflow: 'hidden', opacity: intensity }, style]}>
      <Blob color={a} size={w * 1.1} from={[w * 0.1, height * 0.15]} to={[w * 0.35, height * 0.3]} duration={9000} />
      <Blob color={b} size={w * 0.95} from={[w * 0.9, height * 0.1]} to={[w * 0.6, height * 0.35]} duration={11000} delay={600} />
      <Blob color={c} size={w * 0.8} from={[w * 0.5, height * 0.65]} to={[w * 0.75, height * 0.45]} duration={10000} delay={1200} />
      <LinearGradient colors={['transparent', t.c.bg]} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

/* ---------- Animated progress ring ---------- */
const ACircle = Animated.createAnimatedComponent(Circle);
export function ProgressRing({ progress, size = 120, stroke = 12, children, colors }: { progress: number; size?: number; stroke?: number; children?: React.ReactNode; colors?: [string, string] }) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(Math.min(1, Math.max(0, progress)), { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [progress]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));
  const [c1, c2] = colors ?? [t.c.gradient[0], t.c.gradient[2]];
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <RadialGradient id="ringg" cx="50%" cy="0%" r="120%">
            <Stop offset="0" stopColor={c2} />
            <Stop offset="1" stopColor={c1} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.c.cardAlt} strokeWidth={stroke} fill="none" />
        <ACircle cx={size / 2} cy={size / 2} r={r} stroke="url(#ringg)" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} animatedProps={props} />
      </Svg>
      {children}
    </View>
  );
}

/* ---------- Confetti burst ---------- */
function Piece({ color, i, n }: { color: string; i: number; n: number }) {
  const p = useSharedValue(0);
  const ang = (i / n) * Math.PI * 2 + Math.random() * 0.4;
  const dist = 120 + Math.random() * 140;
  const spin = (Math.random() - 0.5) * 900;
  useEffect(() => {
    p.value = withTiming(1, { duration: 1400 + Math.random() * 500, easing: Easing.out(Easing.quad) });
  }, []);
  const s = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.7, 1], [1, 1, 0]),
    transform: [
      { translateX: Math.cos(ang) * dist * p.value },
      { translateY: Math.sin(ang) * dist * p.value + 260 * p.value * p.value },
      { rotate: `${spin * p.value}deg` },
      { rotateX: `${spin * p.value * 1.4}deg` },
    ],
  }));
  const round = i % 3 === 0;
  return <Animated.View style={[{ position: 'absolute', width: round ? 9 : 7, height: round ? 9 : 14, borderRadius: round ? 5 : 2, backgroundColor: color }, s]} />;
}

export function Confetti({ fire }: { fire: number }) {
  const t = useTheme();
  if (!fire) return null;
  const colors = [...t.c.gradient, t.c.star, t.c.success, '#fff'];
  return (
    <View key={fire} pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 50 }]}>
      {Array.from({ length: 46 }).map((_, i) => (
        <Piece key={i} i={i} n={46} color={colors[i % colors.length]} />
      ))}
    </View>
  );
}

/* ---------- Heart with burst ---------- */
export function LikeHeart({ liked, count, onToggle }: { liked: boolean; count: number; onToggle: () => void }) {
  const t = useTheme();
  const s = useSharedValue(1);
  const ring = useSharedValue(0);
  const heart = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: interpolate(ring.value, [0, 0.2, 1], [0, 0.7, 0]), transform: [{ scale: interpolate(ring.value, [0, 1], [0.4, 1.8]) }] }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => {
          if (!liked) {
            haptic('medium');
            ring.value = 0;
            ring.value = withTiming(1, { duration: 520 });
            s.value = withSequence(withTiming(0.7, { duration: 80 }), withSpring(1.25, { damping: 4, stiffness: 400 }), withSpring(1));
          } else {
            haptic('light');
            s.value = withSequence(withTiming(0.8, { duration: 80 }), withSpring(1));
          }
          onToggle();
        }}
        hitSlop={10}
        style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.View style={[{ position: 'absolute', width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: t.c.accent }, ringStyle]} />
        <Animated.View style={heart}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? t.c.accent : t.c.textMuted} />
        </Animated.View>
      </View>
      <T v="caption" weight="medium" color={liked ? t.c.accent : t.c.textMuted}>
        {count > 0 ? count : ''}
      </T>
    </View>
  );
}

/* ---------- Tilt: follows the phone (gyro) or the mouse ---------- */
export function Tilt({ children, max = 10, style }: { children: React.ReactNode; max?: number; style?: StyleProp<ViewStyle> }) {
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const [size, setSize] = useState({ w: 1, h: 1 });
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: { remove: () => void } | undefined;
    DeviceMotion.isAvailableAsync().then((ok) => {
      if (!ok) return;
      DeviceMotion.setUpdateInterval(50);
      sub = DeviceMotion.addListener((m) => {
        const r = m.rotation;
        if (!r) return;
        ry.value = withSpring(Math.max(-max, Math.min(max, (r.gamma ?? 0) * 18)), { damping: 20 });
        rx.value = withSpring(Math.max(-max, Math.min(max, -((r.beta ?? 0) - 0.9) * 14)), { damping: 20 });
      });
    });
    return () => sub?.remove();
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateX: `${rx.value}deg` }, { rotateY: `${ry.value}deg` }] }));
  const webProps: any =
    Platform.OS === 'web'
      ? {
          onPointerMove: (e: any) => {
            const ne = e.nativeEvent;
            const x = ne.offsetX / size.w - 0.5;
            const y = ne.offsetY / size.h - 0.5;
            ry.value = withSpring(x * max * 2, { damping: 18 });
            rx.value = withSpring(-y * max * 2, { damping: 18 });
          },
          onPointerLeave: () => {
            rx.value = withSpring(0);
            ry.value = withSpring(0);
          },
        }
      : {};
  return (
    <View onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} {...webProps} style={style}>
      <Animated.View style={s}>{children}</Animated.View>
    </View>
  );
}

/* ---------- Open book with a turning page ---------- */
export function PageTurn({ trigger, size = 140 }: { trigger: number; size?: number }) {
  const t = useTheme();
  const p = useSharedValue(0);
  useEffect(() => {
    if (!trigger) return;
    p.value = 0;
    p.value = withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) });
  }, [trigger]);
  const half = size / 2;
  const h = size * 0.68;
  const page = useAnimatedStyle(() => ({
    transform: [{ perspective: 700 }, { rotateY: `${-180 * p.value}deg` }],
  }));
  const shade = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0, 0.5, 1], [0, 0.35, 0]) }));
  const paper = t.scheme === 'dark' ? '#E9E3D6' : '#FFFDF7';
  const lines = (n: number) => (
    <View style={{ padding: 12, gap: 6 }}>
      {Array.from({ length: n }).map((_, i) => (
        <View key={i} style={{ height: 3, borderRadius: 2, width: `${70 + ((i * 37) % 30)}%`, backgroundColor: '#00000018' }} />
      ))}
    </View>
  );
  return (
    <View style={{ width: size, height: h + 10, flexDirection: 'row', justifyContent: 'center' }}>
      <LinearGradient colors={t.c.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 6, left: -4, right: -4, height: h + 4, borderRadius: 6 }} />
      <View style={{ width: half, height: h, backgroundColor: paper, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }}>{lines(7)}</View>
      <View style={{ width: half, height: h, backgroundColor: paper, borderTopRightRadius: 4, borderBottomRightRadius: 4 }}>{lines(7)}</View>
      <View style={{ position: 'absolute', left: half - 1, width: 2, top: 0, height: h, backgroundColor: '#00000022' }} />
      <Animated.View style={[{ position: 'absolute', left: half, top: 0, width: half, height: h, backgroundColor: paper, transformOrigin: 'left center', borderTopRightRadius: 4, borderBottomRightRadius: 4 } as any, page]}>
        {lines(7)}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, shade]} />
      </Animated.View>
    </View>
  );
}

/* ---------- Shimmer placeholder ---------- */
export function Shimmer({ width, height, radius = 8, style }: { width: number | `${number}%`; height: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.linear }), -1);
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(x.value, [0, 1], [-200, 400]) }] }));
  return (
    <View style={[{ width, height, borderRadius: radius, backgroundColor: t.c.cardAlt, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: 160 }, s]}>
        <LinearGradient colors={['transparent', t.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}
