import React, { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet, useToast } from '@/ui/Sheet';
import { Button, Chip, haptic, Row, T } from '@/ui/primitives';
import { Confetti, PageTurn } from './effects';
import { useTheme } from '@/theme/ThemeProvider';
import { setShelf, removeFromShelf } from '@/lib/api';
import { STATUS_ICON, STATUS_LABEL, type Book, type ShelfEntry, type ShelfStatus } from '@/lib/types';

export function invalidateReading(qc: ReturnType<typeof useQueryClient>, bookId: string) {
  qc.invalidateQueries({ queryKey: ['shelf'] });
  qc.invalidateQueries({ queryKey: ['entry', bookId] });
  qc.invalidateQueries({ queryKey: ['book', bookId] });
  qc.invalidateQueries({ queryKey: ['feed'] });
  qc.invalidateQueries({ queryKey: ['stats'] });
}

/* ---------- draggable page slider ---------- */
function PageSlider({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const t = useTheme();
  const [w, setW] = useState(1);
  const x = useSharedValue(max ? (value / max) * w : 0);
  useEffect(() => {
    x.value = withSpring(max ? (value / max) * w : 0, { damping: 20, stiffness: 220 });
  }, [value, w, max]);
  const update = (px: number) => onChange(Math.round((Math.max(0, Math.min(w, px)) / w) * max));
  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      x.value = Math.max(0, Math.min(w, e.x));
      runOnJS(update)(e.x);
    })
    .onChange((e) => {
      x.value = Math.max(0, Math.min(w, e.x));
      runOnJS(update)(e.x);
    });
  const fill = useAnimatedStyle(() => ({ width: x.value }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value - 14 }] }));
  return (
    <GestureDetector gesture={pan}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: 36, justifyContent: 'center' }}>
        <View style={{ height: t.style === 'android' ? 16 : 8, borderRadius: 8, backgroundColor: t.c.cardAlt, overflow: 'hidden' }}>
          <Animated.View style={[{ height: '100%', borderRadius: 8, overflow: 'hidden' }, fill]}>
            <LinearGradient colors={t.c.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
          </Animated.View>
        </View>
        <Animated.View
          style={[
            { position: 'absolute', left: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', borderWidth: t.style === 'android' ? 0 : 0.5, borderColor: '#0002', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
            t.style === 'android' && { width: 4, height: 40, borderRadius: 2, backgroundColor: t.c.primary, marginLeft: 12 },
            knob,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

export function ProgressSheet({ visible, onClose, book, entry }: { visible: boolean; onClose: () => void; book: Book; entry?: ShelfEntry | null }) {
  const t = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const max = book.page_count ?? 0;
  const [page, setPage] = useState(entry?.current_page ?? 0);
  const [turn, setTurn] = useState(0);
  const [boom, setBoom] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (visible) setPage(entry?.current_page ?? 0);
  }, [visible]);

  const save = async () => {
    setSaving(true);
    try {
      const done = max > 0 && page >= max;
      await setShelf(book.id, { current_page: page, status: done ? 'read' : 'reading' });
      invalidateReading(qc, book.id);
      haptic('success');
      if (done) {
        setBoom(Date.now());
        toast('Tebrikler, kitabı bitirdin!', { icon: 'trophy' });
        setTimeout(onClose, 1500);
      } else {
        setTurn(Date.now());
        toast(`Sayfa ${page} kaydedildi`, { icon: 'bookmark' });
        setTimeout(onClose, 900);
      }
    } catch (e: any) {
      toast(e.message, { tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const pct = max ? Math.round((page / max) * 100) : 0;
  return (
    <Sheet visible={visible} onClose={onClose} title="Okuma ilerlemesi">
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <PageTurn trigger={turn} size={150} />
      </View>
      <Row style={{ justifyContent: 'center', marginTop: 10, alignItems: 'flex-end', flexWrap: 'nowrap' }} gap={6}>
        <TextInput
          value={String(page)}
          keyboardType="number-pad"
          onChangeText={(s) => setPage(Math.min(max || 99999, parseInt(s.replace(/\D/g, '') || '0', 10)))}
          style={{ fontSize: 44, fontWeight: '800', color: t.c.text, width: String(page).length * 28 + 24, textAlign: 'center', padding: 0, ...( { outlineStyle: 'none' } as any) }}
        />
        <T v="headline" color={t.c.textMuted} numberOfLines={1} style={{ marginBottom: 10 }}>
          / {max || '?'} sayfa
        </T>
      </Row>
      <T v="caption" center style={{ marginBottom: 8 }}>
        %{pct} tamamlandı
      </T>
      {max > 0 && <PageSlider value={page} max={max} onChange={setPage} />}
      <Row gap={8} style={{ justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        {[10, 25, 50].map((n) => (
          <Chip key={n} label={`+${n}`} onPress={() => setPage((p) => Math.min(max || p + n, p + n))} />
        ))}
        {max > 0 && <Chip label="Bitirdim" icon="checkmark-done" onPress={() => setPage(max)} />}
      </Row>
      <Button title="Kaydet" gradient onPress={save} loading={saving} style={{ marginTop: 18 }} icon="bookmark" />
      <Confetti fire={boom} />
    </Sheet>
  );
}

export function ShelfSheet({ visible, onClose, book, entry, onProgress }: { visible: boolean; onClose: () => void; book: Book; entry?: ShelfEntry | null; onProgress?: () => void }) {
  const t = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [boom, setBoom] = useState(0);
  const choose = async (s: ShelfStatus) => {
    try {
      await setShelf(book.id, { status: s });
      invalidateReading(qc, book.id);
      haptic('success');
      if (s === 'read') {
        setBoom(Date.now());
        setTimeout(onClose, 1200);
      } else onClose();
      toast(`“${STATUS_LABEL[s]}” rafına eklendi`, { icon: STATUS_ICON[s] as any });
      if (s === 'reading' && onProgress) setTimeout(onProgress, 400);
    } catch (e: any) {
      toast(e.message, { tone: 'error' });
    }
  };
  const remove = async () => {
    await removeFromShelf(book.id);
    invalidateReading(qc, book.id);
    onClose();
    toast('Kitaplığından çıkarıldı', { icon: 'trash' });
  };
  const colors: Record<ShelfStatus, string> = { want: t.c.warning, reading: t.c.primary, read: t.c.success, dnf: t.c.textMuted };
  return (
    <Sheet visible={visible} onClose={onClose} title="Rafına ekle">
      <View style={{ gap: 10, marginTop: 4 }}>
        {(Object.keys(STATUS_LABEL) as ShelfStatus[]).map((s) => {
          const on = entry?.status === s;
          return (
            <Pressable
              key={s}
              onPress={() => choose(s)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 14,
                borderRadius: t.shape.radius,
                backgroundColor: on ? colors[s] + '22' : t.c.card,
                borderWidth: on ? 1.5 : 0,
                borderColor: colors[s],
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ width: 40, height: 40, borderRadius: t.style === 'android' ? 20 : 12, backgroundColor: colors[s] + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={STATUS_ICON[s] as any} size={21} color={colors[s]} />
              </View>
              <T v="headline" style={{ flex: 1 }}>
                {STATUS_LABEL[s]}
              </T>
              {on && <Ionicons name="checkmark-circle" size={22} color={colors[s]} />}
            </Pressable>
          );
        })}
        {entry && <Button title="Kitaplığımdan çıkar" kind="danger" icon="trash-outline" onPress={remove} style={{ marginTop: 6 }} />}
      </View>
      <Confetti fire={boom} />
    </Sheet>
  );
}

export function RatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const t = useTheme();
  return (
    <View>
      <Row gap={6} style={{ justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map((i) => {
          const full = value >= i * 2;
          const half = !full && value >= i * 2 - 1;
          return (
            <Pressable
              key={i}
              onPress={() => {
                haptic('select');
                onChange(value === i * 2 ? i * 2 - 1 : i * 2);
              }}
              hitSlop={6}
            >
              <Ionicons name={full ? 'star' : half ? 'star-half' : 'star-outline'} size={36} color={t.c.star} />
            </Pressable>
          );
        })}
      </Row>
      <T v="caption" center style={{ marginTop: 6 }}>
        {value ? `${value} / 10 · aynı yıldıza tekrar dokunarak yarım puan ver` : 'Puan vermek için yıldızlara dokun'}
      </T>
    </View>
  );
}
