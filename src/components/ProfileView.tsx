import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/ui/Screen';
import { Avatar, Button, Card, Empty, IconButton, Loading, Row, Segmented, T, Tap } from '@/ui/primitives';
import { Aurora, ProgressRing } from './effects';
import { BookCover } from './BookCover';
import { PostCard } from './PostCard';
import { useTheme } from '@/theme/ThemeProvider';
import { getProfile, isFollowing, lists, postsForUser, setFollow, shelf, stats } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compact } from '@/lib/format';

type Tab = 'posts' | 'quote' | 'review' | 'books' | 'lists';

export function ProfileView({ userId, isTab }: { userId: string; isTab?: boolean }) {
  const t = useTheme();
  const qc = useQueryClient();
  const { session } = useAuth();
  const me = session?.user.id === userId;
  const [tab, setTab] = useState<Tab>('posts');
  const p = useQuery({ queryKey: ['profile', userId], queryFn: () => getProfile(userId) });
  const st = useQuery({ queryKey: ['stats', userId], queryFn: () => stats(userId) });
  const following = useQuery({ queryKey: ['following', userId], queryFn: () => isFollowing(userId), enabled: !me });
  const posts = useQuery({ queryKey: ['user-posts', userId, tab], queryFn: () => postsForUser(userId, tab === 'posts' ? undefined : (tab as any)), enabled: ['posts', 'quote', 'review'].includes(tab) });
  const books = useQuery({ queryKey: ['shelf', userId, 'all'], queryFn: () => shelf(userId), enabled: tab === 'books' });
  const userLists = useQuery({ queryKey: ['lists', userId], queryFn: () => lists(userId), enabled: tab === 'lists' });

  const toggleFollow = async () => {
    const v = !following.data;
    qc.setQueryData(['following', userId], v);
    try {
      await setFollow(userId, v);
    } catch {
      qc.setQueryData(['following', userId], !v);
    }
    qc.invalidateQueries({ queryKey: ['stats', userId] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  };

  const prof = p.data;
  const s = st.data;
  const goal = prof?.reading_goal ?? 24;

  const statBox = (n: number | undefined, label: string, onPress?: () => void) => (
    <Pressable onPress={onPress} style={{ alignItems: 'center', flex: 1 }}>
      <T v="title">{compact(n ?? 0)}</T>
      <T v="caption">{label}</T>
    </Pressable>
  );

  return (
    <Screen
      title={me && isTab ? 'Profil' : prof?.full_name || prof?.username || ''}
      large={false}
      back={!isTab}
      tabBarSpace={isTab}
      refreshing={p.isRefetching}
      onRefresh={() => {
        p.refetch();
        st.refetch();
        posts.refetch();
      }}
      right={
        me ? (
          <>
            <IconButton name="stats-chart-outline" onPress={() => router.push('/stats')} />
            <IconButton name={t.style === 'android' ? 'settings-outline' : 'settings-outline'} onPress={() => router.push('/settings')} />
          </>
        ) : (
          <IconButton name="paper-plane-outline" onPress={() => router.push(`/messages/${userId}`)} />
        )
      }
    >
      <Aurora height={340} style={{ top: -100 }} />
      {!prof ? (
        <Loading />
      ) : (
        <Animated.View entering={FadeIn.duration(400)}>
          <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 }}>
            <Animated.View entering={FadeInDown.springify().damping(14)}>
              <Avatar uri={prof.avatar_url} name={prof.full_name ?? prof.username} size={96} ring />
            </Animated.View>
            <T v="display" center style={{ marginTop: 12 }}>
              {prof.full_name || prof.username}
            </T>
            <T v="callout" color={t.c.textMuted}>
              @{prof.username}
            </T>
            {!!prof.bio && (
              <T v="body" center color={t.c.textSoft} style={{ marginTop: 10, maxWidth: 480 }}>
                {prof.bio}
              </T>
            )}
          </View>

          <Card style={{ marginHorizontal: 16, marginTop: 18, flexDirection: 'row', paddingVertical: 14 }}>
            {statBox(s?.read_total, 'Okunan')}
            {statBox(s?.followers, 'Takipçi', () => router.push(`/follows/${userId}?type=followers`))}
            {statBox(s?.following, 'Takip', () => router.push(`/follows/${userId}?type=following`))}
            {statBox((s?.reviews ?? 0) + (s?.quotes ?? 0), 'Paylaşım')}
          </Card>

          <Row gap={10} style={{ paddingHorizontal: 16, marginTop: 12 }}>
            {me ? (
              <>
                <Button title="Profili düzenle" kind="tonal" icon="pencil" style={{ flex: 1 }} onPress={() => router.push('/edit-profile')} small />
                <Button title="Listeler" kind="outline" icon="albums-outline" style={{ flex: 1 }} onPress={() => router.push(`/lists/${userId}`)} small />
              </>
            ) : (
              <>
                <Button
                  title={following.data ? 'Takip ediliyor' : 'Takip et'}
                  icon={following.data ? 'checkmark' : 'person-add'}
                  kind={following.data ? 'tonal' : 'filled'}
                  gradient={!following.data}
                  style={{ flex: 1 }}
                  onPress={toggleFollow}
                  small
                />
                <Button title="Mesaj" kind="outline" icon="chatbubble-outline" style={{ flex: 1 }} onPress={() => router.push(`/messages/${userId}`)} small />
              </>
            )}
          </Row>

          <Card style={{ marginHorizontal: 16, marginTop: 12 }} onPress={me ? () => router.push('/stats') : undefined}>
            <Row gap={16}>
              <ProgressRing progress={goal ? (s?.read_this_year ?? 0) / goal : 0} size={58} stroke={6}>
                <Ionicons name="trophy" size={18} color={t.c.star} />
              </ProgressRing>
              <View style={{ flex: 1 }}>
                <T v="label">{new Date().getFullYear()} hedefi</T>
                <T v="headline" weight="bold">
                  {s?.read_this_year ?? 0} / {goal} kitap
                </T>
                <T v="caption">{(s?.pages_this_year ?? 0).toLocaleString('tr-TR')} sayfa · {s?.reading ?? 0} kitap okunuyor</T>
              </View>
            </Row>
          </Card>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 14 }}>
            <Segmented
              style={{ minWidth: 460 }}
              items={[
                { key: 'posts', label: 'Akış' },
                { key: 'review', label: 'İnceleme' },
                { key: 'quote', label: 'Alıntı' },
                { key: 'books', label: 'Kitaplar' },
                { key: 'lists', label: 'Listeler' },
              ]}
              value={tab}
              onChange={setTab}
            />
          </ScrollView>

          {tab === 'books' ? (
            books.isLoading ? (
              <Loading />
            ) : (books.data ?? []).length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 }}>
                {books.data!.map((e, i) => (
                  <Animated.View key={e.book_id} entering={FadeInDown.delay(i * 25)}>
                    <Tap onPress={() => router.push(`/book/${e.book_id}`)}>
                      <BookCover book={e.book!} width={96} />
                    </Tap>
                  </Animated.View>
                ))}
              </View>
            ) : (
              <Empty icon="library-outline" title="Kitaplık boş" />
            )
          ) : tab === 'lists' ? (
            (userLists.data ?? []).length ? (
              <View style={{ paddingHorizontal: 16, gap: 10 }}>
                {userLists.data!.map((l) => (
                  <Card key={l.id} onPress={() => router.push(`/list/${l.id}`)}>
                    <Row gap={12}>
                      <View style={{ flexDirection: 'row', width: 76 }}>
                        {(l.items ?? []).slice(0, 3).map((it, i) => (
                          <View key={it.book.id} style={{ marginLeft: i ? -26 : 0, transform: [{ rotate: `${(i - 1) * 6}deg` }] }}>
                            <BookCover book={it.book} width={42} />
                          </View>
                        ))}
                        {!l.items?.length && (
                          <LinearGradient colors={t.c.gradient} style={{ width: 42, height: 63, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="albums" color="#fff" size={18} />
                          </LinearGradient>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <T v="headline">{l.title}</T>
                        <T v="caption">{l.count} kitap</T>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={t.c.textMuted} />
                    </Row>
                  </Card>
                ))}
              </View>
            ) : (
              <Empty icon="albums-outline" title="Henüz liste yok" />
            )
          ) : posts.isLoading ? (
            <Loading />
          ) : (posts.data ?? []).length ? (
            posts.data!.map((x) => <PostCard key={x.id} post={x} />)
          ) : (
            <Empty icon="chatbubbles-outline" title="Henüz paylaşım yok" />
          )}
        </Animated.View>
      )}
    </Screen>
  );
}
