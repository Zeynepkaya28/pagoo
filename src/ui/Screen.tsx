import React from 'react';
import { Platform, RefreshControl, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Animated, { interpolate, Extrapolation, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { T, IconButton, Row } from './primitives';

export interface ScreenProps {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
  large?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  headerOverlay?: boolean; // transparent header drawn over content (e.g. book hero)
  scrollY?: SharedValue<number>;
  tabBarSpace?: boolean;
  footer?: React.ReactNode;
}

export function useTabBarSpace() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return t.shape.tabBarHeight + insets.bottom + (t.style === 'harmony' ? 24 : 12);
}

export function Screen({
  title, subtitle, back, right, children, large = true, refreshing, onRefresh, onEndReached, contentStyle, scroll = true, headerOverlay, scrollY, tabBarSpace, footer,
}: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const localY = useSharedValue(0);
  const y = scrollY ?? localY;
  const barH = t.style === 'android' ? 64 : t.style === 'harmony' ? 56 : 44;
  const headerH = insets.top + barH;
  const showLarge = large && !!title && !headerOverlay;
  const bottomSpace = useTabBarSpace();

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      y.value = e.contentOffset.y;
    },
  });

  const end = React.useRef(false);
  const handleEnd = (e: any) => {
    if (!onEndReached) return;
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const near = layoutMeasurement.height + contentOffset.y >= contentSize.height - 400;
    if (near && !end.current) {
      end.current = true;
      onEndReached();
      setTimeout(() => (end.current = false), 800);
    }
  };

  const barBg = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, headerOverlay ? [120, 220] : [0, 30], [0, 1], Extrapolation.CLAMP),
  }));
  const smallTitle = useAnimatedStyle(() => {
    const p = showLarge ? interpolate(y.value, [28, 52], [0, 1], Extrapolation.CLAMP) : headerOverlay ? interpolate(y.value, [180, 240], [0, 1], Extrapolation.CLAMP) : 1;
    return { opacity: p, transform: [{ translateY: (1 - p) * 6 }] };
  });
  const largeTitle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(y.value, [-120, 0], [1.12, 1], Extrapolation.CLAMP) },
      { translateX: interpolate(y.value, [-120, 0], [14, 0], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(y.value, [0, 40], [1, 0], Extrapolation.CLAMP),
  }));

  const ios = t.style === 'ios';
  const android = t.style === 'android';
  const harmony = t.style === 'harmony';

  const header = (
    <View pointerEvents="box-none" style={[styles.header, { height: headerH, paddingTop: insets.top }]}>
      <Animated.View style={[StyleSheet.absoluteFill, barBg]} pointerEvents="none">
        {android ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: t.c.card }]} />
        ) : (
          <>
            <BlurView intensity={Platform.OS === 'web' ? 40 : 80} tint={t.scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: t.c.tabBar }]} />
            {ios && <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: t.c.border }} />}
          </>
        )}
      </Animated.View>
      <Row style={{ height: barH, paddingHorizontal: android ? 4 : harmony ? 16 : 8 }} gap={android ? 4 : 8}>
        {back ? (
          ios ? (
            <IconButton name="chevron-back" size={28} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} color={headerOverlay ? '#fff' : t.c.primary} style={headerOverlay ? styles.overlayBtn : undefined} />
          ) : (
            <IconButton name={android ? 'arrow-back' : 'chevron-back'} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} color={headerOverlay ? '#fff' : t.c.text} filled={harmony} style={headerOverlay ? styles.overlayBtn : undefined} />
          )
        ) : (
          <View style={{ width: android ? 12 : 4 }} />
        )}
        <Animated.View style={[{ flex: 1, alignItems: ios ? 'center' : 'flex-start' }, ios && { position: 'absolute', left: 60, right: 60 }, smallTitle]} pointerEvents="none">
          {title && (
            <T v={android ? 'title' : 'headline'} weight="bold" numberOfLines={1} style={android ? { fontSize: 22, fontFamily: t.font.ui } : undefined}>
              {title}
            </T>
          )}
        </Animated.View>
        {ios && <View style={{ flex: 1 }} />}
        <Row gap={harmony ? 10 : 0}>{right}</Row>
      </Row>
    </View>
  );

  const largeHeader = showLarge ? (
    <Animated.View style={[{ paddingHorizontal: 20, paddingTop: android ? 8 : 2, paddingBottom: 12 }, largeTitle, { transformOrigin: 'left center' } as any]}>
      <T v="large" numberOfLines={1}>
        {title}
      </T>
      {subtitle && (
        <T v="callout" color={t.c.textMuted} style={{ marginTop: 2 }}>
          {subtitle}
        </T>
      )}
    </Animated.View>
  ) : null;

  const padBottom = tabBarSpace ? bottomSpace : insets.bottom + 24;

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      {scroll ? (
        <Animated.ScrollView
          onScroll={onScroll}
          onMomentumScrollEnd={handleEnd}
          onScrollEndDrag={handleEnd}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[{ paddingTop: headerOverlay ? 0 : headerH, paddingBottom: padBottom }, contentStyle]}
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.c.primary} colors={[t.c.primary]} progressViewOffset={headerH} /> : undefined}
          showsVerticalScrollIndicator={false}
        >
          {largeHeader}
          {children}
        </Animated.ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingTop: headerOverlay ? 0 : headerH }, contentStyle]}>
          {largeHeader}
          {children}
        </View>
      )}
      {header}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  overlayBtn: { backgroundColor: 'rgba(0,0,0,0.28)' },
});

export function BackIcon() {
  const t = useTheme();
  return <Ionicons name={t.style === 'android' ? 'arrow-back' : 'chevron-back'} size={24} color={t.c.text} />;
}
