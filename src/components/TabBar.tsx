import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolate } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTheme } from '@/theme/ThemeProvider';
import { haptic } from '@/ui/primitives';

export const TAB_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; iconOn: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Akış', icon: 'home-outline', iconOn: 'home' },
  discover: { label: 'Keşfet', icon: 'compass-outline', iconOn: 'compass' },
  library: { label: 'Kitaplık', icon: 'library-outline', iconOn: 'library' },
  notifications: { label: 'Bildirimler', icon: 'notifications-outline', iconOn: 'notifications' },
  profile: { label: 'Profil', icon: 'person-circle-outline', iconOn: 'person-circle' },
};

function Badge({ n }: { n?: number }) {
  const t = useTheme();
  if (!n) return null;
  return (
    <View style={{ position: 'absolute', top: -4, right: -10, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: t.style === 'android' ? '#B3261E' : t.c.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: t.style === 'android' ? t.c.tabBar : 'transparent' }}>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{n > 99 ? '99+' : n}</Text>
    </View>
  );
}

function AndroidItem({ focused, meta, onPress, badge }: { focused: boolean; meta: (typeof TAB_META)[string]; onPress: () => void; badge?: number }) {
  const t = useTheme();
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(focused ? 1 : 0, { damping: 18, stiffness: 220 });
  }, [focused]);
  const pill = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scaleX: interpolate(p.value, [0, 1], [0.4, 1]) }] }));
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingTop: 12, gap: 4 }} android_ripple={{ color: 'transparent' }}>
      <View style={{ width: 64, height: 32, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: t.c.primarySoft }, pill]} />
        <View>
          <Ionicons name={focused ? meta.iconOn : meta.icon} size={23} color={focused ? t.c.onPrimarySoft : t.c.textSoft} />
          <Badge n={badge} />
        </View>
      </View>
      <Text style={{ fontFamily: focused ? t.font.uiBold : t.font.uiMedium, fontSize: 12, color: focused ? t.c.text : t.c.textSoft }}>{meta.label}</Text>
    </Pressable>
  );
}

function IOSItem({ focused, meta, onPress, badge }: { focused: boolean; meta: (typeof TAB_META)[string]; onPress: () => void; badge?: number }) {
  const t = useTheme();
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      onPress={() => {
        s.value = withSpring(0.84, { damping: 30, stiffness: 600 }, () => (s.value = withSpring(1, { damping: 10, stiffness: 300 })));
        onPress();
      }}
      style={{ flex: 1, alignItems: 'center', paddingTop: 7, gap: 2 }}
    >
      <Animated.View style={a}>
        <Ionicons name={focused ? meta.iconOn : meta.icon} size={25} color={focused ? t.c.primary : t.c.textMuted} />
        <Badge n={badge} />
      </Animated.View>
      <Text style={{ fontSize: 10, fontWeight: '600', color: focused ? t.c.primary : t.c.textMuted }}>{meta.label}</Text>
    </Pressable>
  );
}

function HarmonyBar({ state, emitter, navigateToTab, badges }: BottomTabBarProps & { badges: Record<string, number> }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const barW = Math.min(width - 32, 460);
  const n = state.routes.length;
  const slot = (barW - 12) / n;
  const x = useSharedValue(state.index);
  useEffect(() => {
    x.value = withSpring(state.index, { damping: 18, stiffness: 180 });
  }, [state.index]);
  const bubble = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * slot }] }));
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 10, alignItems: 'center' }}>
      <View
        style={{
          width: barW,
          height: t.shape.tabBarHeight,
          borderRadius: 32,
          overflow: 'hidden',
          flexDirection: 'row',
          padding: 6,
          shadowColor: t.c.shadow,
          shadowOpacity: t.scheme === 'dark' ? 0.5 : 0.14,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.c.border,
        }}
      >
        <BlurView intensity={Platform.OS === 'web' ? 30 : 70} tint={t.scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: t.c.tabBar }]} />
        <Animated.View style={[{ position: 'absolute', top: 6, left: 6, width: slot, bottom: 6, borderRadius: 26, backgroundColor: t.c.primarySoft }, bubble]} />
        {state.routes.map((r, i) => {
          const meta = TAB_META[r.name];
          if (!meta) return null;
          const focused = state.index === i;
          return (
            <Pressable
              key={r.key}
              onPress={() => {
                haptic('select');
                const ev = emitter.emit({ type: 'tabPress', target: r.key, canPreventDefault: true });
                if (!focused && !ev.defaultPrevented) navigateToTab(r.key);
              }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
            >
              <View>
                <Ionicons name={focused ? meta.iconOn : meta.icon} size={22} color={focused ? t.c.primary : t.c.textSoft} />
                <Badge n={badges[r.name]} />
              </View>
              <Text style={{ fontSize: 10, fontFamily: focused ? t.font.uiBold : t.font.uiMedium, color: focused ? t.c.primary : t.c.textSoft }}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function TabBar(props: BottomTabBarProps & { badges: Record<string, number> }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { state, emitter, navigateToTab, badges } = props;
  if (t.style === 'harmony') return <HarmonyBar {...props} />;

  const press = (i: number) => {
    const r = state.routes[i];
    haptic('select');
    const ev = emitter.emit({ type: 'tabPress', target: r.key, canPreventDefault: true });
    if (state.index !== i && !ev.defaultPrevented) navigateToTab(r.key);
  };

  if (t.style === 'android') {
    return (
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: t.shape.tabBarHeight + insets.bottom, paddingBottom: insets.bottom, backgroundColor: t.c.tabBar, flexDirection: 'row', elevation: 3 }}>
        {state.routes.map((r, i) => (TAB_META[r.name] ? <AndroidItem key={r.key} focused={state.index === i} meta={TAB_META[r.name]} onPress={() => press(i)} badge={badges[r.name]} /> : null))}
      </View>
    );
  }

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: t.shape.tabBarHeight + Math.max(insets.bottom, 8), flexDirection: 'row' }}>
      <BlurView intensity={Platform.OS === 'web' ? 30 : 90} tint={t.scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: t.c.tabBar, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.c.border }]} />
      {state.routes.map((r, i) => (TAB_META[r.name] ? <IOSItem key={r.key} focused={state.index === i} meta={TAB_META[r.name]} onPress={() => press(i)} badge={badges[r.name]} /> : null))}
    </View>
  );
}
