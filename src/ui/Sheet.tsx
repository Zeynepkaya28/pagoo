import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { T, Row } from './primitives';

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const y = useSharedValue(800);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      y.value = 800;
      requestAnimationFrame(() => {
        y.value = withSpring(0, { damping: 26, stiffness: 240, mass: 0.9 });
        fade.value = withTiming(1, { duration: 220 });
      });
    } else if (mounted) {
      fade.value = withTiming(0, { duration: 200 });
      y.value = withTiming(800, { duration: 240 }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const pan = Gesture.Pan()
    .onChange((e) => {
      y.value = Math.max(-20, y.value + e.changeY);
    })
    .onEnd((e) => {
      if (y.value > 120 || e.velocityY > 900) runOnJS(onClose)();
      else y.value = withSpring(0, { damping: 24, stiffness: 260 });
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: fade.value }));
  const harmony = t.style === 'harmony';
  const r = t.shape.radiusSheet;

  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.c.overlay }, backdrop]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        <Animated.View
          style={[
            {
              backgroundColor: t.style === 'android' ? t.c.bgElevated : t.c.bgElevated,
              borderTopLeftRadius: r,
              borderTopRightRadius: r,
              borderBottomLeftRadius: harmony ? r : 0,
              borderBottomRightRadius: harmony ? r : 0,
              marginHorizontal: harmony ? 10 : 0,
              marginBottom: harmony ? insets.bottom + 10 : 0,
              paddingBottom: harmony ? 18 : insets.bottom + 18,
              maxHeight: '90%',
              width: '100%',
              maxWidth: 640,
              alignSelf: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 30,
            },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={{ paddingTop: 10, paddingBottom: 6 }}>
              <View style={{ alignSelf: 'center', width: t.style === 'android' ? 32 : 40, height: t.style === 'android' ? 4 : 5, borderRadius: 3, backgroundColor: t.c.textMuted, opacity: 0.45 }} />
              {title && (
                <Row style={{ paddingHorizontal: 20, paddingTop: 14, justifyContent: t.style === 'ios' ? 'center' : 'space-between' }}>
                  <T v="title">{title}</T>
                  {t.style !== 'ios' && (
                    <Pressable onPress={onClose} hitSlop={12} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.c.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="close" size={18} color={t.c.textSoft} />
                    </Pressable>
                  )}
                </Row>
              )}
            </View>
          </GestureDetector>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, flexShrink: 1 }}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ---------- Toasts / snackbars ---------- */
type ToastMsg = { id: number; text: string; icon?: keyof typeof Ionicons.glyphMap; tone?: 'ok' | 'error' };
const ToastCtx = createContext<(text: string, opts?: { icon?: keyof typeof Ionicons.glyphMap; tone?: 'ok' | 'error' }) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msgs, setMsgs] = useState<ToastMsg[]>([]);
  const id = useRef(0);
  const show = useCallback((text: string, opts?: { icon?: keyof typeof Ionicons.glyphMap; tone?: 'ok' | 'error' }) => {
    const m = { id: ++id.current, text, ...opts };
    setMsgs((s) => [...s.slice(-1), m]);
    setTimeout(() => setMsgs((s) => s.filter((x) => x.id !== m.id)), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <ToastHost msgs={msgs} />
    </ToastCtx.Provider>
  );
}

function ToastHost({ msgs }: { msgs: ToastMsg[] }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const android = t.style === 'android';
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: android ? undefined : insets.top + 8, bottom: android ? insets.bottom + 96 : undefined, alignItems: 'center', zIndex: 100 }}>
      {msgs.map((m) => (
        <Animated.View
          key={m.id}
          entering={FadeInUp.springify().damping(18)}
          exiting={FadeOutUp.duration(200)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginHorizontal: 16,
            borderRadius: android ? 6 : 100,
            backgroundColor: android ? (t.scheme === 'dark' ? '#E6E0E9' : '#322F35') : t.c.bgElevated,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            maxWidth: 520,
            alignSelf: android ? 'stretch' : 'center',
          }}
        >
          <Ionicons
            name={m.icon ?? (m.tone === 'error' ? 'alert-circle' : 'checkmark-circle')}
            size={20}
            color={m.tone === 'error' ? t.c.danger : android ? (t.scheme === 'dark' ? '#381E72' : '#D0BCFF') : t.c.success}
          />
          <T v="callout" weight="medium" color={android ? (t.scheme === 'dark' ? '#322F35' : '#F5EFF7') : t.c.text}>
            {m.text}
          </T>
        </Animated.View>
      ))}
    </View>
  );
}

export const useToast = () => useContext(ToastCtx);
