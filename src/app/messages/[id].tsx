import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar, IconButton, Row, T } from '@/ui/primitives';
import { useTheme } from '@/theme/ThemeProvider';
import { getProfile, sendMessage, thread } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Message } from '@/lib/types';

export default function Thread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const me = session?.user.id;
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<Message[]>([]);
  const list = useRef<FlatList<Message>>(null);
  const other = useQuery({ queryKey: ['profile', id], queryFn: () => getProfile(id) });

  useEffect(() => {
    thread(id).then(setMsgs);
    const ch = supabase
      .channel(`dm-${me}-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${me}` }, (p) => {
        const m = p.new as Message;
        if (m.sender_id === id) {
          setMsgs((s) => [...s, m]);
          supabase.from('messages').update({ read: true }).eq('id', m.id).then(() => {});
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    };
  }, [id, me]);

  useEffect(() => {
    setTimeout(() => list.current?.scrollToEnd({ animated: true }), 60);
  }, [msgs.length]);

  const send = async () => {
    const v = text.trim();
    if (!v) return;
    setText('');
    const temp: Message = { id: -Date.now(), sender_id: me!, recipient_id: id, content: v, read: false, created_at: new Date().toISOString() };
    setMsgs((s) => [...s, temp]);
    try {
      const real = await sendMessage(id, v);
      setMsgs((s) => s.map((m) => (m.id === temp.id ? real : m)));
    } catch {
      setMsgs((s) => s.filter((m) => m.id !== temp.id));
      setText(v);
    }
  };

  const p = other.data;
  const ios = t.style === 'ios';
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Row gap={8} style={{ paddingTop: insets.top + 4, paddingBottom: 8, paddingHorizontal: 8, backgroundColor: t.c.bgElevated, borderBottomWidth: ios ? 0.5 : 0, borderColor: t.c.border }}>
        <IconButton name={t.style === 'android' ? 'arrow-back' : 'chevron-back'} onPress={() => router.back()} />
        <Pressable onPress={() => router.push(`/user/${id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <Avatar uri={p?.avatar_url} name={p?.full_name ?? p?.username} size={36} />
          <View>
            <T v="headline" weight="bold">
              {p?.full_name || p?.username || ' '}
            </T>
            <T v="caption">@{p?.username}</T>
          </View>
        </Pressable>
      </Row>
      <FlatList
        ref={list}
        data={msgs}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 14, gap: 6, flexGrow: 1, justifyContent: msgs.length ? 'flex-end' : 'center' }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Avatar uri={p?.avatar_url} name={p?.full_name ?? p?.username} size={72} ring />
            <T v="callout" color={t.c.textMuted} center>
              {p?.full_name || p?.username} ile sohbete başla.{'\n'}Belki ona son okuduğun kitabı önerirsin?
            </T>
          </View>
        }
        renderItem={({ item: m, index }) => {
          const mine = m.sender_id === me;
          const prevSame = msgs[index - 1]?.sender_id === m.sender_id;
          const r = t.style === 'android' ? 20 : 18;
          const bubble = {
            maxWidth: '78%' as const,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: r,
            borderBottomRightRadius: mine ? 6 : r,
            borderBottomLeftRadius: mine ? r : 6,
            marginTop: prevSame ? 0 : 6,
          };
          return (
            <Animated.View entering={index > msgs.length - 3 ? FadeInUp.springify().damping(18) : undefined} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
              {mine ? (
                <LinearGradient colors={ios ? [t.c.primary, t.c.gradient[1]] : [t.c.primary, t.c.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={bubble}>
                  <T v="body" color={t.c.onPrimary}>
                    {m.content}
                  </T>
                </LinearGradient>
              ) : (
                <View style={[bubble, { backgroundColor: t.c.card }]}>
                  <T v="body">{m.content}</T>
                </View>
              )}
            </Animated.View>
          );
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 8, paddingBottom: insets.bottom + 8, backgroundColor: t.c.bgElevated }}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          placeholder="Mesaj yaz…"
          placeholderTextColor={t.c.textMuted}
          style={[{ flex: 1, minHeight: 42, borderRadius: 21, paddingHorizontal: 16, backgroundColor: t.c.cardAlt, color: t.c.text, fontSize: 16 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
        />
        <Pressable onPress={send} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: text.trim() ? t.c.primary : t.c.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="send" size={18} color={text.trim() ? t.c.onPrimary : t.c.textMuted} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
