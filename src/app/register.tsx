import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input, T } from '@/ui/primitives';
import { useTheme } from '@/theme/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/ui/Sheet';
import { authError } from '@/lib/authError';

export default function Register() {
  const t = useTheme();
  const toast = useToast();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const cleanUser = (s: string) => s.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 24);

  const submit = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) return toast('Tüm alanları doldur, şifre en az 6 karakter olsun.', { tone: 'error' });
    if (username && username.length < 3) return toast('Kullanıcı adı en az 3 karakter olmalı.', { tone: 'error' });
    setLoading(true);
    if (username) {
      const { data } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
      if (data) {
        setLoading(false);
        return toast('Bu kullanıcı adı alınmış.', { tone: 'error' });
      }
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim(), username: username || undefined }, emailRedirectTo: Linking.createURL('/') },
    });
    setLoading(false);
    if (error) return toast(authError(error.message), { tone: 'error' });
    if (!data.session) setSent(true);
    else router.replace('/');
  };

  if (sent) {
    return (
      <AuthShell title="Neredeyse hazır" subtitle={`${email} adresine bir onay bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.`}>
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Ionicons name="mail-unread" size={72} color={t.c.primary} />
        </View>
        <Button title="Giriş ekranına git" gradient onPress={() => router.replace('/login')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Okur ol" subtitle="Bir dakikadan kısa sürer. Kitaplığın seni bekliyor.">
      <Input label="Ad soyad" icon="person-outline" placeholder="Adın" value={name} onChangeText={setName} autoComplete="name" />
      <Input label="Kullanıcı adı" icon="at" placeholder="kullanici_adi" autoCapitalize="none" value={username} onChangeText={(s) => setUsername(cleanUser(s))} />
      <Input label="E-posta" icon="mail-outline" placeholder="ornek@posta.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} autoComplete="email" />
      <Input label="Şifre" icon="lock-closed-outline" placeholder="En az 6 karakter" secureTextEntry value={password} onChangeText={setPassword} autoComplete="new-password" onSubmitEditing={submit} />
      <Button title="Hesap oluştur" gradient loading={loading} onPress={submit} style={{ marginTop: 6 }} />
      <Pressable onPress={() => router.replace('/login')} style={{ alignItems: 'center', marginTop: 8 }}>
        <T v="callout" color={t.c.textSoft}>
          Zaten üye misin? <T v="callout" weight="bold" color={t.c.primary}>Giriş yap</T>
        </T>
      </Pressable>
    </AuthShell>
  );
}
