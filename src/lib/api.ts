import { supabase } from './supabase';
import type {
  Author, Book, Comment, FeedPost, Message, Notification, PostType, Profile, ReadingList, ShelfEntry, ShelfStatus, UserStats,
} from './types';

const BOOK_SELECT = '*, author:authors(id,name)';
const USER_SELECT = 'id,username,full_name,avatar_url';
const FEED_SELECT = `*, user:profiles!posts_user_id_fkey(${USER_SELECT}), book:books(id,title,cover_url,page_count, author:authors(id,name))`;

function must<T>(res: { data: T | null; error: any }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/* ---------------- books ---------------- */
export async function getBook(id: string): Promise<Book> {
  return must(await supabase.from('books').select(BOOK_SELECT).eq('id', id).single());
}

export async function listBooks(opts: { order?: 'popular' | 'new' | 'rating'; category?: string; limit?: number; offset?: number } = {}): Promise<Book[]> {
  let q = supabase.from('books').select(BOOK_SELECT);
  if (opts.category) q = q.contains('categories', [opts.category]);
  if (opts.order === 'new') q = q.order('created_at', { ascending: false });
  else if (opts.order === 'rating') q = q.order('rating_count', { ascending: false }).order('rating_sum', { ascending: false });
  else q = q.order('readers_count', { ascending: false }).order('published_year', { ascending: false });
  const from = opts.offset ?? 0;
  q = q.range(from, from + (opts.limit ?? 20) - 1);
  return must(await q);
}

export async function booksByAuthor(authorId: string): Promise<Book[]> {
  return must(await supabase.from('books').select(BOOK_SELECT).eq('author_id', authorId).order('published_year'));
}

export async function getAuthor(id: string): Promise<Author> {
  return must(await supabase.from('authors').select('*').eq('id', id).single());
}

export async function searchAll(term: string) {
  const t = term.trim().replace(/[%_,()]/g, ' ');
  if (!t) return { books: [] as Book[], authors: [] as Author[], users: [] as Profile[] };
  const like = `%${t}%`;
  const [books, authors, users] = await Promise.all([
    supabase.from('books').select(BOOK_SELECT).ilike('title', like).limit(20),
    supabase.from('authors').select('*').ilike('name', like).limit(8),
    supabase.from('profiles').select('*').or(`username.ilike.${like},full_name.ilike.${like}`).limit(8),
  ]);
  // books whose author matches as well
  let byAuthor: Book[] = [];
  const authorIds = (authors.data ?? []).map((a) => a.id);
  if (authorIds.length) {
    byAuthor = must(await supabase.from('books').select(BOOK_SELECT).in('author_id', authorIds).limit(20));
  }
  const seen = new Set<string>();
  const merged = [...(books.data ?? []), ...byAuthor].filter((b) => (seen.has(b.id) ? false : (seen.add(b.id), true)));
  return { books: merged as Book[], authors: (authors.data ?? []) as Author[], users: (users.data ?? []) as Profile[] };
}

export async function categories(): Promise<string[]> {
  const rows = must(await supabase.from('books').select('categories').limit(500)) as { categories: string[] }[];
  const count = new Map<string, number>();
  rows.forEach((r) => r.categories.forEach((c) => count.set(c, (count.get(c) ?? 0) + 1)));
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
}

/* Google Books catalogue — lets readers add any book that is not in the library yet */
export interface ExternalBook {
  googleId: string;
  title: string;
  author: string | null;
  description: string | null;
  pageCount: number | null;
  year: number | null;
  publisher: string | null;
  isbn: string | null;
  cover: string | null;
  categories: string[];
  language: string | null;
}

export async function searchExternal(term: string): Promise<ExternalBook[]> {
  if (term.trim().length < 2) return [];
  const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(term)}&maxResults=20&printType=books`);
  if (!r.ok) return [];
  const j = await r.json();
  return (j.items ?? []).map((it: any) => {
    const v = it.volumeInfo ?? {};
    const isbn = (v.industryIdentifiers ?? []).find((x: any) => x.type === 'ISBN_13')?.identifier ?? null;
    const cover = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? null;
    return {
      googleId: it.id,
      title: v.title ?? 'Adsız',
      author: (v.authors ?? [])[0] ?? null,
      description: v.description ?? null,
      pageCount: v.pageCount ?? null,
      year: v.publishedDate ? parseInt(String(v.publishedDate).slice(0, 4), 10) || null : null,
      publisher: v.publisher ?? null,
      isbn,
      cover: cover ? cover.replace('http://', 'https://').replace('&edge=curl', '') : null,
      categories: v.categories ?? [],
      language: v.language ?? null,
    } as ExternalBook;
  });
}

export async function importBook(b: ExternalBook): Promise<string> {
  const { data, error } = await supabase.rpc('import_book', {
    p_google_id: b.googleId, p_title: b.title, p_author: b.author, p_description: b.description, p_page_count: b.pageCount,
    p_year: b.year, p_publisher: b.publisher, p_isbn: b.isbn, p_cover: b.cover, p_categories: b.categories, p_language: b.language,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

/* ---------------- shelf ---------------- */
export async function myShelfEntry(bookId: string): Promise<ShelfEntry | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  return must(await supabase.from('shelf_entries').select('*').eq('user_id', uid).eq('book_id', bookId).maybeSingle());
}

export async function shelf(userId: string, status?: ShelfStatus): Promise<ShelfEntry[]> {
  let q = supabase.from('shelf_entries').select(`*, book:books(${BOOK_SELECT})`).eq('user_id', userId).order('updated_at', { ascending: false });
  if (status) q = q.eq('status', status);
  return must(await q);
}

export async function setShelf(bookId: string, patch: Partial<Pick<ShelfEntry, 'status' | 'current_page' | 'rating'>>) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Giriş yapmalısın');
  const existing = await myShelfEntry(bookId);
  if (existing) {
    must(await supabase.from('shelf_entries').update(patch).eq('user_id', uid).eq('book_id', bookId).select().single());
  } else {
    must(await supabase.from('shelf_entries').insert({ user_id: uid, book_id: bookId, status: patch.status ?? 'want', ...patch }).select().single());
  }
}

export async function removeFromShelf(bookId: string) {
  const uid = await currentUserId();
  if (!uid) return;
  must(await supabase.from('shelf_entries').delete().eq('user_id', uid).eq('book_id', bookId));
}

export async function bookReaders(bookId: string, limit = 12) {
  return must(
    await supabase.from('shelf_entries').select(`status, user:profiles(${USER_SELECT})`).eq('book_id', bookId).in('status', ['reading', 'read']).limit(limit),
  ) as unknown as { status: ShelfStatus; user: Profile }[];
}

/* ---------------- posts / feed ---------------- */
export async function feed(opts: { scope: 'following' | 'everyone'; limit?: number; before?: string; types?: PostType[] }): Promise<FeedPost[]> {
  let q = supabase.from('feed').select(FEED_SELECT).order('created_at', { ascending: false }).limit(opts.limit ?? 20);
  if (opts.before) q = q.lt('created_at', opts.before);
  if (opts.types) q = q.in('type', opts.types);
  if (opts.scope === 'following') {
    const uid = await currentUserId();
    if (!uid) return [];
    const f = must(await supabase.from('follows').select('following_id').eq('follower_id', uid)) as { following_id: string }[];
    q = q.in('user_id', [uid, ...f.map((x) => x.following_id)]);
  }
  return must(await q);
}

export async function postsForBook(bookId: string, type?: PostType): Promise<FeedPost[]> {
  let q = supabase.from('feed').select(FEED_SELECT).eq('book_id', bookId).order('created_at', { ascending: false }).limit(50);
  q = type ? q.eq('type', type) : q.in('type', ['review', 'quote']);
  return must(await q);
}

export async function postsForUser(userId: string, type?: PostType): Promise<FeedPost[]> {
  let q = supabase.from('feed').select(FEED_SELECT).eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
  if (type) q = q.eq('type', type);
  return must(await q);
}

export async function getPost(id: string): Promise<FeedPost> {
  return must(await supabase.from('feed').select(FEED_SELECT).eq('id', id).single());
}

export async function createPost(p: { book_id: string | null; type: PostType; content: string; page?: number | null; rating?: number | null; spoiler?: boolean }) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Giriş yapmalısın');
  const row = must(await supabase.from('posts').insert({ ...p, user_id: uid }).select().single());
  if (p.type === 'review' && p.rating && p.book_id) {
    const entry = await myShelfEntry(p.book_id);
    await setShelf(p.book_id, { rating: p.rating, status: entry?.status ?? 'read' });
  }
  return row;
}

export async function deletePost(id: string) {
  must(await supabase.from('posts').delete().eq('id', id));
}

export async function toggleLike(postId: string, liked: boolean) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Giriş yapmalısın');
  if (liked) must(await supabase.from('likes').delete().eq('user_id', uid).eq('post_id', postId));
  else must(await supabase.from('likes').insert({ user_id: uid, post_id: postId }));
}

export async function comments(postId: string): Promise<Comment[]> {
  return must(await supabase.from('comments').select(`*, user:profiles(${USER_SELECT})`).eq('post_id', postId).order('created_at'));
}

export async function addComment(postId: string, content: string) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Giriş yapmalısın');
  must(await supabase.from('comments').insert({ post_id: postId, user_id: uid, content }));
}

export async function deleteComment(id: string) {
  must(await supabase.from('comments').delete().eq('id', id));
}

/* ---------------- profiles / social ---------------- */
export async function getProfile(id: string): Promise<Profile> {
  return must(await supabase.from('profiles').select('*').eq('id', id).single());
}

export async function updateProfile(patch: Partial<Pick<Profile, 'username' | 'full_name' | 'bio' | 'avatar_url' | 'reading_goal'>>) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Giriş yapmalısın');
  must(await supabase.from('profiles').update(patch).eq('id', uid));
}

export async function uploadAvatar(uri: string, mime = 'image/jpeg'): Promise<string> {
  const uid = await currentUserId();
  if (!uid) throw new Error('Giriş yapmalısın');
  const blob = await (await fetch(uri)).arrayBuffer();
  const ext = mime.split('/')[1] ?? 'jpg';
  const path = `${uid}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: mime, upsert: true });
  if (error) throw new Error(error.message);
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export async function isFollowing(target: string): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  const r = must(await supabase.from('follows').select('follower_id').eq('follower_id', uid).eq('following_id', target).maybeSingle());
  return !!r;
}

