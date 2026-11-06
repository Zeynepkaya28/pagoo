import React, { useEffect } from 'react';
import {
  ActivityIndicator, Platform, Pressable, PressableProps, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextProps, TextStyle, View, ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolateColor } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { hash, initials } from '@/lib/format';

export function haptic(kind: 'light' | 'medium' | 'success' | 'select' = 'light') {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'select') Haptics.selectionAsync();
    else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

/* ---------- Text ---------- */
type Variant = 'large' | 'title' | 'headline' | 'body' | 'callout' | 'caption' | 'label' | 'display' | 'quote';
export function T({ v = 'body', color, style, weight, center, ...rest }: TextProps & { v?: Variant; color?: string; weight?: 'regular' | 'medium' | 'bold'; center?: boolean }) {
  const t = useTheme();
  const f = t.font;
  const ios = t.style === 'ios';
  const base: TextStyle = { color: color ?? t.c.text };
  const fam = (w: 'regular' | 'medium' | 'bold') => (w === 'bold' ? f.uiBold : w === 'medium' ? f.uiMedium : f.ui);
  const iosWeight = (w: 'regular' | 'medium' | 'bold'): TextStyle['fontWeight'] => (w === 'bold' ? '700' : w === 'medium' ? '600' : '400');
  const withW = (w: 'regular' | 'medium' | 'bold'): TextStyle => (ios ? { fontFamily: undefined, fontWeight: iosWeight(w) } : { fontFamily: fam(w) });
  let s: TextStyle;
  switch (v) {
    case 'large':
      s = { fontSize: f.largeTitle, letterSpacing: ios ? 0.3 : 0, ...(ios ? { fontWeight: '800' } : t.style === 'android' ? { fontFamily: f.ui } : { fontFamily: f.uiBold }) };
      break;
    case 'display':
      s = { fontFamily: f.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.2 };
      break;
    case 'quote':
      s = { fontFamily: f.displayItalic, fontSize: 18, lineHeight: 27 };
      break;
    case 'title':
      s = { fontSize: f.title, lineHeight: f.title * 1.25, ...withW(weight ?? 'bold') };
      break;
    case 'headline':
      s = { fontSize: f.body + 1, lineHeight: (f.body + 1) * 1.3, ...withW(weight ?? 'medium') };
      break;
    case 'callout':
      s = { fontSize: f.body - 1, lineHeight: (f.body - 1) * 1.45, ...withW(weight ?? 'regular') };
      break;
    case 'caption':
      s = { fontSize: f.caption, lineHeight: f.caption * 1.35, color: color ?? t.c.textMuted, ...withW(weight ?? 'regular') };
      break;
    case 'label':
      s = { fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: color ?? t.c.textMuted, ...withW(weight ?? 'bold') };
      break;
    default:
      s = { fontSize: f.body, lineHeight: f.body * 1.45, ...withW(weight ?? 'regular') };
  }
  return <Text {...rest} style={[base, s, center && { textAlign: 'center' }, style]} />;
}

/* ---------- Pressable with spring feedback (and Material ripple on Android) ---------- */
export function Tap({ style, children, scaleTo = 0.96, onPress, hapticKind, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; scaleTo?: number; hapticKind?: 'light' | 'select' | 'medium' }) {
  const t = useTheme();
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[a, style as any]}>
      <Pressable
        {...rest}
        android_ripple={t.style === 'android' ? { color: t.c.primary + '22', borderless: false } : undefined}
        onPressIn={(e) => {
          s.value = withSpring(scaleTo, { damping: 20, stiffness: 400 });
          rest.onPressIn?.(e);
        }}
        onPressOut={(e) => {
          s.value = withSpring(1, { damping: 14, stiffness: 300 });
          rest.onPressOut?.(e);
        }}
        onPress={(e) => {
          if (hapticKind) haptic(hapticKind);
          onPress?.(e);
        }}
        style={{ flexGrow: 1 }}
      >
        {children as any}
      </Pressable>
    </Animated.View>
  );
}

