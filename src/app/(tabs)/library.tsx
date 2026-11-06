import React, { useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/ui/Screen';
import { Button, Card, Chip, Empty, IconButton, Loading, Row, Stars, T, Tap } from '@/ui/primitives';
import { Shelf3D } from '@/components/Shelf3D';
import { BookCover } from '@/components/BookCover';
import { ProgressSheet } from '@/components/ReadingSheets';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/lib/auth';
import { shelf } from '@/lib/api';
import { STATUS_LABEL, type ShelfEntry, type ShelfStatus } from '@/lib/types';

type View3 = 'shelf' | 'grid' | 'list';

export default function Library() {
  const t = useTheme();
  const { session } = useAuth();
  const uid = session?.user.id;
  const { width } = useWindowDimensions();
  const [status, setStatus] = useState<ShelfStatus | 'all'>('all');
  const [mode, setMode] = useState<View3>('shelf');
  const [progressFor, setProgressFor] = useState<ShelfEntry | null>(null);
  const q = useQuery({ queryKey: ['shelf', uid, 'all'], queryFn: () => shelf(uid!), enabled: !!uid });
  const all = q.data ?? [];
  const items = useMemo(() => (status === 'all' ? all : all.filter((e) => e.status === status)), [all, status]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    all.forEach((e) => (c[e.status] = (c[e.status] ?? 0) + 1));
    return c;
  }, [all]);
  const cols = Math.max(3, Math.floor(Math.min(width, 900) / 120));
  const cellW = (Math.min(width, 900) - 40 - (cols - 1) * 14) / cols;
  const modeIcon: Record<View3, keyof typeof Ionicons.glyphMap> = { shelf: 'albums-outline', grid: 'grid-outline', list: 'list-outline' };
  const next: Record<View3, View3> = { shelf: 'grid', grid: 'list', list: 'shelf' };

  return (
    <Screen
      title="Kitaplığım"
      subtitle={`${all.length} kitap`}
      tabBarSpace
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
      right={
        <>
          <IconButton name={modeIcon[next[mode]]} onPress={() => setMode(next[mode])} />
          <IconButton name="stats-chart-outline" onPress={() => router.push('/stats')} />
        </>
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 6 }}>
        {(['all', 'reading', 'want', 'read', 'dnf'] as const).map((s) => (
          <Chip key={s} label={`${s === 'all' ? 'Tümü' : STATUS_LABEL[s]}${counts[s] ? ` · ${counts[s]}` : ''}`} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </ScrollView>

      <Row gap={10} style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <Card style={{ flex: 1 }} onPress={() => router.push(`/lists/${uid}`)}>
          <Row gap={10}>
            <Ionicons name="albums" size={22} color={t.c.primary} />
            <T v="headline" style={{ flex: 1 }}>
              Listelerim
            </T>
            <Ionicons name="chevron-forward" size={18} color={t.c.textMuted} />
          </Row>
        </Card>
        <Card style={{ flex: 1 }} onPress={() => router.push('/search?external=1')}>
          <Row gap={10}>
            <Ionicons name="add-circle" size={22} color={t.c.accent} />
            <T v="headline" style={{ flex: 1 }}>
              Kitap ekle
            </T>
          </Row>
        </Card>
      </Row>

      <View style={{ marginTop: 20 }}>
        {q.isLoading ? (
          <Loading />
        ) : !items.length ? (
          <Empty
            icon="library-outline"
            title={status === 'all' ? 'Rafların boş' : `“${STATUS_LABEL[status as ShelfStatus]}” rafında kitap yok`}
            text="Keşfet sayfasından kitap bul ve rafına ekle."
            action={<Button title="Kitap keşfet" kind="tonal" icon="compass-outline" onPress={() => router.push('/discover')} />}
          />
        ) : mode === 'shelf' ? (
          <Shelf3D entries={items} />
        ) : mode === 'grid' ? (
          <Animated.View layout={LinearTransition} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 20 }}>
            {items.map((e, i) => (
              <Animated.View key={e.book_id} entering={FadeInDown.delay(i * 25).springify().damping(16)} style={{ width: cellW }}>
                <Tap onPress={() => router.push(`/book/${e.book_id}`)}>
                  <BookCover book={e.book!} width={cellW} />
                  {e.status === 'reading' && e.book?.page_count ? (
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: t.c.cardAlt, marginTop: 6, overflow: 'hidden' }}>
                      <View style={{ height: 4, width: `${(e.current_page / e.book.page_count) * 100}%`, backgroundColor: t.c.primary }} />
                    </View>
                  ) : null}
                  <T v="caption" weight="bold" color={t.c.text} numberOfLines={2} style={{ marginTop: 6 }}>
                    {e.book?.title}
                  </T>
                </Tap>
              </Animated.View>
            ))}
          </Animated.View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {items.map((e, i) => (
              <Animated.View key={e.book_id} entering={FadeInDown.delay(i * 25).springify().damping(18)}>
                <Card onPress={() => router.push(`/book/${e.book_id}`)}>
                  <Row gap={14}>
                    <BookCover book={e.book!} width={52} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <T v="headline" numberOfLines={1}>
                        {e.book?.title}
                      </T>
                      <T v="caption">{e.book?.author?.name}</T>
                      <Row gap={8} style={{ marginTop: 4 }}>
                        <T v="caption" weight="bold" color={t.c.primary}>
                          {STATUS_LABEL[e.status]}
                        </T>
                        {e.rating ? <Stars value={e.rating} size={11} /> : null}
                        {e.status === 'reading' && e.book?.page_count ? <T v="caption">%{Math.round((e.current_page / e.book.page_count) * 100)}</T> : null}
                      </Row>
                    </View>
                    {e.status === 'reading' && <IconButton name="bookmark-outline" onPress={() => setProgressFor(e)} />}
                  </Row>
                </Card>
              </Animated.View>
            ))}
          </View>
        )}
      </View>
      {progressFor?.book && <ProgressSheet visible onClose={() => setProgressFor(null)} book={progressFor.book} entry={progressFor} />}
    </Screen>
  );
}