export async function setFollow(target: string, follow: boolean) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Giriş yapmalısın');
  if (follow) must(await supabase.from('follows').insert({ follower_id: uid, following_id: target }));
  else must(await supabase.from('follows').delete().eq('follower_id', uid).eq('following_id', target));
}

export async function followList(userId: string, kind: 'followers' | 'following'): Promise<Profile[]> {
  if (kind === 'followers') {
    const r = must(await supabase.from('follows').select(`p:profiles!follows_follower_id_fkey(*)`).eq('following_id', userId)) as any[];
    return r.map((x) => x.p);
  }
  const r = must(await supabase.from('follows').select(`p:profiles!follows_following_id_fkey(*)`).eq('follower_id', userId)) as any[];
  return r.map((x) => x.p);
}

export async function suggestedReaders(limit = 10): Promise<Profile[]> {
  const uid = await currentUserId();
  let q = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(limit + 1);
  const rows = must(await q) as Profile[];
  let following = new Set<string>();
  if (uid) {
    const f = must(await supabase.from('follows').select('following_id').eq('follower_id', uid)) as { following_id: string }[];
    following = new Set(f.map((x) => x.following_id));
  }
  return rows.filter((p) => p.id !== uid && !following.has(p.id)).slice(0, limit);
}

export async function stats(userId: string, year?: number): Promise<UserStats> {
  const { data, error } = await supabase.rpc('user_stats', { p_user: userId, p_year: year ?? new Date().getFullYear() });
  if (error) throw new Error(error.message);
  return data as UserStats;
}