/* ---------- Button ---------- */
export function Button({
  title, onPress, kind = 'filled', icon, loading, disabled, style, small, gradient,
}: {
  title: string; onPress?: () => void; kind?: 'filled' | 'tonal' | 'outline' | 'text' | 'danger'; icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; small?: boolean; gradient?: boolean;
}) {
  const t = useTheme();
  const h = small ? Math.round(t.shape.buttonHeight * 0.74) : t.shape.buttonHeight;
  const bg = kind === 'filled' ? t.c.primary : kind === 'tonal' ? t.c.primarySoft : kind === 'danger' ? t.c.danger + '18' : 'transparent';
  const fg = kind === 'filled' ? t.c.onPrimary : kind === 'tonal' ? t.c.onPrimarySoft : kind === 'danger' ? t.c.danger : t.c.primary;
  const radius = Math.min(t.shape.button, h / 2);
  const inner = (
    <View style={{ height: h, paddingHorizontal: small ? 14 : 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {loading ? <ActivityIndicator color={gradient ? '#fff' : fg} /> : icon ? <Ionicons name={icon} size={small ? 16 : 19} color={gradient ? '#fff' : fg} /> : null}
      <T v={small ? 'callout' : 'headline'} weight="bold" color={gradient ? '#fff' : fg} style={t.style === 'android' ? { letterSpacing: 0.1 } : undefined}>
        {title}
      </T>
    </View>
  );
  return (
    <Tap
      onPress={onPress}
      disabled={disabled || loading}
      hapticKind="light"
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: gradient ? undefined : bg,
          opacity: disabled ? 0.5 : 1,
          borderWidth: kind === 'outline' ? 1 : 0,
          borderColor: t.c.border,
        },
        gradient && t.style !== 'android' && { shadowColor: t.c.gradient[1], shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
        style,
      ]}
    >
      {gradient ? (
        <LinearGradient colors={t.c.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </Tap>
  );
}

/* ---------- Icon button ---------- */
export function IconButton({ name, onPress, color, size = 22, badge, filled, style }: { name: keyof typeof Ionicons.glyphMap; onPress?: () => void; color?: string; size?: number; badge?: number; filled?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const harmony = t.style === 'harmony';
  const dim = harmony ? 40 : t.style === 'android' ? 48 : 36;
  return (
    <Tap onPress={onPress} hapticKind="select" scaleTo={0.88} style={[{ width: dim, height: dim, borderRadius: dim / 2, overflow: 'hidden' }, style]}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: filled || harmony ? (t.scheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
        }}
      >
        <Ionicons name={name} size={size} color={color ?? (t.style === 'ios' ? t.c.primary : t.c.text)} />
        {!!badge && (
          <View style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: t.c.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
    </Tap>
  );
}

/* ---------- Card ---------- */
export function Card({ children, style, onPress, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; padded?: boolean }) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.c.card,
    borderRadius: t.shape.radius,
    padding: padded ? (t.style === 'harmony' ? 16 : 14) : 0,
    overflow: 'hidden',
  };
  if (t.style === 'harmony' && t.scheme === 'light') Object.assign(base, { shadowColor: t.c.shadow, shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } });
  if (t.style === 'ios' && t.scheme === 'light') Object.assign(base, { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } });
  if (onPress) return <Tap onPress={onPress} scaleTo={0.985} style={[base, style]}>{children}</Tap>;
  return <View style={[base, style]}>{children}</View>;
}

/* ---------- Input ---------- */
export function Input({ label, icon, style, ...rest }: TextInputProps & { label?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const t = useTheme();
  const focus = useSharedValue(0);
  const android = t.style === 'android';
  const anim = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [android ? t.c.textMuted : t.c.border, t.c.primary]),
    borderWidth: android ? 1 + focus.value : t.style === 'harmony' ? focus.value * 1.5 : 1,
  }));
  const multiline = !!rest.multiline;
  return (
    <View style={style as any}>
      {label && !android && (
        <T v="caption" weight="medium" style={{ marginBottom: 6, marginLeft: 4 }}>
          {label}
        </T>
      )}
      <Animated.View
        style={[
          {
            minHeight: multiline ? 110 : t.shape.inputHeight,
            borderRadius: t.shape.input,
            backgroundColor: android ? 'transparent' : t.style === 'harmony' ? t.c.cardAlt : t.c.card,
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            paddingHorizontal: 14,
            gap: 10,
          },
          anim,
        ]}
      >
        {android && label && (
          <View style={{ position: 'absolute', top: -9, left: 10, backgroundColor: t.c.bg, paddingHorizontal: 4 }}>
            <T v="caption" color={t.c.textSoft}>{label}</T>
          </View>
        )}
        {icon && <Ionicons name={icon} size={19} color={t.c.textMuted} style={multiline ? { marginTop: 14 } : undefined} />}
        <TextInput
          placeholderTextColor={t.c.textMuted}
          selectionColor={t.c.primary}
          {...rest}
          onFocus={(e) => {
            focus.value = withTiming(1, { duration: 180 });
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.value = withTiming(0, { duration: 180 });
            rest.onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              color: t.c.text,
              fontSize: 16,
              paddingVertical: multiline ? 12 : 0,
              minHeight: multiline ? 100 : undefined,
              textAlignVertical: multiline ? 'top' : 'center',
              fontFamily: t.style === 'ios' ? undefined : t.font.ui,
            },
            Platform.OS === 'web' ? ({ outlineStyle: 'none', height: multiline ? undefined : '100%' } as any) : null,
          ]}
        />
      </Animated.View>
    </View>
  );
}

