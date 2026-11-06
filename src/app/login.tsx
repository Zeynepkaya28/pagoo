import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input, T, Row } from '@/ui/primitives';
import { useTheme } from '@/theme/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/ui/Sheet';
import { authError } from '@/lib/authError';

export default function Login() {
  const t = useTheme();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async () => {
    if (!email || !password) return toast('E-posta ve şifreni gir.', { tone: 'error' });
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return toast(authError(error.message), { tone: 'error' });
    router.replace('/');
  };

  return (
    <AuthShell title="Tekrar hoş geldin" subtitle="Kaldığın sayfadan devam edelim.">
      <Input label="E-posta" icon="mail-outline" placeholder="ornek@posta.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
      <Input label="Şifre" icon="lock-closed-outline" placeholder="••••••••" secureTextEntry={!show} autoComplete="password" value={password} onChangeText={setPassword} onSubmitEditing={submit} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
          <T v="callout" color={t.c.textSoft}>
            {show ? 'Şifreyi gizle' : 'Şifreyi göster'}
          </T>
        </Pressable>
        <Pressable onPress={() => router.push('/forgot')} hitSlop={8}>
          <T v="callout" weight="medium" color={t.c.primary}>
            Şifremi unuttum
          </T>
        </Pressable>
      </Row>
      <Button title="Giriş yap" gradient loading={loading} onPress={submit} style={{ marginTop: 8 }} />
      <Pressable onPress={() => router.replace('/register')} style={{ alignItems: 'center', marginTop: 8 }}>
        <T v="callout" color={t.c.textSoft}>
          Hesabın yok mu? <T v="callout" weight="bold" color={t.c.primary}>Kayıt ol</T>
        </T>
      </Pressable>
    </AuthShell>
  );
}
