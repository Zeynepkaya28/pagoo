export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'şimdi';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} g`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} hf`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: d > 330 ? 'numeric' : undefined });
}

export function avgRating(sum: number, count: number): number | null {
  if (!count) return null;
  return Math.round((sum / count) * 10) / 10;
}

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} Mn`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')} B`;
  return String(n);
}

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toLocaleUpperCase('tr-TR');
}

export const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