/* ---------- Avatar ---------- */
const AVATAR_GRADIENTS: [string, string][] = [
  ['#FF9A8B', '#FF6A88'], ['#7F7FD5', '#86A8E7'], ['#43C6AC', '#191654'], ['#F7971E', '#FFD200'], ['#C471F5', '#FA71CD'],
  ['#4FACFE', '#00F2FE'], ['#F093FB', '#F5576C'], ['#5EE7DF', '#B490CA'], ['#FDA085', '#F6D365'], ['#667EEA', '#764BA2'],
];
export function Avatar({ uri, name, size = 40, ring }: { uri?: string | null; name?: string | null; size?: number; ring?: boolean }) {
  const t = useTheme();
  const g = AVATAR_GRADIENTS[hash(name ?? '?') % AVATAR_GRADIENTS.length];
  const radius = t.style === 'harmony' && size > 60 ? size * 0.32 : size / 2;
  const content = uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} contentFit="cover" transition={200} />
  ) : (
    <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{initials(name)}</Text>
    </LinearGradient>
  );
  if (!ring) return content;
  return (
    <LinearGradient colors={t.c.gradient} style={{ padding: 3, borderRadius: radius + 4 }}>
      <View style={{ padding: 2, borderRadius: radius + 2, backgroundColor: t.c.bg }}>{content}</View>
    </LinearGradient>
  );
}

/* ---------- Chip ---------- */
export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  const t = useTheme();
  const android = t.style === 'android';
  return (
    <Tap onPress={onPress} hapticKind="select" scaleTo={0.94} style={{ borderRadius: android ? 8 : 100, overflow: 'hidden' }}>
      <View
        style={{
          height: android ? 32 : 34,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: android ? 8 : 100,
          backgroundColor: active ? (android ? t.c.primarySoft : t.c.primary) : android ? 'transparent' : t.c.card,
          borderWidth: android && !active ? 1 : 0,
          borderColor: t.c.border,
        }}
      >
        {android && active && <Ionicons name="checkmark" size={16} color={t.c.onPrimarySoft} />}
        {icon && !(android && active) && <Ionicons name={icon} size={15} color={active ? t.c.onPrimary : t.c.textSoft} />}
        <T v="callout" weight="medium" color={active ? (android ? t.c.onPrimarySoft : t.c.onPrimary) : t.c.textSoft}>
          {label}
        </T>
      </View>
    </Tap>
  );
}

