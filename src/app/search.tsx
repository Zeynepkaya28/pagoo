import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useTheme } from '@/theme/ThemeProvider';
import { Avatar, Button, Divider, Empty, IconButton, Row, Segmented, T, Tap } from '@/ui/primitives';
import { BookCover } from '@/components/BookCover';
import { importBook, searchAll, searchExternal, type ExternalBook } from '@/lib/api';
import { useToast } from '@/ui/Sheet';

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const id = setTimeout(() => setD(v), ms);
    return () => clearTimeout(id);
  }, [v, ms]);
  return d;
}

type Tab = 'books' | 'authors' | 'users' | 'catalog';

export default function Search() {
  const t = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ external?: string }>();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>(params.external ? 'catalog' : 'books');
  const [importing, setImporting] = useState<string | null>(null);
  const dq = useDebounced(q, 320);

  const local = useQuery({ queryKey: ['search', dq], queryFn: () => searchAll(dq), enabled: dq.trim().length > 1 && tab !== 'catalog' });
  const ext = useQuery({ queryKey: ['search-ext', dq], queryFn: () => searchExternal(dq), enabled: dq.trim().length > 1 && tab === 'catalog' });

  const add = async (b: ExternalBook) => {
    setImporting(b.googleId);
    try {
      const id = await importBook(b);
      router.replace(`/book/${id}`);
    } catch (e: any) {
      toast(e.message, { tone: 'error' });
    } finally {
      setImporting(null);
    }
  };

  const android = t.style === 'android';
  const loading = tab === 'catalog' ? ext.isFetching : local.isFetching;

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top + 6 }}>
      <Row style={{ paddingHorizontal: android ? 4 : 12, gap: 6 }}>
        {android && <IconButton name="arrow-back" onPress={() => router.back()} />}
        <View
          style={{
            flex: 1,
            height: android ? 56 : 40,
            borderRadius: android ? 28 : t.style === 'harmony' ? 20 : 10,
            backgroundColor: android ? t.c.cardAlt : t.style === 'harmony' ? t.c.card : t.scheme === 'dark' ? '#1C1C1E' : 'rgba(118,118,128,0.12)',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Ionicons name="search" size={18} color={t.c.textMuted} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder={tab === 'catalog' ? 'Başlık, yazar ya da ISBN' : 'Kitap, yazar ya da okur'}
            placeholderTextColor={t.c.textMuted}
            returnKeyType="search"
            style={[{ flex: 1, color: t.c.text, fontSize: 16, height: '100%' }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
          />
          {loading ? <ActivityIndicator size="small" color={t.c.primary} /> : q ? (
            <Pressable onPress={() => setQ('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={t.c.textMuted} />
            </Pressable>
          ) : null}
        </View>
        {!android && (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ paddingHorizontal: 6 }}>
            <T v="body" color={t.c.primary} weight="medium">
              Vazgeç
            </T>
          </Pressable>
        )}
      </Row>
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <Segmented
          items={[
            { key: 'books', label: 'Kitap' },
            { key: 'authors', label: 'Yazar' },
            { key: 'users', label: 'Okur' },
            { key: 'catalog', label: 'Katalog' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 10 }}>
        {dq.trim().length < 2 ? (
          <Empty
            icon={tab === 'catalog' ? 'globe-outline' : 'search-outline'}
            title={tab === 'catalog' ? 'Geniş katalogda ara' : 'Ne okumak istersin?'}
            text={tab === 'catalog' ? 'Pagoo kütüphanesinde olmayan bir kitabı bulup herkes için ekleyebilirsin.' : 'En az iki harf yaz, sonuçlar anında gelsin.'}
          />
        ) : tab === 'catalog' ? (
          (ext.data ?? []).length === 0 && !ext.isFetching ? (
            <Empty icon="sad-outline" title="Sonuç bulunamadı" text="Farklı bir yazım ya da ISBN dene." />
          ) : (
            (ext.data ?? []).map((b, i) => (
              <Animated.View key={b.googleId} entering={FadeInDown.delay(i * 30)}>
                <Row gap={14} style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                  {b.cover ? (
                    <Image source={{ uri: b.cover }} style={{ width: 52, height: 78, borderRadius: 4, backgroundColor: t.c.cardAlt }} contentFit="cover" />
                  ) : (
                    <BookCover book={{ id: b.googleId, title: b.title, author: b.author ? { name: b.author } : null }} width={52} />
                  )}
                  <View style={{ flex: 1 }}>
                    <T v="headline" numberOfLines={2}>
                      {b.title}
                    </T>
                    <T v="caption" numberOfLines={1}>
                      {[b.author, b.year, b.pageCount ? `${b.pageCount} s.` : null].filter(Boolean).join(' · ')}
                    </T>
                  </View>
                  <Button title="Ekle" small kind="tonal" icon="add" loading={importing === b.googleId} onPress={() => add(b)} />
                </Row>
                <Divider inset={86} />
              </Animated.View>
            ))
          )
        ) : tab === 'books' ? (
          (local.data?.books ?? []).length === 0 && !local.isFetching ? (
            <Empty icon="book-outline" title="Kitaplıkta yok" text="Katalog sekmesinden bulup ekleyebilirsin." action={<Button title="Katalogda ara" kind="tonal" onPress={() => setTab('catalog')} />} />
          ) : (
            (local.data?.books ?? []).map((b, i) => (
              <Animated.View key={b.id} entering={FadeInDown.delay(i * 25)}>
                <Tap onPress={() => router.push(`/book/${b.id}`)} scaleTo={0.98}>
                  <Row gap={14} style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                    <BookCover book={b} width={48} />
                    <View style={{ flex: 1 }}>
                      <T v="headline" numberOfLines={2}>
                        {b.title}
                      </T>
                      <T v="caption">{b.author?.name}</T>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={t.c.textMuted} />
                  </Row>
                </Tap>
                <Divider inset={82} />
              </Animated.View>
            ))
          )
        ) : tab === 'authors' ? (
          (local.data?.authors ?? []).map((a) => (
            <Tap key={a.id} onPress={() => router.push(`/author/${a.id}`)} scaleTo={0.98}>
              <Row gap={14} style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                <Avatar name={a.name} size={46} />
                <View style={{ flex: 1 }}>
                  <T v="headline">{a.name}</T>
                  <T v="caption">{[a.country, a.born ? `${a.born}${a.died ? `–${a.died}` : ''}` : null].filter(Boolean).join(' · ')}</T>
                </View>
              </Row>
            </Tap>
          ))
        ) : (
          (local.data?.users ?? []).map((u) => (
            <Tap key={u.id} onPress={() => router.push(`/user/${u.id}`)} scaleTo={0.98}>
              <Row gap={14} style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                <Avatar uri={u.avatar_url} name={u.full_name ?? u.username} size={46} />
                <View style={{ flex: 1 }}>
                  <T v="headline">{u.full_name || u.username}</T>
                  <T v="caption">@{u.username}</T>
                </View>
              </Row>
            </Tap>
          ))
        )}
      </ScrollView>
    </View>
  );
}
