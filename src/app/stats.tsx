import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/ui/Screen';
import { Button, Card, Loading, Row, Segmented, T } from '@/ui/primitives';
import { Sheet, useToast } from '@/ui/Sheet';
import { Aurora, Confetti, ProgressRing } from '@/components/effects';
import { useTheme } from '@/theme/ThemeProvider';
import { stats, updateProfile } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { MONTHS } from '@/lib/format';

function Bar({ value, max, label, i, highlight }: { value: number; max: number; label: string; i: number; highlight: boolean }) {
  const t = useTheme();
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(i * 50, withSpring(max ? value / max : 0, { damping: 14, stiffness: 90 }));
  }, [value, max]);
  const s = useAnimatedStyle(() => ({ height: `${Math.max(2, h.value * 100)}%` as any }));
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <View style={{ height: 140, width: '70%', justifyContent: 'flex-end' }}>
        <Animated.View style={[{ borderRadius: t.style === 'android' ? 6 : 5, overflow: 'hidden' }, s]}>
          <LinearGradient colors={highlight ? [t.c.gradient[2], t.c.gradient[0]] : [t.c.primary + '99', t.c.primary + '55']} style={{ flex: 1 }} />
        </Animated.View>
      </View>
      <T v="caption" style={{ fontSize: 10 }}>
        {label}
      </T>
    </View>
  );
}

