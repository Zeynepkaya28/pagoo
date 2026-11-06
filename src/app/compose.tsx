import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { Button, Card, IconButton, Input, Row, Segmented, T, Tap } from '@/ui/primitives';
import { useToast } from '@/ui/Sheet';
import { BookCover } from '@/components/BookCover';
import { RatingPicker } from '@/components/ReadingSheets';
import { createPost, getBook, searchAll, shelf } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Book, PostType } from '@/lib/types';

export default function Compose() {
  const t = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ book?: string; type?: PostType }>();
  const [type, setType] = useState<PostType>((params.type as PostType) || 'review');
  const [book, setBook] = useState<Book | null>(null);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [page, setPage] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.book) getBook(params.book).then(setBook).catch(() => {});
  }, [params.book]);

  const mine = useQuery({ queryKey: ['shelf', session?.user.id, 'all'], queryFn: () => shelf(session!.user.id), enabled: !!session && !book });
  const found = useQuery({ queryKey: ['search', q], queryFn: () => searchAll(q), enabled: q.trim().length > 1 && !book });
  const candidates: Book[] = q.trim().length > 1 ? found.data?.books ?? [] : (mine.data ?? []).map((e) => e.book!).filter(Boolean);

  const max = type === 'quote' ? 1200 : 5000;
  const canPost = !!content.trim() && (type === 'note' || !!book) && (type !== 'review' || rating > 0 || content.trim().length > 20);

  const submit = async () => {
    if (!canPost) return;
    setBusy(true);
    try {
      await createPost({
        book_id: book?.id ?? null,
        type,
        content: content.trim(),
        rating: type === 'review' && rating ? rating : null,
        page: type === 'quote' && page ? parseInt(page, 10) : null,
        spoiler: type === 'review' ? spoiler : false,
      });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['book-posts'] });
      qc.invalidateQueries({ queryKey: ['user-posts'] });
      if (book) qc.invalidateQueries({ queryKey: ['book', book.id] });
      toast(type === 'quote' ? 'Alıntın paylaşıldı' : type === 'review' ? 'İncelemen yayında' : 'Notun paylaşıldı', { icon: 'sparkles' });
      router.back();
    } catch (e: any) {
      toast(e.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const ios = t.style === 'ios';
  return (
    <View style={{ flex: 1, backgroundColor: ios ? t.c.bgElevated : t.c.bg, paddingTop: ios && Platform.OS === 'ios' ? 8 : insets.top }}>
      <Row style={{ paddingHorizontal: ios ? 16 : 6, height: 52, justifyContent: 'space-between' }}>
        {ios ? (
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <T v="body" color={t.c.primary}>
              Vazgeç
            </T>
          </Pressable>
        ) : (
          <IconButton name="close" onPress={() => router.back()} filled={t.style === 'harmony'} />
        )}
        <T v="headline" weight="bold">
          Yeni paylaşım
        </T>
        {ios ? (
          <Pressable onPress={submit} disabled={!canPost || busy} hitSlop={8}>
            <T v="body" weight="bold" color={canPost ? t.c.primary : t.c.textMuted}>
              Paylaş
            </T>
          </Pressable>
        ) : (
          <Button title="Paylaş" small onPress={submit} disabled={!canPost} loading={busy} style={{ marginRight: 8 }} />
        )}
      </Row>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 16, maxWidth: 680, width: '100%', alignSelf: 'center' }}>
          <Segmented
            items={[
              { key: 'review', label: 'İnceleme' },
              { key: 'quote', label: 'Alıntı' },
              { key: 'note', label: 'Not' },
            ]}
            value={type}
            onChange={setType}
          />

          {book ? (
            <Animated.View entering={FadeIn} layout={LinearTransition}>
              <Card>
                <Row gap={14}>
                  <BookCover book={book} width={54} />
                  <View style={{ flex: 1 }}>
                    <T v="headline" numberOfLines={2} style={{ fontFamily: t.font.display }}>
                      {book.title}
                    </T>
                    <T v="caption">{book.author?.name}</T>
                  </View>
                  {!params.book && <IconButton name="swap-horizontal" onPress={() => setBook(null)} />}
                </Row>
              </Card>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown} style={{ gap: 10 }}>
              <Input icon="search" placeholder={type === 'note' ? 'Kitap seç (isteğe bağlı)' : 'Hangi kitap?'} value={q} onChangeText={setQ} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {candidates.slice(0, 20).map((b) => (
                  <Tap key={b.id} onPress={() => setBook(b)} style={{ width: 80 }}>
                    <BookCover book={b} width={80} />
                    <T v="caption" numberOfLines={2} color={t.c.text} style={{ marginTop: 4 }}>
                      {b.title}
                    </T>
                  </Tap>
                ))}
              </ScrollView>
              {!candidates.length && (
                <T v="caption" center>
                  {q ? 'Aramaya uygun kitap bulamadık.' : 'Kitaplığındaki kitaplar burada listelenir. Aramak için yazmaya başla.'}
                </T>
              )}
            </Animated.View>
          )}

          {type === 'review' && (
            <Animated.View entering={FadeInDown}>
              <Card>
                <T v="label" center style={{ marginBottom: 10 }}>
                  Puanın
                </T>
                <RatingPicker value={rating} onChange={setRating} />
              </Card>
            </Animated.View>
          )}

          <View>
            <TextInput
              multiline
              value={content}
              onChangeText={(s) => setContent(s.slice(0, max))}
              placeholder={type === 'quote' ? 'Kitaptan sevdiğin satırları yaz…' : type === 'review' ? 'Bu kitap sana ne hissettirdi?' : 'Aklından geçenler…'}
              placeholderTextColor={t.c.textMuted}
              style={[
                {
                  minHeight: 200,
                  color: t.c.text,
                  fontSize: type === 'quote' ? 19 : 17,
                  lineHeight: type === 'quote' ? 28 : 25,
                  fontFamily: type === 'quote' ? t.font.displayItalic : ios ? undefined : t.font.ui,
                  textAlignVertical: 'top',
                  padding: 16,
                  borderRadius: t.shape.radius,
                  backgroundColor: t.c.card,
                },
                Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
              ]}
            />
            <T v="caption" style={{ position: 'absolute', right: 12, bottom: 10 }}>
              {content.length}/{max}
            </T>
          </View>

          {type === 'quote' && <Input label="Sayfa numarası" icon="document-outline" keyboardType="number-pad" placeholder="ör. 42" value={page} onChangeText={(s) => setPage(s.replace(/\D/g, ''))} />}
          {type === 'review' && (
            <Card>
              <Row gap={12}>
                <Ionicons name="eye-off-outline" size={22} color={t.c.textSoft} />
                <View style={{ flex: 1 }}>
                  <T v="headline">Sürpriz bozan içerik</T>
                  <T v="caption">Okumayanlar için metni bulanıklaştırır.</T>
                </View>
                <Switch value={spoiler} onValueChange={setSpoiler} trackColor={{ true: t.c.primary, false: t.c.cardAlt }} thumbColor={t.style === 'android' && spoiler ? t.c.onPrimary : undefined} />
              </Row>
            </Card>
          )}
          {!ios && <Button title="Paylaş" gradient onPress={submit} disabled={!canPost} loading={busy} icon="send" />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
