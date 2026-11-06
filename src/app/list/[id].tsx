import React from 'react';
import { Alert, Platform, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Button, Card, Empty, IconButton, Loading, Row, T } from '@/ui/primitives';
import { BookCover } from '@/components/BookCover';
import { CoverFlow } from '@/components/CoverFlow';
import { useTheme } from '@/theme/ThemeProvider';
import { deleteList, getList, removeFromList } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const qc = useQueryClient();
  const { session } = useAuth();
  const q = useQuery({ queryKey: ['list', id], queryFn: () => getList(id) });
  const l = q.data;
  const me = l?.user_id === session?.user.id;
  const books = (l?.items ?? []).map((i) => i.book);

  const del = () => {
    const go = async () => {
      await deleteList(id);
      qc.invalidateQueries({ queryKey: ['lists'] });
      router.back();
    };
    if (Platform.OS === 'web') window.confirm('Liste silinsin mi?') && go();
    else Alert.alert('Liste silinsin mi?', undefined, [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: go }]);
  };

  return (
    <Screen title={l?.title ?? 'Liste'} subtitle={l?.description ?? undefined} back right={me ? <IconButton name="trash-outline" color={t.c.danger} onPress={del} /> : null}>
      {q.isLoading ? (
        <Loading />
      ) : !books.length ? (
        <Empty icon="book-outline" title="Liste boş" text="Kitap sayfalarındaki “Liste” düğmesiyle bu listeye kitap ekleyebilirsin." action={<Button title="Kitap keşfet" kind="tonal" onPress={() => router.push('/discover')} />} />
      ) : (
        <>
          {books.length > 2 && <CoverFlow books={books} />}
          <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 16 }}>
            {books.map((b, i) => (
              <Animated.View key={b.id} entering={FadeInDown.delay(i * 30)}>
                <Card onPress={() => router.push(`/book/${b.id}`)}>
                  <Row gap={14}>
                    <T v="title" color={t.c.textMuted} style={{ width: 26 }}>
                      {i + 1}
                    </T>
                    <BookCover book={b} width={46} />
                    <View style={{ flex: 1 }}>
                      <T v="headline" numberOfLines={2}>
                        {b.title}
                      </T>
                      <T v="caption">{b.author?.name}</T>
                    </View>
                    {me && (
                      <IconButton
                        name="remove-circle-outline"
                        color={t.c.textMuted}
                        onPress={async () => {
                          await removeFromList(id, b.id);
                          q.refetch();
                          qc.invalidateQueries({ queryKey: ['lists'] });
                        }}
                      />
                    )}
                  </Row>
                </Card>
              </Animated.View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