export default function Stats() {
  const t = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { session, profile, refreshProfile } = useAuth();
  const uid = session?.user.id;
  const now = new Date().getFullYear();
  const [year, setYear] = useState(now);
  const [metric, setMetric] = useState<'pages' | 'books'>('pages');
  const [goalOpen, setGoalOpen] = useState(false);
  const [goal, setGoal] = useState(profile?.reading_goal ?? 24);
  const [boom, setBoom] = useState(0);
  const q = useQuery({ queryKey: ['stats', uid, year], queryFn: () => stats(uid!, year), enabled: !!uid });
  const s = q.data;
  const target = profile?.reading_goal ?? 24;
  const done = s?.read_this_year ?? 0;
  const monthly = s?.monthly ?? [];
  const maxV = Math.max(1, ...monthly.map((m) => (metric === 'pages' ? m.pages : m.books)));
  const thisMonth = new Date().getMonth() + 1;

  useEffect(() => {
    if (year === now && done >= target && done > 0) setBoom(Date.now());
  }, [done, target]);

  const tiles: { icon: keyof typeof Ionicons.glyphMap; v: number | string; l: string; c: string }[] = [
    { icon: 'checkmark-done', v: s?.read_total ?? 0, l: 'Toplam okunan', c: t.c.success },
    { icon: 'book', v: s?.reading ?? 0, l: 'Okunuyor', c: t.c.primary },
    { icon: 'bookmark', v: s?.want ?? 0, l: 'Okunacak', c: t.c.warning },
    { icon: 'document-text', v: (s?.pages_this_year ?? 0).toLocaleString('tr-TR'), l: `${year} sayfa`, c: t.c.accent },
    { icon: 'create', v: s?.reviews ?? 0, l: 'İnceleme', c: t.c.gradient[1] },
    { icon: 'chatbox-ellipses', v: s?.quotes ?? 0, l: 'Alıntı', c: t.c.gradient[0] },
  ];

  return (
    <Screen title="İstatistikler" back>
      <Aurora height={420} style={{ top: -40 }} intensity={0.7} />
      <Row gap={10} style={{ justifyContent: 'center', marginBottom: 6 }}>
        <Pressable onPress={() => setYear((y) => y - 1)} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={t.c.textSoft} />
        </Pressable>
        <T v="title">{year}</T>
        <Pressable onPress={() => year < now && setYear((y) => y + 1)} hitSlop={10}>
          <Ionicons name="chevron-forward" size={22} color={year < now ? t.c.textSoft : t.c.border} />
        </Pressable>
      </Row>
      {!s ? (
        <Loading />
      ) : (
        <>
          <Animated.View entering={FadeInDown.springify().damping(15)} style={{ alignItems: 'center', marginTop: 8 }}>
            <ProgressRing progress={target ? done / target : 0} size={210} stroke={18}>
              <T style={{ fontSize: 52, lineHeight: 60, fontWeight: '800', color: t.c.text, fontFamily: t.style === 'ios' ? undefined : t.font.uiBold }}>{done}</T>
              <T v="callout" color={t.c.textMuted}>
                / {target} kitap
              </T>
            </ProgressRing>
            <T v="callout" color={t.c.textSoft} center style={{ marginTop: 14, paddingHorizontal: 30 }}>
              {done >= target
                ? 'Hedefini tamamladın! Yeni bir hedef koymaya ne dersin?'
                : year === now
                  ? `Hedefe ${target - done} kitap kaldı. Ayda ortalama ${Math.ceil((target - done) / Math.max(1, 12 - thisMonth + 1))} kitap yeter.`
                  : `${year} yılında ${done} kitap bitirdin.`}
            </T>
            <Button title="Hedefi düzenle" kind="tonal" small icon="flag-outline" style={{ marginTop: 12 }} onPress={() => setGoalOpen(true)} />
          </Animated.View>

          <Card style={{ marginHorizontal: 16, marginTop: 24 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <T v="title">Aylık</T>
              <Segmented
                style={{ width: 170 }}
                items={[
                  { key: 'pages', label: 'Sayfa' },
                  { key: 'books', label: 'Kitap' },
                ]}
                value={metric}
                onChange={setMetric}
              />
            </Row>
            <Row gap={0} style={{ alignItems: 'flex-end' }}>
              {monthly.map((m, i) => (
                <Bar key={`${metric}-${m.m}`} i={i} value={metric === 'pages' ? m.pages : m.books} max={maxV} label={MONTHS[m.m - 1]} highlight={year === now && m.m === thisMonth} />
              ))}
            </Row>
          </Card>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 12 }}>
            {tiles.map((x, i) => (
              <Animated.View key={x.l} entering={FadeInDown.delay(80 + i * 50).springify().damping(16)} style={{ width: '31.5%', flexGrow: 1 }}>
                <Card>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: x.c + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={x.icon} size={18} color={x.c} />
                  </View>
                  <T v="title" style={{ marginTop: 10 }}>
                    {x.v}
                  </T>
                  <T v="caption">{x.l}</T>
                </Card>
              </Animated.View>
            ))}
          </View>

          {s.top_categories.length > 0 && (
            <Card style={{ marginHorizontal: 16, marginTop: 12 }}>
              <T v="title" style={{ marginBottom: 12 }}>
                En çok okuduğun türler
              </T>
              {s.top_categories.map((c, i) => (
                <View key={c.name} style={{ marginBottom: 10 }}>
                  <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                    <T v="callout" weight="medium">
                      {c.name}
                    </T>
                    <T v="caption">{c.n} kitap</T>
                  </Row>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: t.c.cardAlt, overflow: 'hidden' }}>
                    <LinearGradient colors={[t.c.gradient[i % 3], t.c.gradient[(i + 1) % 3]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 8, width: `${(c.n / s.top_categories[0].n) * 100}%` }} />
                  </View>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
      <Sheet visible={goalOpen} onClose={() => setGoalOpen(false)} title={`${now} okuma hedefi`}>
        <Row style={{ justifyContent: 'center', marginVertical: 18 }} gap={24}>
          <Pressable onPress={() => setGoal((g) => Math.max(1, g - 1))} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.c.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="remove" size={26} color={t.c.text} />
          </Pressable>
          <View style={{ alignItems: 'center', minWidth: 90 }}>
            <T style={{ fontSize: 56, lineHeight: 64, fontWeight: '800', color: t.c.text }}>{goal}</T>
            <T v="caption">kitap</T>
          </View>
          <Pressable onPress={() => setGoal((g) => Math.min(1000, g + 1))} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.c.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={26} color={t.c.onPrimary} />
          </Pressable>
        </Row>
        <Row gap={8} style={{ justifyContent: 'center', marginBottom: 16 }}>
          {[12, 24, 52, 100].map((n) => (
            <Pressable key={n} onPress={() => setGoal(n)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: goal === n ? t.c.primarySoft : t.c.card }}>
              <T v="callout" weight="bold" color={goal === n ? t.c.onPrimarySoft : t.c.textSoft}>
                {n}
              </T>
            </Pressable>
          ))}
        </Row>
        <Button
          title="Kaydet"
          gradient
          onPress={async () => {
            await updateProfile({ reading_goal: goal });
            await refreshProfile();
            qc.invalidateQueries({ queryKey: ['stats'] });
            setGoalOpen(false);
            toast('Yeni hedefin kaydedildi', { icon: 'flag' });
          }}
        />
      </Sheet>
      <Confetti fire={boom} />
    </Screen>
  );
}
