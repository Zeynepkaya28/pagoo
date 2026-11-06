import React, { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/ui/Screen';
import { Chip, IconButton, Row, SectionHeader, T, Tap } from '@/ui/primitives';
import { CoverFlow } from '@/components/CoverFlow';
import { BookCover } from '@/components/BookCover';
import { Aurora, Shimmer } from '@/components/effects';
import { useTheme } from '@/theme/ThemeProvider';
import { categories, listBooks } from '@/lib/api';
import { avgRating } from '@/lib/format';
import type { Book } from '@/lib/types';

const CAT_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Roman: 'book', Klasik: 'library', 'Bilim Kurgu': 'planet', Distopya: 'eye', Felsefe: 'bulb', Polisiye: 'search', Fantastik: 'sparkles', Şiir: 'leaf',
  Tarih: 'time', Psikoloji: 'happy', Öykü: 'chatbox-ellipses', 'Modern Klasik': 'ribbon', Çağdaş: 'cafe', Novella: 'document-text',
};
const CAT_GRAD: [string, string][] = [
  ['#FF8A65', '#E5396B'], ['#7C4DFF', '#448AFF'], ['#00BFA5', '#1DE9B6'], ['#FFB300', '#FF6F00'], ['#5C6BC0', '#26C6DA'], ['#EC407A', '#AB47BC'], ['#43A047', '#C0CA33'], ['#8D6E63', '#D7A86E'],
];