/* ---------------- notifications ---------------- */
export async function notifications(): Promise<Notification[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  return must(
    await supabase
      .from('notifications')
      .select(`*, actor:profiles!notifications_actor_id_fkey(${USER_SELECT}), post:posts(id,content,type)`)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(60),
  );
}

export async function markNotificationsRead() {
  const uid = await currentUserId();
  if (!uid) return;
  await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false);
}

export async function unreadCount(): Promise<number> {
  const uid = await currentUserId();
  if (!uid) return 0;
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('read', false);
  return count ?? 0;
}

/* ---------------- lists ---------------- */
export async function lists(userId: string): Promise<ReadingList[]> {
  const rows = must(
    await supabase.from('lists').select(`*, items:list_items(book:books(${BOOK_SELECT}))`).eq('user_id', userId).order('created_at', { ascending: false }),
  ) as ReadingList[];
  return rows.map((l) => ({ ...l, count: l.items?.length ?? 0 }));
}

export async function getList(id: string): Promise<ReadingList> {
  return must(await supabase.from('lists').select(`*, items:list_items(book:books(${BOOK_SELECT}))`).eq('id', id).single());
}

export async function createList(title: string, description: string, isPublic = true) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Giriş yapmalısın');
  return must(await supabase.from('lists').insert({ user_id: uid, title, description, is_public: isPublic }).select().single()) as ReadingList;
}

