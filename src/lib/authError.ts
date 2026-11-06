export function authError(msg: string) {
  if (/invalid login/i.test(msg)) return 'E-posta ya da şifre hatalı.';
  if (/email not confirmed/i.test(msg)) return 'E-posta adresini henüz onaylamadın. Gelen kutunu kontrol et.';
  if (/already registered/i.test(msg)) return 'Bu e-posta ile zaten bir hesap var.';
  if (/password should be/i.test(msg)) return 'Şifre en az 6 karakter olmalı.';
  if (/rate limit/i.test(msg)) return 'Çok fazla deneme yaptın, biraz sonra tekrar dene.';
  if (/valid email|invalid format/i.test(msg)) return 'Geçerli bir e-posta adresi gir.';
  return msg;
}
