import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { Aurora } from './effects';
import { LogoMark } from './Logo';
import { IconButton, T } from '@/ui/primitives';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Aurora height={360} intensity={0.8} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
          <View style={{ paddingHorizontal: 8 }}>
            <IconButton name={t.style === 'android' ? 'arrow-back' : 'chevron-back'} onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} color={t.c.text} filled={t.style === 'harmony'} />
          </View>
          <View style={{ paddingHorizontal: 24 }}>
            <Animated.View entering={FadeInDown.springify().damping(16)} style={{ marginTop: 18 }}>
              <LogoMark size={56} />
              <T v="display" style={{ marginTop: 22, fontSize: 32, lineHeight: 38 }}>
                {title}
              </T>
              <T v="body" color={t.c.textSoft} style={{ marginTop: 8 }}>
                {subtitle}
              </T>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(120).springify().damping(16)} style={{ marginTop: 28, gap: t.style === 'android' ? 22 : 14 }}>
              {children}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