/* ---------- Segmented control (iOS segmented / M3 segmented buttons / Harmony capsule tabs) ---------- */
export function Segmented<K extends string>({ items, value, onChange, style }: { items: { key: K; label: string }[]; value: K; onChange: (k: K) => void; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const idx = Math.max(0, items.findIndex((i) => i.key === value));
  const x = useSharedValue(idx);
  const [w, setW] = React.useState(0);
  useEffect(() => {
    x.value = withSpring(idx, { damping: 22, stiffness: 260 });
  }, [idx]);
  const segW = w / items.length;
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * segW }], width: segW }));

  if (t.style === 'android') {
    return (
      <View style={[{ flexDirection: 'row', borderWidth: 1, borderColor: t.c.textMuted, borderRadius: 100, overflow: 'hidden', height: 40 }, style]}>
        {items.map((it, i) => {
          const on = it.key === value;
          return (
            <Pressable
              key={it.key}
              onPress={() => {
                haptic('select');
                onChange(it.key);
              }}
              android_ripple={{ color: t.c.primary + '22' }}
              style={{ flex: 1, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.c.primarySoft : 'transparent', borderLeftWidth: i ? 1 : 0, borderColor: t.c.textMuted }}
            >
              {on && <Ionicons name="checkmark" size={16} color={t.c.onPrimarySoft} />}
              <T v="callout" weight="medium" color={on ? t.c.onPrimarySoft : t.c.text} numberOfLines={1}>
                {it.label}
              </T>
            </Pressable>
          );
        })}
      </View>
    );
  }
  const harmony = t.style === 'harmony';
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width - 4)}
      style={[{ flexDirection: 'row', padding: 2, borderRadius: harmony ? 100 : 9, backgroundColor: harmony ? t.c.cardAlt : t.scheme === 'dark' ? '#2C2C2E' : 'rgba(118,118,128,0.12)', height: harmony ? 40 : 34 }, style]}
    >
      {w > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 2,
              bottom: 2,
              left: 2,
              borderRadius: harmony ? 100 : 7,
              backgroundColor: harmony ? t.c.primary : t.scheme === 'dark' ? '#636366' : '#fff',
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
            },
            thumb,
          ]}
        />
      )}
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => {
              haptic('select');
              onChange(it.key);
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <T v="callout" weight={on ? 'bold' : 'medium'} color={harmony && on ? '#fff' : t.c.text} numberOfLines={1}>
              {it.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- misc ---------- */
export function Row({ children, gap = 8, style, center = true }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; center?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: center ? 'center' : 'flex-start', gap }, style]}>{children}</View>;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.border, marginLeft: inset }} />;
}

export function Loading({ pad = 40 }: { pad?: number }) {
  const t = useTheme();
  return (
    <View style={{ padding: pad, alignItems: 'center' }}>
      <ActivityIndicator color={t.c.primary} />
    </View>
  );
}

export function Empty({ icon, title, text, action }: { icon: keyof typeof Ionicons.glyphMap; title: string; text?: string; action?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 28, gap: 10 }}>
      <LinearGradient colors={[t.c.primarySoft, t.c.bg]} style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={36} color={t.c.primary} />
      </LinearGradient>
      <T v="title" center>
        {title}
      </T>
      {text && (
        <T v="callout" color={t.c.textMuted} center>
          {text}
        </T>
      )}
      {action}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const t = useTheme();
  return (
    <Row style={{ justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 26, marginBottom: 12 }}>
      <T v="title">{title}</T>
      {action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <T v="callout" weight="medium" color={t.c.primary}>
            {action}
          </T>
        </Pressable>
      )}
    </Row>
  );
}

export function Stars({ value, size = 14 }: { value: number | null; size?: number }) {
  const t = useTheme();
  const v = (value ?? 0) / 2; // 10 → 5
  return (
    <Row gap={1}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={v >= i ? 'star' : v >= i - 0.5 ? 'star-half' : 'star-outline'} size={size} color={t.c.star} />
      ))}
    </Row>
  );
}
