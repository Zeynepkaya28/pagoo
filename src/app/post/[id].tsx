import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/ui/Screen';
import { Avatar, Empty, IconButton, Loading, Row, T } from '@/ui/primitives';
import { useToast } from '@/ui/Sheet';
import { PostCard } from '@/components/PostCard';
import { useTheme } from '@/theme/ThemeProvider';
import { addComment, comments, deleteComment, deletePost, getPost } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/format';

function confirm(msg: string, ok: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(msg)) ok();
  } else Alert.alert(msg, undefined, [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: ok }]);
}

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const [text, setText] = useState('');
  const post = useQuery({ queryKey: ['post', id], queryFn: () => getPost(id) });
  const cm = useQuery({ queryKey: ['comments', id], queryFn: () => comments(id) });

  useEffect(() => {
    const ch = supabase
      .channel(`comments-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${id}` }, () => cm.refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id]);

  const send = async () => {
    const v = text.trim();
    if (!v) return;
    setText('');
    try {
      await addComment(id, v);
      cm.refetch();
      qc.invalidateQueries({ queryKey: ['feed'] });
    } catch (e: any) {
      toast(e.message, { tone: 'error' });
      setText(v);
    }
  };

  const mine = post.data?.user_id === session?.user.id;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Screen
        title="Paylaşım"
        back
        large={false}
        right={
          mine ? (
            <IconButton
              name="trash-outline"
              color={t.c.danger}
              onPress={() =>
                confirm('Bu paylaşım silinsin mi?', async () => {
                  await deletePost(id);
                  qc.invalidateQueries({ queryKey: ['feed'] });
                  qc.invalidateQueries({ queryKey: ['user-posts'] });
                  toast('Paylaşım silindi', { icon: 'trash' });
                  router.back();
                })
              }
            />
          ) : null
        }
        contentStyle={{ paddingBottom: 120 }}
      >
        {post.isLoading ? <Loading /> : post.data ? <PostCard post={post.data} /> : <Empty icon="alert-circle-outline" title="Paylaşım bulunamadı" />}
        <T v="label" style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 6 }}>
          Yorumlar {cm.data?.length ? `· ${cm.data.length}` : ''}
        </T>
        {(cm.data ?? []).map((c, i) => (
          <Animated.View key={c.id} entering={FadeInDown.delay(i * 25)}>
            <Row gap={12} center={false} style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
              <Pressable onPress={() => router.push(`/user/${c.user_id}`)}>
                <Avatar uri={c.user?.avatar_url} name={c.user?.full_name ?? c.user?.username} size={34} />
              </Pressable>
              <View style={{ flex: 1, backgroundColor: t.c.card, borderRadius: t.shape.radius, borderTopLeftRadius: 4, padding: 12 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="callout" weight="bold">
                    {c.user?.full_name || c.user?.username}
                  </T>
                  <T v="caption">{timeAgo(c.created_at)}</T>
                </Row>
                <T v="callout" color={t.c.textSoft} style={{ marginTop: 3 }}>
                  {c.content}
                </T>
                {c.user_id === session?.user.id && (
                  <Pressable onPress={() => confirm('Yorum silinsin mi?', async () => { await deleteComment(c.id); cm.refetch(); })} style={{ alignSelf: 'flex-end', marginTop: 4 }} hitSlop={6}>
                    <T v="caption" color={t.c.danger}>
                      Sil
                    </T>
                  </Pressable>
                )}
              </View>
            </Row>
          </Animated.View>
        ))}
        {cm.data && !cm.data.length && (
          <T v="callout" color={t.c.textMuted} center style={{ marginTop: 16 }}>
            İlk yorumu sen yaz.
          </T>
        )}
      </Screen>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          paddingHorizontal: 12,
          backgroundColor: t.c.bgElevated,
          borderTopWidth: t.style === 'ios' ? 0.5 : 0,
          borderColor: t.c.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Avatar uri={profile?.avatar_url} name={profile?.full_name ?? profile?.username} size={32} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Yorum yaz…"
          placeholderTextColor={t.c.textMuted}
          onSubmitEditing={send}
          style={[{ flex: 1, height: 40, borderRadius: 20, paddingHorizontal: 14, backgroundColor: t.c.cardAlt, color: t.c.text, fontSize: 15 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
        />
        <Pressable onPress={send} disabled={!text.trim()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: text.trim() ? t.c.primary : t.c.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-up" size={20} color={text.trim() ? t.c.onPrimary : t.c.textMuted} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
