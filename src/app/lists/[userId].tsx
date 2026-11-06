import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/ui/Screen';
import { Button, Card, Empty, IconButton, Input, Loading, Row, T } from '@/ui/primitives';
import { Sheet, useToast } from '@/ui/Sheet';
import { BookCover } from '@/components/BookCover';
import { useTheme } from '@/theme/ThemeProvider';
import { createList, lists } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function Lists() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const t = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { session } = useAuth();
  const me = session?.user.id === userId;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [pub, setPub] = useState(true);
  const q = useQuery({ queryKey: ['lists', userId], queryFn: () => lists(userId) });

  const create = async () => {
    if (!title.trim()) return;
    try {
      const l = await createList(title.trim(), desc.trim(), pub);
      qc.invalidateQueries({ queryKey: ['lists'] });
      setOpen(false);
      setTitle('');
      setDesc('');
      router.push(`/list/${l.id}`);
    } catch (e: any) {
      toast(e.message, { tone: 'error' });
    }
  };

  return (
    <Screen title="Listeler" back right={me ? <IconButton name="add" onPress={() => setOpen(true)} /> : null}>
      {q.isLoading ? (
        <Loading />
      ) : !(q.data ?? []).length ? (
        <Empty icon="albums-outline" title="Henüz liste yok" text="“Yaz tatili okumaları” gibi temalı listeler oluştur." action={me ? <Button title="Liste oluştur" kind="tonal" icon="add" onPress={() => setOpen(true)} /> : undefined} />
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {q.data!.map((l, i) => (
            <Animated.View key={l.id} entering={FadeInDown.delay(i * 40).springify().damping(16)}>
              <Card onPress={() => router.push(`/list/${l.id}`)} padded={false}>
                <LinearGradient colors={[t.c.gradient[0] + '33', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
                  <Row gap={14}>
                    <View style={{ flexDirection: 'row', width: 92, height: 80, alignItems: 'center' }}>
                      {(l.items ?? []).slice(0, 3).map((it, k) => (
                        <View key={it.book.id} style={{ marginLeft: k ? -30 : 0, zIndex: 3 - k, transform: [{ rotate: `${(k - 1) * 7}deg` }, { translateY: k === 1 ? -4 : 0 }] }}>
                          <BookCover book={it.book} width={48} />
                        </View>
                      ))}
                      {!l.items?.length && <Ionicons name="albums-outline" size={36} color={t.c.primary} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Row gap={6}>
                        <T v="headline" weight="bold">
                          {l.title}
                        </T>
                        {!l.is_public && <Ionicons name="lock-closed" size={13} color={t.c.textMuted} />}
                      </Row>
                      {!!l.description && (
                        <T v="caption" numberOfLines={2}>
                          {l.description}
                        </T>
                      )}
                      <T v="caption" weight="bold" color={t.c.primary} style={{ marginTop: 4 }}>
                        {l.count} kitap
                      </T>
                    </View>
                  </Row>
                </LinearGradient>
              </Card>
            </Animated.View>
          ))}
        </View>
      )}
      <Sheet visible={open} onClose={() => setOpen(false)} title="Yeni liste">
        <View style={{ gap: 14 }}>
          <Input label="Liste adı" placeholder="ör. Yaz okumaları" value={title} onChangeText={setTitle} />
          <Input label="Açıklama" placeholder="İsteğe bağlı" value={desc} onChangeText={setDesc} />
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="headline">Herkese açık</T>
            <Switch value={pub} onValueChange={setPub} trackColor={{ true: t.c.primary, false: t.c.cardAlt }} />
          </Row>
          <Button title="Oluştur" gradient onPress={create} disabled={!title.trim()} />
        </View>
      </Sheet>
    </Screen>
  );
}
