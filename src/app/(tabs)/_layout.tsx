import React, { useEffect } from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TabBar } from '@/components/TabBar';
import { useTheme } from '@/theme/ThemeProvider';
import { unreadCount } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function TabsLayout() {
  const t = useTheme();
  const qc = useQueryClient();
  const { session } = useAuth();
  const { data: unread = 0 } = useQuery({ queryKey: ['unread'], queryFn: unreadCount, enabled: !!session, refetchInterval: 60_000 });

  useEffect(() => {
    const uid = session?.user.id;
    if (!uid) return;
    const ch = supabase
      .channel(`notif-${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, () => {
        qc.invalidateQueries({ queryKey: ['unread'] });
        qc.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session?.user.id]);

  return (
    <Tabs
      tabBar={(p) => <TabBar {...p} badges={{ notifications: unread }} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.c.bg }, animation: t.style === 'android' ? 'fade' : 'shift' } as any}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
