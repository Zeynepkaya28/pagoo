import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Avatar, Button, Input, T } from '@/ui/primitives';
import { useToast } from '@/ui/Sheet';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/lib/auth';
import { updateProfile, uploadAvatar } from '@/lib/api';

export default function EditProfile() {
  const t = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? '');
    setUsername(profile.username);
    setBio(profile.bio ?? '');
    setAvatar(profile.avatar_url);
  }, [profile?.id]);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (r.canceled || !r.assets?.[0]) return;
    setUploading(true);
    try {
      const a = r.assets[0];
      const url = await uploadAvatar(a.uri, a.mimeType ?? 'image/jpeg');
      setAvatar(url);
    } catch (e: any) {
      toast(e.message, { tone: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (username.length < 3) return toast('Kullanıcı adı en az 3 karakter olmalı.', { tone: 'error' });
    setBusy(true);
    try {
      await updateProfile({ full_name: name.trim(), username, bio: bio.trim() || null, avatar_url: avatar });
      await refreshProfile();
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      toast('Profilin güncellendi');
      router.back();
    } catch (e: any) {
      toast(/duplicate|unique/i.test(e.message) ? 'Bu kullanıcı adı alınmış.' : e.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Profili düzenle" back large={false}>
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Pressable onPress={pick}>
          <Avatar uri={avatar} name={name || username} size={110} ring />
          <View style={{ position: 'absolute', right: 2, bottom: 2, width: 36, height: 36, borderRadius: 18, backgroundColor: t.c.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: t.c.bg }}>
            <Ionicons name={uploading ? 'hourglass' : 'camera'} size={17} color={t.c.onPrimary} />
          </View>
        </Pressable>
        <T v="caption" style={{ marginTop: 8 }}>
          Fotoğrafı değiştirmek için dokun
        </T>
      </View>
      <View style={{ paddingHorizontal: 16, gap: t.style === 'android' ? 22 : 14, marginTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <Input label="Ad soyad" value={name} onChangeText={setName} />
        <Input label="Kullanıcı adı" icon="at" autoCapitalize="none" value={username} onChangeText={(s) => setUsername(s.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 24))} />
        <Input label="Hakkımda" multiline value={bio} onChangeText={(s) => setBio(s.slice(0, 280))} placeholder="Ne tür kitaplar seversin?" />
        <T v="caption" style={{ textAlign: 'right', marginTop: -6 }}>
          {bio.length}/280
        </T>
        <Button title="Kaydet" gradient loading={busy} onPress={save} />
      </View>
    </Screen>
  );
}
