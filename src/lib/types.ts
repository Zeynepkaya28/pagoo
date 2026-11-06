export type ShelfStatus = 'want' | 'reading' | 'read' | 'dnf';
export type PostType = 'review' | 'quote' | 'status' | 'note';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  accent: string | null;
  reading_goal: number;
  created_at: string;
}

export interface Author {
  id: string;
  name: string;
  bio: string | null;
  born: number | null;
  died: number | null;
  country: string | null;
  photo_url: string | null;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  author_id: string | null;
  description: string | null;
  page_count: number | null;
  published_year: number | null;
  publisher: string | null;
  isbn: string | null;
  cover_url: string | null;
  categories: string[];
  rating_sum: number;
  rating_count: number;
  readers_count: number;
  created_at: string;
  author?: Pick<Author, 'id' | 'name'> | null;
}

export interface ShelfEntry {
  user_id: string;
  book_id: string;
  status: ShelfStatus;
  current_page: number;
  rating: number | null;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
  book?: Book;
}

export interface FeedPost {
  id: string;
  user_id: string;
  book_id: string | null;
  type: PostType;
  content: string;
  page: number | null;
  rating: number | null;
  spoiler: boolean;
  created_at: string;
  like_count: number;
  comment_count: number;
  liked: boolean;
  user?: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
  book?: Pick<Book, 'id' | 'title' | 'cover_url' | 'page_count'> & { author?: { id: string; name: string } | null };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
}

export interface Notification {
  id: number;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow' | 'message';
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
  post?: { id: string; content: string; type: PostType } | null;
}

export interface ReadingList {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  items?: { book: Book }[];
  count?: number;
}

export interface Message {
  id: number;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface UserStats {
  read_this_year: number;
  read_total: number;
  reading: number;
  want: number;
  pages_this_year: number;
  reviews: number;
  quotes: number;
  followers: number;
  following: number;
  monthly: { m: number; pages: number; books: number }[];
  top_categories: { name: string; n: number }[];
}

export const STATUS_LABEL: Record<ShelfStatus, string> = {
  want: 'Okuyacağım',
  reading: 'Okuyorum',
  read: 'Okudum',
  dnf: 'Yarım bıraktım',
};

export const STATUS_ICON: Record<ShelfStatus, string> = {
  want: 'bookmark',
  reading: 'book',
  read: 'checkmark-circle',
  dnf: 'pause-circle',
};