export async function deleteList(id: string) {
  must(await supabase.from('lists').delete().eq('id', id));
}

export async function addToList(listId: string, bookId: string) {
  const { error } = await supabase.from('list_items').insert({ list_id: listId, book_id: bookId });
  if (error && !error.message.includes('duplicate')) throw new Error(error.message);
}

export async function removeFromList(listId: string, bookId: string) {
  must(await supabase.from('list_items').delete().eq('list_id', listId).eq('book_id', bookId));
}

/* ---------------- messages ---------------- */
export async function conversations(): Promise<{ other: Profile; last: Message; unread: number }[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const rows = must(
    await supabase.from('messages').select('*').or(`sender_id.eq.${uid},recipient_id.eq.${uid}`).order('created_at', { ascending: false }).limit(300),
  ) as Message[];
  const map = new Map<string, { last: Message; unread: number }>();
  for (const m of rows) {
    const other = m.sender_id === uid ? m.recipient_id : m.sender_id;
    const cur = map.get(other);
    if (!cur) map.set(other, { last: m, unread: !m.read && m.recipient_id === uid ? 1 : 0 });
    else if (!m.read && m.recipient_id === uid) cur.unread++;
  }
  if (!map.size) return [];
  const profiles = must(await supabase.from('profiles').select('*').in('id', [...map.keys()])) as Profile[];
  return profiles
    .map((p) => ({ other: p, ...map.get(p.id)! }))
    .sort((a, b) => +new Date(b.last.created_at) - +new Date(a.last.created_at));
}

export async function thread(otherId: string): Promise<Message[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const rows = must(
    await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${uid},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${uid})`)
      .order('created_at', { ascending: true })
      .limit(500),
  ) as Message[];
  await supabase.from('messages').update({ read: true }).eq('sender_id', otherId).eq('recipient_id', uid).eq('read', false);
  return rows;
}

export async function sendMessage(to: string, content: string) {
  const uid = await currentUserId();
  if (!uid) throw new Error('Giriş yapmalısın');
  return must(await supabase.from('messages').insert({ sender_id: uid, recipient_id: to, content }).select().single()) as Message;
}
