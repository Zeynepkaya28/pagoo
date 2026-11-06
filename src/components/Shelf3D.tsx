import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { coverColors } from './BookCover';
import { haptic } from '@/ui/primitives';
import { useTheme } from '@/theme/ThemeProvider';
import { hash } from '@/lib/format';
import type { ShelfEntry } from '@/lib/types';

const SHELF_H = 178;

function Spine({ entry, index }: { entry: ShelfEntry; index: number }) {
  const b = entry.book!;
  const [main, accent, paper] = coverColors(b);
  const h = hash(b.id);
  const w = Math.max(24, Math.min(46, Math.round((b.page_count ?? 300) / 16)));
  const ht = SHELF_H - 26 - (h % 34);
  const lift = useSharedValue(0);
  const tilt = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { translateY: -lift.value }, { rotateY: `${tilt.value}deg` }],
  }));
  const progress = entry.status === 'reading' && b.page_count ? Math.min(1, entry.current_page / b.page_count) : entry.status === 'read' ? 1 : 0;
  const lean = index % 7 === 6 ? -6 : 0;
  return (
    <Animated.View entering={FadeInDown.delay(index * 35).springify().damping(16)} style={{ transform: [{ rotate: `${lean}deg` }], transformOrigin: 'bottom right' } as any}>
      <Pressable
        onHoverIn={() => (lift.value = withSpring(10, { damping: 14 }))}
        onHoverOut={() => (lift.value = withSpring(0, { damping: 14 }))}
        onPress={() => {
          haptic('medium');
          lift.value = withSequence(withSpring(26, { damping: 12, stiffness: 220 }), withTiming(26, { duration: 120 }));
          tilt.value = withSequence(withTiming(-35, { duration: 220 }), withTiming(0, { duration: 400 }));
          setTimeout(() => {
            router.push(`/book/${b.id}`);
            lift.value = withSpring(0);
          }, 260);
        }}
      >
        <Animated.View style={[{ width: w, height: ht, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: main, overflow: 'hidden' }, style]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.3)']}
            locations={[0, 0.25, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{ position: 'absolute', top: 10, left: 4, right: 4, height: 2, backgroundColor: accent }} />
            <View style={{ position: 'absolute', top: 15, left: 4, right: 4, height: 1, backgroundColor: accent, opacity: 0.6 }} />
            <View style={{ width: ht - 44, transform: [{ rotate: '90deg' }], alignItems: 'center' }}>
              <Text numberOfLines={1} style={{ fontFamily: 'Fraunces_700Bold', color: paper, fontSize: Math.min(13, w * 0.42) }}>
                {b.title}
              </Text>
            </View>
            {progress > 0 && (
              <View style={{ position: 'absolute', bottom: 8, left: 5, right: 5, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' }}>
                <View style={{ width: `${progress * 100}%`, height: 3, borderRadius: 2, backgroundColor: accent }} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function Plank() {
  const t = useTheme();
  const dark = t.scheme === 'dark';
  const top = dark ? ['#3B2A1E', '#2A1D14'] : ['#D9B48A', '#C49A6C'];
  const front = dark ? ['#2A1D14', '#1A120C'] : ['#B98A5B', '#8E643E'];
  return (
    <View style={{ marginHorizontal: -6 }}>
      <View style={{ height: 14, overflow: 'visible' }}>
        <LinearGradient colors={top as any} style={{ height: 14, transform: [{ perspective: 400 }, { rotateX: '55deg' }], transformOrigin: 'bottom', borderTopLeftRadius: 2, borderTopRightRadius: 2 } as any} />
      </View>
      <LinearGradient colors={front as any} style={{ height: 14, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
      <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)']} style={{ height: 18, marginHorizontal: 8 }} />
    </View>
  );
}

export function Shelf3D({ entries }: { entries: ShelfEntry[] }) {
  const [width, setWidth] = useState(0);
  const rows: ShelfEntry[][] = [];
  if (width) {
    let row: ShelfEntry[] = [];
    let used = 0;
    for (const e of entries) {
      if (!e.book) continue;
      const w = Math.max(24, Math.min(46, Math.round((e.book.page_count ?? 300) / 16))) + 3;
      if (used + w > width - 10 && row.length) {
        rows.push(row);
        row = [];
        used = 0;
      }
      row.push(e);
      used += w;
    }
    if (row.length) rows.push(row);
  }
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ paddingHorizontal: 20 }}>
      {rows.map((r, i) => (
        <View key={i} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: SHELF_H - 10, paddingHorizontal: 4 }}>
            {r.map((e, j) => (
              <Spine key={e.book_id} entry={e} index={i * 12 + j} />
            ))}
          </View>
          <Plank />
        </View>
      ))}
    </View>
  );
}
