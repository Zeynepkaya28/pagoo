import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, useTabBarSpace } from '@/ui/Screen';
import { Avatar, Button, Card, Empty, IconButton, Row, Segmented, T, Tap } from '@/ui/primitives';
import { PostCard } from '@/components/PostCard';
import { BookCover } from '@/components/BookCover';
import { ProgressRing, Shimmer } from '@/components/effects';
import { ProgressSheet } from '@/components/ReadingSheets';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/lib/auth';
import { feed, setFollow, shelf, stats, suggestedReaders } from '@/lib/api';
import type { ShelfEntry } from '@/lib/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function ReadingNow({ entries, onUpdate }: { entries: ShelfEntry[]; onUpdate: (e: ShelfEntry) => void }) {
  const t = useTheme();
  if (!entries.length) {
    return (
      <Card style={{ marginHorizontal: 16 }} onPress={() => router.push('/discover')}>
        <Row gap={14}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: t.c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="book-outline" size={24} color={t.c.onPrimarySoft} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="headline">Şu an ne okuyorsun?</T>
            <T v="caption">Bir kitap seç, ilerlemeni buradan kolayca güncelle.</T>
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.c.textMuted} />
        </Row>
      </Card>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
      {entries.map((e, i) => {
        const b = e.book!;
        const p = b.page_count ? e.current_page / b.page_count : 0;
        return (
          <Animated.View key={e.book_id} entering={FadeInDown.delay(i * 70).springify().damping(16)}>
            <Card style={{ width: entries.length === 1 ? undefined : 300, minWidth: 280 }} padded>
              <Row gap={14} center={false}>
                <Tap onPress={() => router.push(`/book/${b.id}`)}>
                  <BookCover book={b} width={70} />
                </Tap>
                <View style={{ flex: 1, gap: 4 }}>
                  <T v="headline" numberOfLines={2} style={{ fontFamily: t.font.display }}>
                    {b.title}
                  </T>
                  <T v="caption" numberOfLines={1}>
                    {b.author?.name}
                  </T>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: t.c.cardAlt, marginTop: 8, overflow: 'hidden' }}>
                    <LinearGradient colors={t.c.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${Math.max(3, p * 100)}%`, height: 6 }} />
                  </View>
                  <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
                    <T v="caption">
                      {e.current_page}/{b.page_count ?? '?'} · %{Math.round(p * 100)}
                    </T>
                    <Button title="Güncelle" small kind="tonal" onPress={() => onUpdate(e)} />
                  </Row>
                </View>
              </Row>
            </Card>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

function Suggestions() {
  const t = useTheme();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['suggested'], queryFn: () => suggestedReaders(12) });
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  if (!data.length) return null;
  return (
    <View style={{ marginTop: 8 }}>
      <T v="title" style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        Tanışabileceğin okurlar
      </T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {data.map((p) => (
          <Card key={p.id} style={{ width: 150, alignItems: 'center' }} onPress={() => router.push(`/user/${p.id}`)}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Avatar uri={p.avatar_url} name={p.full_name ?? p.username} size={60} ring />
              <T v="headline" numberOfLines={1}>
                {p.full_name || p.username}
              </T>
              <T v="caption" numberOfLines={1}>
                @{p.username}
              </T>
              <Button
                title={followed[p.id] ? 'Takiptesin' : 'Takip et'}
                small
                kind={followed[p.id] ? 'outline' : 'filled'}
                onPress={async () => {
                  const v = !followed[p.id];
                  setFollowed((s) => ({ ...s, [p.id]: v }));
                  await setFollow(p.id, v).catch(() => setFollowed((s) => ({ ...s, [p.id]: !v })));
                  qc.invalidateQueries({ queryKey: ['feed'] });
                }}
                style={{ marginTop: 4, alignSelf: 'stretch' }}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

export default function Home() {
  const t = useTheme();
  const { profile, session } = useAuth();
  const uid = session?.user.id;
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const [scope, setScope] = useState<'following' | 'everyone'>('everyone');
  const [progressFor, setProgressFor] = useState<ShelfEntry | null>(null);

  const reading = useQuery({ queryKey: ['shelf', uid, 'reading'], queryFn: () => shelf(uid!, 'reading'), enabled: !!uid });
  const st = useQuery({ queryKey: ['stats', uid], queryFn: () => stats(uid!), enabled: !!uid });
  const posts = useInfiniteQuery({
    queryKey: ['feed', scope],
    queryFn: ({ pageParam }) => feed({ scope, before: pageParam as string | undefined, limit: 15 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.length < 15 ? undefined : last[last.length - 1].created_at),
  });
  const list = useMemo(() => posts.data?.pages.flat() ?? [], [posts.data]);
  const goal = profile?.reading_goal ?? 24;
  const done = st.data?.read_this_year ?? 0;

  const refresh = () => {
    reading.refetch();
    st.refetch();
    posts.refetch();
  };

  const right =
    t.style === 'android' ? (
      <>
        <IconButton name="search" onPress={() => router.push('/search')} />
        <IconButton name="chatbubbles-outline" onPress={() => router.push('/messages')} />
      </>
    ) : (
      <>
        <IconButton name="paper-plane-outline" onPress={() => router.push('/messages')} />
        <IconButton name={t.style === 'ios' ? 'square-outline' : 'add'} onPress={() => router.push('/compose')} />
      </>
    );

  return (
    <Screen
      title="Akış"
      right={
        t.style === 'ios' ? (
          <>
            <IconButton name="paper-plane-outline" onPress={() => router.push('/messages')} />
            <IconButton name="create-outline" onPress={() => router.push('/compose')} />
          </>
        ) : (
          right
        )
      }
      tabBarSpace
      refreshing={posts.isRefetching}
      onRefresh={refresh}
      onEndReached={() => posts.hasNextPage && !posts.isFetchingNextPage && posts.fetchNextPage()}
      footer={
        t.style === 'android' ? (
          <Animated.View entering={FadeIn.delay(300)} style={{ position: 'absolute', right: 16, bottom: tabSpace - 2 }}>
            <Tap onPress={() => router.push('/compose')} hapticKind="medium" style={{ borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}>
              <Row gap={10} style={{ height: 56, paddingHorizontal: 18, backgroundColor: t.c.primarySoft }}>
                <Ionicons name="create-outline" size={22} color={t.c.onPrimarySoft} />
                <T v="headline" weight="bold" color={t.c.onPrimarySoft}>
                  Paylaş
                </T>
              </Row>
            </Tap>
          </Animated.View>
        ) : null
      }
    >
      <Animated.View entering={FadeInDown.springify().damping(16)} style={{ paddingHorizontal: 20, marginBottom: 14 }}>
        <T v="callout" color={t.c.textMuted}>
          {greeting()}, <T v="callout" weight="bold">{profile?.full_name?.split(' ')[0] ?? 'okur'}</T>
        </T>
      </Animated.View>

      <ReadingNow entries={reading.data ?? []} onUpdate={setProgressFor} />

      <Card style={{ marginHorizontal: 16, marginTop: 12 }} onPress={() => router.push('/stats')}>
        <Row gap={16}>
          <ProgressRing progress={goal ? done / goal : 0} size={64} stroke={7}>
            <T v="caption" weight="bold" color={t.c.text}>
              %{goal ? Math.min(100, Math.round((done / goal) * 100)) : 0}
            </T>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <T v="label">{new Date().getFullYear()} okuma hedefi</T>
            <T v="title" style={{ marginTop: 2 }}>
              {done} / {goal} kitap
            </T>
            <T v="caption">{st.data ? `Bu yıl ${st.data.pages_this_year.toLocaleString('tr-TR')} sayfa okudun` : ' '}</T>
          </View>
          <Ionicons name="stats-chart" size={20} color={t.c.primary} />
        </Row>
      </Card>

      <View style={{ paddingHorizontal: 16, marginTop: 22, marginBottom: 14 }}>
        <Segmented
          items={[
            { key: 'everyone', label: 'Herkes' },
            { key: 'following', label: 'Takip ettiklerin' },
          ]}
          value={scope}
          onChange={setScope}
        />
      </View>

      {posts.isLoading ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Row gap={10}>
                <Shimmer width={38} height={38} radius={19} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Shimmer width="60%" height={12} />
                  <Shimmer width="30%" height={10} />
                </View>
              </Row>
              <Shimmer width="100%" height={80} style={{ marginTop: 12 }} />
            </Card>
          ))}
        </View>
      ) : posts.isError ? (
        <Empty icon="cloud-offline-outline" title="Akış yüklenemedi" text="Bağlantını kontrol edip tekrar dene." action={<Button title="Tekrar dene" kind="tonal" icon="refresh" onPress={() => posts.refetch()} />} />
      ) : list.length ? (
        list.map((p, i) => (
          <Animated.View key={p.id} entering={i < 8 ? FadeInDown.delay(i * 50).springify().damping(18) : undefined}>
            <PostCard post={p} />
            {i === 4 && scope === 'everyone' && <Suggestions />}
          </Animated.View>
        ))
      ) : (
        <>
          <Empty
            icon="sparkles-outline"
            title={scope === 'following' ? 'Akışın henüz sessiz' : 'İlk paylaşımı sen yap'}
            text={scope === 'following' ? 'Okurları takip ettikçe incelemeleri ve alıntıları burada görünecek.' : 'Bir kitap hakkında düşündüklerini ya da sevdiğin bir alıntıyı paylaş.'}
            action={<Button title="Paylaşım yap" kind="tonal" icon="create-outline" onPress={() => router.push('/compose')} style={{ marginTop: 8 }} />}
          />
          <Suggestions />
        </>
      )}
      {posts.isFetchingNextPage && <Shimmer width="90%" height={90} style={{ alignSelf: 'center', marginTop: 8 }} />}
      {progressFor?.book && <ProgressSheet visible={!!progressFor} onClose={() => setProgressFor(null)} book={progressFor.book} entry={progressFor} />}
      {t.style === 'android' && <View style={{ height: 72 }} />}
    </Screen>
  );
}
