import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Screen } from '@/ui/Screen';
import { Button, Divider, Input, Row, Segmented, T } from '@/ui/primitives';
import { Sheet, useToast } from '@/ui/Sheet';
import { useAppearance } from '@/theme/ThemeProvider';
import { buildTheme, UIStyle } from '@/theme/tokens';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const STYLE_INFO: Record<UIStyle, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  ios: { label: 'iOS', icon: 'logo-apple' },
  android: { label: 'Android', icon: 'logo-android' },
  harmony: { label: 'HarmonyOS', icon: 'aperture' },
};

/** A miniature phone that previews each design language. */
function StylePreview({ style, active, onPress, scheme }: { style: UIStyle; active: boolean; onPress: () => void; scheme: 'light' | 'dark' }) {
  const th = buildTheme(style, scheme);
  const { width } = useWindowDimensions();
  const w = Math.min(104, (Math.min(width, 640) - 64) / 3);
  const c = th.c;
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ width: w, height: w * 1.75, borderRadius: 16, borderWidth: active ? 2.5 : 1, borderColor: active ? c.primary : c.border, backgroundColor: c.bg, padding: 6, overflow: 'hidden' }}>
        <View style={{ height: 8, width: style === 'ios' ? '60%' : '45%', backgroundColor: c.text, opacity: 0.85, borderRadius: 3, marginTop: 6 }} />
        <View style={{ height: 34, backgroundColor: c.card, borderRadius: th.shape.radius / 2, marginTop: 8 }} />
        <View style={{ height: 26, backgroundColor: c.card, borderRadius: th.shape.radius / 2, marginTop: 5 }} />
        <View style={{ height: 14, width: '60%', backgroundColor: c.primary, borderRadius: th.shape.button > 50 ? 7 : 4, marginTop: 6 }} />
        <View
          style={{
            position: 'absolute',
            left: style === 'harmony' ? 8 : 0,
            right: style === 'harmony' ? 8 : 0,
            bottom: style === 'harmony' ? 8 : 0,
            height: 18,
            borderRadius: style === 'harmony' ? 9 : 0,
            backgroundColor: style === 'android' ? c.tabBar : c.bgElevated,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            borderTopWidth: style === 'ios' ? 0.5 : 0,
            borderColor: c.border,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: style === 'android' && i === 0 ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === 0 ? (style === 'android' ? c.primarySoft : c.primary) : c.textMuted }} />
          ))}
        </View>
      </View>
      <Row gap={4}>
        <Ionicons name={STYLE_INFO[style].icon} size={13} color={active ? c.primary : '#888'} />
        <T v="caption" weight={active ? 'bold' : 'medium'}>
          {STYLE_INFO[style].label}
        </T>
      </Row>
    </Pressable>
  );
}

