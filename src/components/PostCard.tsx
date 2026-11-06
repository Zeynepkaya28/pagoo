import React, { memo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, Card, Row, Stars, T, Tap } from '@/ui/primitives';
import { BookCover, coverColors } from './BookCover';
import { LikeHeart } from './effects';
import { useTheme } from '@/theme/ThemeProvider';
import { timeAgo } from '@/lib/format';
import { toggleLike } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { FeedPost } from '@/lib/types';

const STATUS_TEXT: Record<string, string> = {
  want: 'okuma listesine ekledi',
  reading: 'okumaya başladı',
  read: 'okumayı bitirdi',
  dnf: 'yarım bıraktı',
};

export const PostCard = memo(function PostCard({ post, compact }: { post: FeedPost; compact?: boolean }) {
  const t = useTheme();
  const qc = useQueryClient();
  const { session } = useAuth();
  const [liked, setLiked] = useState(post.liked);
  const [count, setCount] = useState(post.like_count);
  const [reveal, setReveal] = useState(false);
  const user = post.user;
  const book = post.book;

  const like = async () => {
    if (!session) return router.push('/login');
    const was = liked;
    setLiked(!was);
    setCount((c) => c + (was ? -1 : 1));
    try {
      await toggleLike(post.id, was);
      qc.invalidateQueries({ queryKey: ['post', post.id] });
    } catch {
      setLiked(was);
      setCount((c) => c + (was ? 1 : -1));
    }
  };

  const header = (
    <Row gap={10}>
      <Pressable onPress={() => user && router.push(`/user/${user.id}`)}>
        <Avatar uri={user?.avatar_url} name={user?.full_name ?? user?.username} size={38} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <T v="callout" numberOfLines={2}>
          <T v="callout" weight="bold" onPress={() => user && router.push(`/user/${user.id}`)}>
            {user?.full_name || user?.username}
          </T>
          {post.type === 'status' ? (
            <T v="callout" color={t.c.textSoft}>{` ${STATUS_TEXT[post.content] ?? ''}`}</T>
          ) : post.type === 'quote' ? (
            <T v="callout" color={t.c.textSoft}> bir alıntı paylaştı</T>
          ) : post.type === 'review' ? (
            <T v="callout" color={t.c.textSoft}> bir inceleme yazdı</T>
          ) : null}
        </T>
        <T v="caption">
          @{user?.username} · {timeAgo(post.created_at)}
        </T>
      </View>
    </Row>
  );

  const footer = (
    <Row gap={22} style={{ marginTop: 12 }}>
      <LikeHeart liked={liked} count={count} onToggle={like} />
      <Pressable onPress={() => router.push(`/post/${post.id}`)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="chatbubble-outline" size={20} color={t.c.textMuted} />
        <T v="caption" weight="medium">
          {post.comment_count > 0 ? post.comment_count : ''}
        </T>
      </Pressable>
      <View style={{ flex: 1 }} />
      {book && (
        <Pressable onPress={() => router.push(`/book/${book.id}`)} hitSlop={8}>
          <Ionicons name="book-outline" size={20} color={t.c.textMuted} />
        </Pressable>
      )}
    </Row>
  );

  if (post.type === 'quote' && book) {
    const [main, accent, paper] = coverColors(book);
    return (
      <Card style={{ marginHorizontal: compact ? 0 : 16, marginBottom: 12 }} onPress={() => router.push(`/post/${post.id}`)}>
        {header}
        <LinearGradient colors={[main, main + 'DD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ marginTop: 12, borderRadius: t.shape.radius - 2, padding: 20, overflow: 'hidden' }}>
          <T style={{ position: 'absolute', right: 10, top: -18, fontSize: 120, color: accent, opacity: 0.35, fontFamily: t.font.display }}>”</T>
          <T v="quote" color={paper}>
            {post.content}
          </T>
          <Row style={{ marginTop: 14 }} gap={10}>
            <View style={{ width: 18, height: 2, backgroundColor: accent }} />
            <T v="caption" color={paper} weight="bold" numberOfLines={1} style={{ flex: 1 }}>
              {book.title}
              {book.author?.name ? ` · ${book.author.name}` : ''}
              {post.page ? ` · s. ${post.page}` : ''}
            </T>
          </Row>
        </LinearGradient>
        {footer}
      </Card>
    );
  }

  return (
    <Card style={{ marginHorizontal: compact ? 0 : 16, marginBottom: 12 }} onPress={post.type === 'status' ? undefined : () => router.push(`/post/${post.id}`)}>
      {header}
      {book && (
        <Tap onPress={() => router.push(`/book/${book.id}`)} scaleTo={0.98} style={{ marginTop: 12 }}>
          <Row gap={14} center={false} style={{ backgroundColor: t.c.cardAlt + (t.style === 'android' ? '' : '99'), borderRadius: t.shape.radiusSm + 2, padding: 10 }}>
            <BookCover book={book} width={post.type === 'status' ? 54 : 46} />
            <View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
              <T v="headline" numberOfLines={2} style={{ fontFamily: t.font.display }}>
                {book.title}
              </T>
              <T v="caption" numberOfLines={1}>
                {book.author?.name}
              </T>
              {post.rating ? (
                <Row gap={6} style={{ marginTop: 4 }}>
                  <Stars value={post.rating} size={13} />
                  <T v="caption" weight="bold" color={t.c.text}>
                    {post.rating}/10
                  </T>
                </Row>
              ) : null}
              {post.type === 'status' && post.content === 'reading' && book.page_count ? (
                <T v="caption" style={{ marginTop: 4 }}>
                  {book.page_count} sayfa
                </T>
              ) : null}
            </View>
          </Row>
        </Tap>
      )}
      {post.type !== 'status' && !!post.content && (
        <View style={{ marginTop: 12 }}>
          <T v="body" numberOfLines={compact ? 6 : 12} color={t.c.textSoft}>
            {post.content}
          </T>
          {post.spoiler && !reveal && (
            <Pressable onPress={() => setReveal(true)} style={{ position: 'absolute', inset: -4, borderRadius: 10, overflow: 'hidden' } as any}>
              <BlurView intensity={40} tint={t.scheme === 'dark' ? 'dark' : 'light'} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.c.card + 'CC' }}>
                <Row gap={6}>
                  <Ionicons name="eye-off" size={16} color={t.c.textSoft} />
                  <T v="callout" weight="bold" color={t.c.textSoft}>
                    Sürpriz bozan içerik · göster
                  </T>
                </Row>
              </BlurView>
            </Pressable>
          )}
        </View>
      )}
      {post.type !== 'status' && footer}
      {post.type === 'status' && (
        <Row style={{ marginTop: 10 }}>
          <LikeHeart liked={liked} count={count} onToggle={like} />
        </Row>
      )}
    </Card>
  );
});
