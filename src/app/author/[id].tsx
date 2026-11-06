import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Avatar, Card, Loading, Row, Stars, T, Tap } from '@/ui/primitives';
import { Aurora } from '@/components/effects';
import { BookCover } from '@/components/BookCover';
import { useTheme } from '@/theme/ThemeProvider';
import { booksByAuthor, getAuthor } from '@/lib/api';
import { avgRating } from '@/lib/format';

export default function AuthorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const a = useQuery({ queryKey: ['author', id], queryFn: () => getAuthor(id) });
  const books = useQuery({ queryKey: ['author-books', id], queryFn: () => booksByAuthor(id) });
  const readers = (books.data ?? []).reduce((s, b) => s + b.readers_count, 0);
  return (
    <Screen title={a.data?.name ?? ''} back large={false}>
      <Aurora height={320} style={{ top: -80 }} />
      {!a.data ? (
        <Loading />
      ) : (
        <>
          <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center', paddingHorizontal: 24 }}>
            <Avatar uri={a.data.photo_url} name={a.data.name} size={104} ring />
            <T v="display" center style={{ marginTop: 14 }}>
              {a.data.name}
            </T>
            <T v="callout" color={t.c.textMuted}>
              {[a.data.country, a.data.born ? `${a.data.born}${a.data.died ? ` – ${a.data.died}` : ''}` : null].filter(Boolean).join(' · ')}
            </T>
          </Animated.View>
          <Card style={{ marginHorizontal: 16, marginTop: 18, flexDirection: 'row' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <T v="title">{books.data?.length ?? 0}</T>
              <T v="caption">Kitap</T>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <T v="title">{readers}</T>
              <T v="caption">Okur</T>
            </View>
          </Card>
          {!!a.data.bio && (
            <T v="body" color={t.c.textSoft} style={{ paddingHorizontal: 20, marginTop: 18 }}>
              {a.data.bio}
            </T>
          )}
          <T v="title" style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 10 }}>
            Kitapları
          </T>
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {(books.data ?? []).map((b, i) => {
              const r = avgRating(b.rating_sum, b.rating_count);
              return (
                <Animated.View key={b.id} entering={FadeInDown.delay(i * 40).springify().damping(16)}>
                  <Card onPress={() => router.push(`/book/${b.id}`)}>
                    <Row gap={14}>
                      <BookCover book={b} width={56} />
                      <View style={{ flex: 1, gap: 3 }}>
                        <T v="headline" style={{ fontFamily: t.font.display }}>
                          {b.title}
                        </T>
                        <T v="caption">{[b.published_year, b.page_count ? `${b.page_count} sayfa` : null].filter(Boolean).join(' · ')}</T>
                        {r ? <Stars value={r} size={12} /> : null}
                      </View>
                    </Row>
                  </Card>
                </Animated.View>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}