function Item({ icon, label, value, onPress, danger, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress?: () => void; danger?: boolean; last?: boolean }) {
  const { theme: t } = useAppearance();
  return (
    <>
      <Pressable onPress={onPress} android_ripple={{ color: t.c.primary + '22' }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: t.style === 'android' ? 16 : 12, backgroundColor: pressed && Platform.OS !== 'android' ? t.c.cardAlt : 'transparent' })}>
        <View style={{ width: 30, height: 30, borderRadius: t.style === 'ios' ? 7 : 15, backgroundColor: danger ? t.c.danger : t.style === 'android' ? 'transparent' : t.c.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={t.style === 'android' ? 22 : 17} color={t.style === 'android' && !danger ? t.c.textSoft : '#fff'} />
        </View>
        <T v="body" style={{ flex: 1 }} color={danger ? t.c.danger : t.c.text}>
          {label}
        </T>
        {value && <T v="callout" color={t.c.textMuted}>{value}</T>}
        {onPress && !danger && <Ionicons name="chevron-forward" size={18} color={t.c.textMuted} />}
      </Pressable>
      {!last && t.style !== 'android' && <Divider inset={60} />}
    </>
  );
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  const { theme: t } = useAppearance();
  return (
    <View style={{ marginTop: 22 }}>
      {title && (
        <T v={t.style === 'android' ? 'callout' : 'label'} weight="bold" color={t.style === 'android' ? t.c.primary : t.c.textMuted} style={{ paddingHorizontal: t.style === 'ios' ? 32 : 24, marginBottom: 8 }}>
          {title}
        </T>
      )}
      <View style={{ marginHorizontal: t.style === 'android' ? 0 : 16, backgroundColor: t.style === 'android' ? 'transparent' : t.c.card, borderRadius: t.shape.radius, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

export default function Settings() {
  const { theme: t, schemePref, setSchemePref, stylePref, setStylePref, detectedStyle } = useAppearance();
  const { signOut, session } = useAuth();
  const toast = useToast();
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === 'PASSWORD_RECOVERY') setPwOpen(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const doSignOut = () => {
    const go = async () => {
      await signOut();
      router.replace('/welcome');
    };
    if (Platform.OS === 'web') go();
    else Alert.alert('Çıkış yapılsın mı?', undefined, [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Çıkış yap', style: 'destructive', onPress: go }]);
  };

  return (
    <Screen title="Ayarlar" back>
      <Group title="Görünüm">
        <View style={{ padding: 16, gap: 16 }}>
          <Segmented
            items={[
              { key: 'system', label: 'Sistem' },
              { key: 'light', label: 'Açık' },
              { key: 'dark', label: 'Koyu' },
            ]}
            value={schemePref}
            onChange={setSchemePref}
          />
          <T v="callout" weight="bold">
            Arayüz stili
          </T>
          <Row style={{ justifyContent: 'space-around' }}>
            {(['ios', 'android', 'harmony'] as UIStyle[]).map((s, i) => (
              <Animated.View key={s} entering={FadeInDown.delay(i * 60).springify()}>
                <StylePreview style={s} scheme={t.scheme} active={(stylePref === 'auto' ? detectedStyle : stylePref) === s} onPress={() => setStylePref(s)} />
              </Animated.View>
            ))}
          </Row>
          <Pressable onPress={() => setStylePref('auto')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name={stylePref === 'auto' ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={t.c.primary} />
            <T v="callout">Cihaza göre otomatik seç ({STYLE_INFO[detectedStyle].label})</T>
          </Pressable>
        </View>
      </Group>

      <Group title="Hesap">
        <Item icon="person" label="Profili düzenle" onPress={() => router.push('/edit-profile')} />
        <Item icon="key" label="Şifre değiştir" onPress={() => setPwOpen(true)} />
        <Item icon="mail" label="E-posta" value={session?.user.email ?? ''} last />
      </Group>

      <Group title="Pagoo">
        <Item icon="stats-chart" label="Okuma istatistiklerim" onPress={() => router.push('/stats')} />
        <Item icon="albums" label="Listelerim" onPress={() => router.push(`/lists/${session?.user.id}`)} />
        <Item icon="chatbubbles" label="Mesajlar" onPress={() => router.push('/messages')} />
        <Item icon="help-buoy" label="Bize ulaşın" onPress={() => WebBrowser.openBrowserAsync('mailto:destek@pagoo.app').catch(() => {})} last />
      </Group>

      <Group>
        <Item icon="log-out" label="Çıkış yap" danger onPress={doSignOut} last />
      </Group>
      <T v="caption" center style={{ marginTop: 20 }}>
        Pagoo {Constants.expoConfig?.version ?? '1.0.0'}
      </T>

      <Sheet visible={pwOpen} onClose={() => setPwOpen(false)} title="Yeni şifre">
        <View style={{ gap: 14 }}>
          <Input label="Yeni şifre" secureTextEntry placeholder="En az 6 karakter" value={pw} onChangeText={setPw} />
          <Button
            title="Kaydet"
            gradient
            disabled={pw.length < 6}
            onPress={async () => {
              const { error } = await supabase.auth.updateUser({ password: pw });
              if (error) return toast(error.message, { tone: 'error' });
              setPw('');
              setPwOpen(false);
              toast('Şifren güncellendi', { icon: 'key' });
            }}
          />
        </View>
      </Sheet>
    </Screen>
  );
}
