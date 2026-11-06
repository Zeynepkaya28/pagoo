import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Avatar, Button, Divider, Empty, Loading, Row, T } from '@/ui/primitives';
import { useTheme } from '@/theme/ThemeProvider';
import { conversations } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { useAuth } from '@/lib/auth';

export default function Messages() {
  const t = useTheme();
  const { session } = useAuth();
  const q = useQuery({ queryKey: ['conversations'], queryFn: conversations, refetchInterval: 20_000 });
  return (
    <Screen title="Mesajlar" back refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      {q.isLoading ? (
        <Loading />
      ) : !(q.data ?? []).length ? (
        <Empty icon="chatbubbles-outline" title="Henüz mesajın yok" text="Bir okurun profiline gidip ona kitaplar hakkında yazabilirsin." action={<Button title="Okur bul" kind="tonal" onPress={() => router.push('/search')} />} />
      ) : (
        q.data!.map((c, i) => (
          <Animated.View key={c.other.id} entering={FadeInDown.delay(i * 30)}>
            <Pressable onPress={() => router.push(`/messages/${c.other.id}`)} style={({ pressed }) => ({ backgroundColor: pressed ? t.c.cardAlt : 'transparent' })}>
              <Row gap={12} style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                <Avatar uri={c.other.avatar_url} name={c.other.full_name ?? c.other.username} size={52} />
                <View style={{ flex: 1 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <T v="headline" weight={c.unread ? 'bold' : 'medium'}>
                      {c.other.full_name || c.other.username}
                    </T>
                    <T v="caption">{timeAgo(c.last.created_at)}</T>
                  </Row>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <T v="callout" numberOfLines={1} color={c.unread ? t.c.text : t.c.textMuted} style={{ flex: 1 }}>
                      {c.last.sender_id === session?.user.id ? 'Sen: ' : ''}
                      {c.last.content}
                    </T>
                    {c.unread > 0 && (
                      <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: t.c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                        <T v="caption" weight="bold" color={t.c.onPrimary}>
                          {c.unread}
                        </T>
                      </View>
                    )}
                  </Row>
                </View>
              </Row>
            </Pressable>
            <Divider inset={84} />
          </Animated.View>
        ))
      )}
    </Screen>
  );
}
