import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/ui/Screen';
import { Avatar, Divider, Empty, IconButton, Loading, Row, T } from '@/ui/primitives';
import { useTheme } from '@/theme/ThemeProvider';
import { markNotificationsRead, notifications } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import type { Notification } from '@/lib/types';

const META: Record<Notification['type'], { icon: keyof typeof Ionicons.glyphMap; text: string; colorKey: 'accent' | 'primary' | 'success' }> = {
  like: { icon: 'heart', text: 'paylaşımını beğendi', colorKey: 'accent' },
  comment: { icon: 'chatbubble', text: 'paylaşımına yorum yaptı', colorKey: 'primary' },
  follow: { icon: 'person-add', text: 'seni takip etmeye başladı', colorKey: 'success' },
  message: { icon: 'mail', text: 'sana mesaj gönderdi', colorKey: 'primary' },
};

function group(list: Notification[]) {
  const today: Notification[] = [];
  const week: Notification[] = [];
  const older: Notification[] = [];
  const now = Date.now();
  list.forEach((n) => {
    const d = (now - new Date(n.created_at).getTime()) / 86400000;
    (d < 1 ? today : d < 7 ? week : older).push(n);
  });
  return [
    { title: 'Bugün', items: today },
    { title: 'Bu hafta', items: week },
    { title: 'Daha önce', items: older },
  ].filter((g) => g.items.length);
}

export default function Notifications() {
  const t = useTheme();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notifications'], queryFn: notifications });

  useFocusEffect(
    React.useCallback(() => {
      const id = setTimeout(async () => {
        await markNotificationsRead();
        qc.setQueryData(['unread'], 0);
      }, 1200);
      return () => clearTimeout(id);
    }, []),
  );

  return (
    <Screen title="Bildirimler" tabBarSpace refreshing={q.isRefetching} onRefresh={() => q.refetch()} right={<IconButton name="chatbubbles-outline" onPress={() => router.push('/messages')} />}>
      {q.isLoading ? (
        <Loading />
      ) : !(q.data ?? []).length ? (
        <Empty icon="notifications-outline" title="Her şey sakin" text="Beğeniler, yorumlar ve yeni takipçiler burada görünecek." />
      ) : (
        group(q.data!).map((g) => (
          <View key={g.title} style={{ marginBottom: 8 }}>
            <T v="label" style={{ paddingHorizontal: 20, marginTop: 10, marginBottom: 6 }}>
              {g.title}
            </T>
            <View style={t.style === 'ios' ? { marginHorizontal: 16, backgroundColor: t.c.card, borderRadius: t.shape.radius, overflow: 'hidden' } : undefined}>
              {g.items.map((n, i) => {
                const m = META[n.type];
                return (
                  <Animated.View key={n.id} entering={FadeInDown.delay(i * 30).springify().damping(18)}>
                    <Pressable
                      onPress={() => (n.post_id ? router.push(`/post/${n.post_id}`) : router.push(n.type === 'message' ? `/messages/${n.actor_id}` : `/user/${n.actor_id}`))}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 12,
                        paddingHorizontal: t.style === 'ios' ? 14 : 20,
                        backgroundColor: pressed ? t.c.cardAlt : !n.read ? t.c.primarySoft + (t.style === 'harmony' ? '88' : '55') : 'transparent',
                        marginHorizontal: t.style === 'harmony' ? 12 : 0,
                        borderRadius: t.style === 'harmony' ? 18 : 0,
                        marginBottom: t.style === 'harmony' ? 6 : 0,
                      })}
                    >
                      <View>
                        <Avatar uri={n.actor?.avatar_url} name={n.actor?.full_name ?? n.actor?.username} size={46} />
                        <View style={{ position: 'absolute', right: -3, bottom: -3, width: 22, height: 22, borderRadius: 11, backgroundColor: t.c[m.colorKey], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.c.bg }}>
                          <Ionicons name={m.icon} size={11} color="#fff" />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <T v="callout" numberOfLines={2}>
                          <T v="callout" weight="bold">
                            {n.actor?.full_name || n.actor?.username}
                          </T>{' '}
                          {m.text}
                        </T>
                        {n.post?.content && n.post.type !== 'status' ? (
                          <T v="caption" numberOfLines={1}>
                            “{n.post.content}”
                          </T>
                        ) : null}
                      </View>
                      <T v="caption">{timeAgo(n.created_at)}</T>
                    </Pressable>
                    {t.style === 'ios' && i < g.items.length - 1 && <Divider inset={72} />}
                  </Animated.View>
                );
              })}
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
