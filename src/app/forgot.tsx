import React, { useState } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input } from '@/ui/primitives';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/ui/Sheet';
import { authError } from '@/lib/authError';

export default function Forgot() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async () => {
    if (!email.trim()) return toast('E-posta adresini gir.', { tone: 'error' });
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL('/settings') });
    setLoading(false);
    if (error) return toast(authError(error.message), { tone: 'error' });
    setSent(true);
  };
  return (
    <AuthShell
      title={sent ? 'E-postanı kontrol et' : 'Şifreni mi unuttun?'}
      subtitle={sent ? 'Şifre yenileme bağlantısını gönderdik. Gelmediyse spam klasörüne de bak.' : 'Kayıtlı e-posta adresini yaz, sana yenileme bağlantısı gönderelim.'}
    >
      {!sent && <Input label="E-posta" icon="mail-outline" placeholder="ornek@posta.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />}
      {sent ? <Button title="Giriş ekranına dön" gradient onPress={() => router.replace('/login')} /> : <Button title="Bağlantı gönder" gradient loading={loading} onPress={submit} />}
    </AuthShell>
  );
}