function BookRow({ books }: { books: Book[] }) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
      {books.map((b, i) => {
        const r = avgRating(b.rating_sum, b.rating_count);
        return (
          <Animated.View key={b.id} entering={FadeInDown.delay(i * 40).springify().damping(16)} style={{ width: 110 }}>
            <Tap onPress={() => router.push(`/book/${b.id}`)}>
              <BookCover book={b} width={110} />
              <T v="callout" weight="bold" numberOfLines={2} style={{ marginTop: 8 }}>
                {b.title}
              </T>
              <T v="caption" numberOfLines={1}>
                {b.author?.name}
              </T>
              {r ? (
                <Row gap={3} style={{ marginTop: 2 }}>
                  <Ionicons name="star" size={11} color={t.c.star} />
                  <T v="caption" weight="bold" color={t.c.textSoft}>
                    {r.toFixed(1)}
                  </T>
                </Row>
              ) : null}
            </Tap>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

export default function Discover() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const [cat, setCat] = useState<string | null>(null);
  const popular = useQuery({ queryKey: ['books', 'popular'], queryFn: () => listBooks({ order: 'popular', limit: 14 }) });
  const fresh = useQuery({ queryKey: ['books', 'new'], queryFn: () => listBooks({ order: 'new', limit: 14, offset: 0 }) });
  const rated = useQuery({ queryKey: ['books', 'rating'], queryFn: () => listBooks({ order: 'rating', limit: 14 }) });
  const cats = useQuery({ queryKey: ['categories'], queryFn: categories });
  const byCat = useQuery({ queryKey: ['books', 'cat', cat], queryFn: () => listBooks({ category: cat!, limit: 40 }), enabled: !!cat });
  const cols = Math.max(3, Math.floor(Math.min(width, 900) / 125));
  const cellW = (Math.min(width, 900) - 40 - (cols - 1) * 12) / cols;

  return (
    <Screen title="Keşfet" tabBarSpace right={<IconButton name="barcode-outline" onPress={() => router.push('/search?external=1')} />} refreshing={popular.isRefetching} onRefresh={() => popular.refetch()}>
      <Aurora height={520} intensity={0.55} style={{ top: -60 }} />
      <Pressable onPress={() => router.push('/search')} style={{ marginHorizontal: 16 }}>
        <View
          style={{
            height: t.style === 'android' ? 56 : t.style === 'harmony' ? 44 : 38,
            borderRadius: t.style === 'android' ? 28 : t.style === 'harmony' ? 22 : 10,
            backgroundColor: t.style === 'android' ? t.c.cardAlt : t.style === 'harmony' ? t.c.card : t.scheme === 'dark' ? '#1C1C1E' : 'rgba(118,118,128,0.12)',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            gap: 10,
          }}
        >
          <Ionicons name="search" size={t.style === 'ios' ? 17 : 21} color={t.c.textMuted} />
          <T v="body" color={t.c.textMuted} style={{ flex: 1 }}>
            Kitap, yazar ya da okur ara
          </T>
          {t.style === 'android' && <Ionicons name="mic-outline" size={21} color={t.c.textSoft} />}
        </View>
      </Pressable>

      <SectionHeader title="Bu hafta öne çıkanlar" />
      {popular.data ? (
        <Animated.View entering={FadeIn.duration(500)}>
          <CoverFlow books={popular.data} />
        </Animated.View>
      ) : (
        <Row style={{ justifyContent: 'center' }} gap={14}>
          <Shimmer width={110} height={165} />
          <Shimmer width={150} height={225} />
          <Shimmer width={110} height={165} />
        </Row>
      )}

      <SectionHeader title="Türler" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <Chip label="Tümü" active={!cat} onPress={() => setCat(null)} />
        {(cats.data ?? []).map((c) => (
          <Chip key={c} label={c} active={cat === c} onPress={() => setCat(cat === c ? null : c)} icon={CAT_ICON[c]} />
        ))}
      </ScrollView>

      {cat ? (
        <Animated.View layout={LinearTransition} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginTop: 16 }}>
          {(byCat.data ?? []).map((b, i) => (
            <Animated.View key={b.id} entering={FadeInDown.delay(i * 30).springify().damping(16)} style={{ width: cellW }}>
              <Tap onPress={() => router.push(`/book/${b.id}`)}>
                <BookCover book={b} width={cellW} />
                <T v="caption" weight="bold" color={t.c.text} numberOfLines={2} style={{ marginTop: 6 }}>
                  {b.title}
                </T>
              </Tap>
            </Animated.View>
          ))}
        </Animated.View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 14 }}>
            {(cats.data ?? []).slice(0, 8).map((c, i) => (
              <Animated.View key={c} entering={FadeInDown.delay(i * 40).springify().damping(16)} style={{ width: (Math.min(width, 900) - 42) / 2 }}>
                <Tap onPress={() => setCat(c)} style={{ borderRadius: t.shape.radius, overflow: 'hidden' }}>
                  <LinearGradient colors={CAT_GRAD[i % CAT_GRAD.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 76, padding: 14, justifyContent: 'flex-end' }}>
                    <Ionicons name={CAT_ICON[c] ?? 'book'} size={46} color="rgba(255,255,255,0.28)" style={{ position: 'absolute', right: 8, top: 8, transform: [{ rotate: '-12deg' }] }} />
                    <T v="headline" weight="bold" color="#fff">
                      {c}
                    </T>
                  </LinearGradient>
                </Tap>
              </Animated.View>
            ))}
          </View>

          <SectionHeader title="Okurların favorileri" />
          {rated.data && <BookRow books={rated.data} />}
          <SectionHeader title="Yeni eklenenler" />
          {fresh.data && <BookRow books={fresh.data} />}
          <Pressable onPress={() => router.push('/search?external=1')} style={{ marginHorizontal: 16, marginTop: 26 }}>
            <LinearGradient colors={t.c.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: t.shape.radiusLg, padding: 20 }}>
              <Row gap={14}>
                <Ionicons name="add-circle" size={36} color="#fff" />
                <View style={{ flex: 1 }}>
                  <T v="headline" weight="bold" color="#fff">
                    Aradığın kitap yok mu?
                  </T>
                  <T v="caption" color="rgba(255,255,255,0.85)">
                    Milyonlarca kitaplık katalogdan bul, tek dokunuşla ekle.
                  </T>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Row>
            </LinearGradient>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
