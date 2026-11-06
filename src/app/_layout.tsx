import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SystemUI from 'expo-system-ui';
import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { ThemeProvider, useAppearance } from '@/theme/ThemeProvider';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider } from '@/ui/Sheet';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

const PUBLIC = new Set(['welcome', 'login', 'register', 'forgot']);

function Gate() {
  const { theme, ready } = useAppearance();
  const { session, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading || !ready) return;
    SplashScreen.hideAsync().catch(() => {});
    const first = segments[0] as string | undefined;
    const inPublic = first ? PUBLIC.has(first) : false;
    if (!session && !inPublic) router.replace('/welcome');
    else if (session && inPublic) router.replace('/');
  }, [session, loading, ready, segments]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.c.bg).catch(() => {});
  }, [theme.c.bg]);

  const anim = theme.style === 'ios' ? 'default' : theme.style === 'android' ? 'fade_from_bottom' : 'slide_from_right';

  return (
    <View style={{ flex: 1, backgroundColor: theme.c.bg }}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: anim as any,
          contentStyle: { backgroundColor: theme.c.bg },
          gestureEnabled: true,
          fullScreenGestureEnabled: theme.style !== 'android',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="compose" options={{ presentation: theme.style === 'ios' ? 'modal' : 'card', animation: theme.style === 'ios' ? 'default' : 'slide_from_bottom' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  if (!fontsLoaded && Platform.OS !== 'web') return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Gate />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
