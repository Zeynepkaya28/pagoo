import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/ui/Screen';
import { Avatar, Button, Card, Chip, Empty, IconButton, Loading, Row, Segmented, Stars, T, Tap } from '@/ui/primitives';
import { Sheet, useToast } from '@/ui/Sheet';
import { Book3D } from '@/components/Book3D';
import { BookCover, coverColors } from '@/components/BookCover';
import { PostCard } from '@/components/PostCard';
import { ProgressSheet, ShelfSheet } from '@/components/ReadingSheets';
import { useTheme } from '@/theme/ThemeProvider';
import { addToList, bookReaders, booksByAuthor, createList, getBook, lists, myShelfEntry, postsForBook } from '@/lib/api';
import { avgRating, compact } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { STATUS_ICON, STATUS_LABEL } from '@/lib/types';

function Stat({ value, label, icon }: { value: string; label: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Row gap={4}>
        {icon && <Ionicons name={icon} size={15} color={t.c.star} />}
        <T v="headline" weight="bold">
          {value}
        </T>
      </Row>
      <T v="caption">{label}</T>
    </View>
  );
}

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const y = useSharedValue(0);
  const [tab, setTab] = useState<'review' | 'quote'>('review');
  const [shelfOpen, setShelfOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newList, setNewList] = useState('');

  const book = useQuery({ queryKey: ['book', id], queryFn: () => getBook(id) });
  const entry = useQuery({ queryKey: ['entry', id], queryFn: () => myShelfEntry(id) });
  const posts = useQuery({ queryKey: ['book-posts', id, tab], queryFn: () => postsForBook(id, tab) });
  const readers = useQuery({ queryKey: ['readers', id], queryFn: () => bookReaders(id) });
  const more = useQuery({ queryKey: ['author-books', book.data?.author_id], queryFn: () => booksByAuthor(book.data!.author_id!), enabled: !!book.data?.author_id });
  const myLists = useQuery({ queryKey: ['lists', session?.user.id], queryFn: () => lists(session!.user.id), enabled: listOpen && !!session });

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(y.value, [-200, 0, 300], [-60, 0, 120], Extrapolation.CLAMP) }, { scale: interpolate(y.value, [-200, 0], [1.15, 1], Extrapolation.CLAMP) }],
    opacity: interpolate(y.value, [0, 260], [1, 0.2], Extrapolation.CLAMP),
  }));

  if (!book.data) return <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: 120 }}>{book.isLoading ? <Loading /> : <Empty icon="alert-circle-outline" title="Kitap bulunamadı" />}</View>;
  const b = book.data;
  const [main, accent] = coverColors(b);
  const r = avgRating(b.rating_sum, b.rating_count);
  const e = entry.data;
  const bookW = Math.min(170, width * 0.42);

  return (
    <Screen
      title={b.title}
      back
      headerOverlay
      scrollY={y}
      right={<IconButton name={t.style === 'android' ? 'share-social-outline' : 'ellipsis-horizontal'} color="#fff" style={{ backgroundColor: 'rgba(0,0,0,0.28)' }} onPress={() => setListOpen(true)} />}
    >
      {/* hero */}
      <View style={{ height: bookW * 1.5 + insets.top + 130, overflow: 'hidden' }}>
        <LinearGradient colors={[main, accent + 'AA', t.c.bg]} locations={[0, 0.6, 1]} style={{ position: 'absolute', inset: 0 } as any} />
        <View style={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: accent, opacity: 0.25 }} />
        <View style={{ position: 'absolute', top: 120, left: -90, width: 220, height: 220, borderRadius: 110, backgroundColor: '#fff', opacity: 0.08 }} />
        <Animated.View entering={FadeIn.duration(500)} style={[{ alignItems: 'center', paddingTop: insets.top + 64 }, heroStyle]}>
          <Book3D book={b} width={bookW} />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.springify().damping(16)} style={{ paddingHorizontal: 20, marginTop: -18, alignItems: 'center' }}>
        <T v="display" center style={{ fontSize: 28, lineHeight: 34 }}>
          {b.title}
        </T>
        {b.author && (
          <Pressable onPress={() => router.push(`/author/${b.author!.id}`)} hitSlop={6}>
            <T v="headline" color={t.c.primary} style={{ marginTop: 6 }}>
              {b.author.name}
            </T>
          </Pressable>
        )}
        {r ? (
          <Row gap={8} style={{ marginTop: 8 }}>
            <Stars value={r} size={16} />
            <T v="callout" color={t.c.textSoft}>
              {r.toFixed(1)} · {b.rating_count} puan
            </T>
          </Row>
        ) : null}
      </Animated.View>

      <Card style={{ marginHorizontal: 16, marginTop: 18, flexDirection: 'row', paddingVertical: 14 }}>
        <Stat value={r ? r.toFixed(1) : '–'} label="Puan" icon="star" />
        <Stat value={compact(b.readers_count)} label="Okur" />
        <Stat value={b.page_count ? String(b.page_count) : '–'} label="Sayfa" />
        <Stat value={b.published_year ? String(b.published_year) : '–'} label="Yıl" />
      </Card>

      <View style={{ paddingHorizontal: 16, marginTop: 14, gap: 10 }}>
        <Row gap={10}>
          <Button
          title={e ? STATUS_LABEL[e.status] : 'Kitaplığıma ekle'}
          icon={(e ? STATUS_ICON[e.status] : 'add') as any}
          gradient={!e}
          kind={e ? 'tonal' : 'filled'}
          onPress={() => setShelfOpen(true)}
            style={{ flex: 1 }}
          />
          {e?.status === 'reading' && <Button title={`s. ${e.current_page}`} kind="filled" icon="bookmark" onPress={() => setProgressOpen(true)} />}
        </Row>
        <Row gap={10}>
          <Button title="İncele" kind="outline" icon="create-outline" small style={{ flex: 1 }} onPress={() => router.push(`/compose?book=${b.id}&type=review`)} />
          <Button title="Alıntı" kind="outline" icon="chatbox-ellipses-outline" small style={{ flex: 1 }} onPress={() => router.push(`/compose?book=${b.id}&type=quote`)} />
          <Button title="Liste" kind="outline" icon="list-outline" small style={{ flex: 1 }} onPress={() => setListOpen(true)} />
        </Row>
      </View>

      {!!b.description && (
        <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
          <T v="label" style={{ marginBottom: 8 }}>
            Konusu
          </T>
          <T v="body" color={t.c.textSoft} numberOfLines={expanded ? undefined : 5}>
            {b.description.replace(/<[^>]+>/g, '')}
          </T>
          {b.description.length > 260 && (
            <Pressable onPress={() => setExpanded((x) => !x)} hitSlop={6}>
              <T v="callout" weight="bold" color={t.c.primary} style={{ marginTop: 6 }}>
                {expanded ? 'Daha az' : 'Devamını oku'}
              </T>
            </Pressable>
          )}
        </View>
      )}

      {b.categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginTop: 16 }}>
          {b.categories.map((c) => (
            <Chip key={c} label={c} />
          ))}
        </ScrollView>
      )}

      {(readers.data ?? []).length > 0 && (
        <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
          <T v="label" style={{ marginBottom: 10 }}>
            Bu kitabı okuyanlar
          </T>
          <Row gap={0}>
            {readers.data!.slice(0, 8).map((x, i) => (
              <Pressable key={x.user.id} onPress={() => router.push(`/user/${x.user.id}`)} style={{ marginLeft: i ? -10 : 0, borderWidth: 2, borderColor: t.c.bg, borderRadius: 30 }}>
                <Avatar uri={x.user.avatar_url} name={x.user.full_name ?? x.user.username} size={36} />
              </Pressable>
            ))}
            <T v="caption" style={{ marginLeft: 10 }}>
              {b.readers_count} okur
            </T>
          </Row>
        </View>
      )}

      <View style={{ paddingHorizontal: 16, marginTop: 26, marginBottom: 14 }}>
        <Segmented
          items={[
            { key: 'review', label: 'İncelemeler' },
            { key: 'quote', label: 'Alıntılar' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {posts.isLoading ? (
        <Loading />
      ) : (posts.data ?? []).length ? (
        posts.data!.map((p) => <PostCard key={p.id} post={p} />)
      ) : (
        <Empty
          icon={tab === 'review' ? 'create-outline' : 'chatbox-ellipses-outline'}
          title={tab === 'review' ? 'Henüz inceleme yok' : 'Henüz alıntı yok'}
          text="İlk paylaşan sen ol."
          action={<Button title={tab === 'review' ? 'İnceleme yaz' : 'Alıntı ekle'} kind="tonal" small onPress={() => router.push(`/compose?book=${b.id}&type=${tab}`)} />}
        />
      )}

      {(more.data ?? []).filter((x) => x.id !== b.id).length > 0 && (
        <>
          <T v="title" style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
            Yazarın diğer kitapları
          </T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
            {more.data!.filter((x) => x.id !== b.id).map((x) => (
              <Tap key={x.id} onPress={() => router.push(`/book/${x.id}`)} style={{ width: 100 }}>
                <BookCover book={x} width={100} />
                <T v="caption" weight="bold" color={t.c.text} numberOfLines={2} style={{ marginTop: 6 }}>
                  {x.title}
                </T>
              </Tap>
            ))}
          </ScrollView>
        </>
      )}

      <ShelfSheet visible={shelfOpen} onClose={() => setShelfOpen(false)} book={b} entry={e} onProgress={() => setProgressOpen(true)} />
      <ProgressSheet visible={progressOpen} onClose={() => setProgressOpen(false)} book={b} entry={e} />
      <Sheet visible={listOpen} onClose={() => setListOpen(false)} title="Listeye ekle">
        <ScrollView style={{ maxHeight: 360 }}>
          {(myLists.data ?? []).map((l) => (
            <Pressable
              key={l.id}
              onPress={async () => {
                await addToList(l.id, b.id).catch((err) => toast(err.message, { tone: 'error' }));
                qc.invalidateQueries({ queryKey: ['lists'] });
                toast(`“${l.title}” listesine eklendi`, { icon: 'list' });
                setListOpen(false);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="list" size={20} color={t.c.onPrimarySoft} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="headline">{l.title}</T>
                <T v="caption">{l.count} kitap</T>
              </View>
              <Ionicons name="add-circle-outline" size={22} color={t.c.primary} />
            </Pressable>
          ))}
          {myLists.isLoading && <Loading pad={16} />}
        </ScrollView>
        <Row gap={8} style={{ marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <InputLite value={newList} onChange={setNewList} placeholder="Yeni liste adı" />
          </View>
          <Button
            title="Oluştur"
            small
            disabled={!newList.trim()}
            onPress={async () => {
              const l = await createList(newList.trim(), '');
              await addToList(l.id, b.id);
              setNewList('');
              qc.invalidateQueries({ queryKey: ['lists'] });
              toast('Liste oluşturuldu ve kitap eklendi', { icon: 'list' });
              setListOpen(false);
            }}
          />
        </Row>
      </Sheet>
    </Screen>
  );
}

function InputLite({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder: string }) {
  const t = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={t.c.textMuted}
      style={[{ height: 40, borderRadius: t.style === 'android' ? 8 : 10, backgroundColor: t.c.cardAlt, paddingHorizontal: 12, color: t.c.text, fontSize: 15 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
    />
  );
}
