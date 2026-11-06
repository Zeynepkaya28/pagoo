import React from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, SharedValue } from 'react-native-reanimated';
import { router } from 'expo-router';
import { BookCover } from './BookCover';
import { T, Tap, Stars } from '@/ui/primitives';
import { useTheme } from '@/theme/ThemeProvider';
import type { Book } from '@/lib/types';
import { avgRating } from '@/lib/format';

function Item({ book, index, x, size, gap }: { book: Book; index: number; x: SharedValue<number>; size: number; gap: number }) {
  const t = useTheme();
  const step = size + gap;
  const style = useAnimatedStyle(() => {
    const pos = (x.value - index * step) / step; // 0 = centred
    return {
      zIndex: Math.round(100 - Math.abs(pos) * 10),
      opacity: interpolate(Math.abs(pos), [0, 2.5], [1, 0.35], Extrapolation.CLAMP),
      transform: [
        { perspective: 900 },
        { translateX: interpolate(pos, [-2, -1, 0, 1, 2], [-step * 0.55, -step * 0.28, 0, step * 0.28, step * 0.55]) },
        { rotateY: `${interpolate(pos, [-2, -1, 0, 1, 2], [-58, -46, 0, 46, 58], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(Math.abs(pos), [0, 1, 2], [1, 0.82, 0.7], Extrapolation.CLAMP) },
      ],
    };
  });
  const meta = useAnimatedStyle(() => {
    const pos = Math.abs((x.value - index * step) / step);
    return { opacity: interpolate(pos, [0, 0.5], [1, 0], Extrapolation.CLAMP), transform: [{ translateY: interpolate(pos, [0, 0.5], [0, 10], Extrapolation.CLAMP) }] };
  });
  const r = avgRating(book.rating_sum, book.rating_count);
  return (
    <Animated.View style={[{ width: size, marginRight: gap, alignItems: 'center' }, style]}>
      <Tap onPress={() => router.push(`/book/${book.id}`)} scaleTo={0.97}>
        <BookCover book={book} width={size} />
        {/* reflection */}
        {Platform.OS === 'web' && (
          <View style={{ transform: [{ scaleY: -1 }], opacity: 0.12, height: size * 0.35, overflow: 'hidden', marginTop: 6, borderRadius: 4 }} pointerEvents="none">
            <BookCover book={book} width={size} shadow={false} />
          </View>
        )}
      </Tap>
      <Animated.View style={[{ alignItems: 'center', marginTop: Platform.OS === 'web' ? -size * 0.25 : 14, width: size * 1.6 }, meta]}>
        <T v="headline" weight="bold" numberOfLines={1} center>
          {book.title}
        </T>
        <T v="caption" numberOfLines={1} center>
          {book.author?.name}
        </T>
        {r ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Stars value={r} size={12} />
            <T v="caption" color={t.c.textSoft}>
              {r.toFixed(1)}
            </T>
          </View>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

export function CoverFlow({ books }: { books: Book[] }) {
  const { width } = useWindowDimensions();
  const vw = Math.min(width, 720);
  const size = Math.min(170, vw * 0.42);
  const gap = 18;
  const x = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });
  const side = (vw - size) / 2;
  return (
    <Animated.ScrollView
      horizontal
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      snapToInterval={size + gap}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: side, paddingTop: 10, paddingBottom: 6 }}
      style={{ flexGrow: 0 }}
    >
      {books.map((b, i) => (
        <Item key={b.id} book={b} index={i} x={x} size={size} gap={gap} />
      ))}
    </Animated.ScrollView>
  );
}
