import React, { useEffect } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate, withDelay } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Aurora, Tilt } from '@/components/effects';
import { Book3D } from '@/components/Book3D';
import { Wordmark } from '@/components/Logo';
import { Button, T, Row } from '@/ui/primitives';
import { Ionicons } from '@expo/vector-icons';

const SAMPLE = [
  { id: 'w-1', title: 'Gece Yarısı Kütüphanesi' },
  { id: 'w-2', title: 'Kayıp Sayfalar' },
  { id: 'w-3', title: 'Mürekkep ve Rüzgâr' },
];

function Floating({ children, delay, amp = 10 }: { children: React.ReactNode; delay: number; amp?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(p.value, [0, 1], [-amp, amp]) }] }));
  return <Animated.View style={s}>{children}</Animated.View>;
}

const FEATURES: { icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; text: string }[] = [
  { icon: 'library', text: 'Kitaplığını 3D rafta düzenle' },
  { icon: 'chatbubbles', text: 'İnceleme ve alıntı paylaş' },
  { icon: 'trophy', text: 'Yıllık okuma hedefini takip et' },
];

export default function Welcome() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const bw = Math.min(150, width * 0.34);
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Aurora height={height * 0.75} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <Animated.View entering={FadeIn.duration(600)} style={{ paddingHorizontal: 24 }}>
          <Wordmark size={26} />
        </Animated.View>

        <View style={{ height: bw * 1.78, marginTop: 6, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', left: width > 560 ? 40 : 6, top: bw * 0.3, transform: [{ rotate: '-8deg' }], opacity: 0.9 }}>
            <Floating delay={300} amp={8}>
              <Book3D book={SAMPLE[1]} width={bw * 0.72} interactive={false} />
            </Floating>
          </View>
          <View style={{ position: 'absolute', right: width > 560 ? 40 : 6, top: bw * 0.42, transform: [{ rotate: '7deg' }], opacity: 0.9 }}>
            <Floating delay={900} amp={9}>
              <Book3D book={SAMPLE[2]} width={bw * 0.68} interactive={false} />
            </Floating>
          </View>
          <Floating delay={0} amp={12}>
            <Tilt max={8}>
              <Book3D book={SAMPLE[0]} width={bw} />
            </Tilt>
          </Floating>
        </View>

        <View style={{ paddingHorizontal: 24, flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View entering={FadeInDown.delay(150).springify().damping(16)}>
            <T v="display" style={{ fontSize: 33, lineHeight: 39 }}>
              Okuduğun her sayfa bir iz bırakır.
            </T>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(260).springify().damping(16)}>
            <T v="body" color={t.c.textSoft} style={{ marginTop: 12 }}>
              Kitaplarını kaydet, düşüncelerini paylaş, seninle aynı sayfada olan okurları bul.
            </T>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(360).springify().damping(16)} style={{ marginTop: 20, gap: 10 }}>
            {FEATURES.map((f) => (
              <Row key={f.text} gap={12}>
                <View style={{ width: 32, height: 32, borderRadius: t.style === 'android' ? 16 : 10, backgroundColor: t.c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={f.icon} size={17} color={t.c.onPrimarySoft} />
                </View>
                <T v="callout" weight="medium">
                  {f.text}
                </T>
              </Row>
            ))}
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(480).springify().damping(16)} style={{ marginTop: 28, gap: 12 }}>
            <Button title="Hemen başla" gradient onPress={() => router.push('/register')} icon="sparkles" />
            <Button title="Zaten hesabım var" kind={t.style === 'ios' ? 'text' : 'outline'} onPress={() => router.push('/login')} />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
