import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Avatar, Card, Empty, Loading, Row, T } from '@/ui/primitives';
import { followList } from '@/lib/api';

export default function Follows() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: 'followers' | 'following' }>();
  const kind = type === 'following' ? 'following' : 'followers';
  const q = useQuery({ queryKey: ['follows', id, kind], queryFn: () => followList(id, kind) });
  return (
    <Screen title={kind === 'followers' ? 'Takipçiler' : 'Takip edilenler'} back>
      {q.isLoading ? (
        <Loading />
      ) : !(q.data ?? []).length ? (
        <Empty icon="people-outline" title="Burada henüz kimse yok" />
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {q.data!.map((p) => (
            <Card key={p.id} onPress={() => router.push(`/user/${p.id}`)}>
              <Row gap={12}>
                <Avatar uri={p.avatar_url} name={p.full_name ?? p.username} size={46} />
                <View style={{ flex: 1 }}>
                  <T v="headline">{p.full_name || p.username}</T>
                  <T v="caption">@{p.username}</T>
                </View>
              </Row>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
