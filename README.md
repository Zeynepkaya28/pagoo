# Pagoo

Kitap okurları için sosyal kitaplık: rafına kitap ekle, okuma ilerlemeni kaydet, inceleme ve alıntı paylaş, okurları takip et, mesajlaş.

Tek kod tabanı, üç tasarım dili:

| Platform | Görünüm |
| --- | --- |
| iOS | Büyük başlıklar, buzlu cam sekme çubuğu, segment kontrolleri |
| Android | Material You: tonal yüzeyler, hap şeklinde gezinti göstergesi, FAB |
| HarmonyOS | Kapsül bileşenler, yüzen cam sekme çubuğu, geniş köşe yarıçapları |

Stil cihaza göre otomatik seçilir (Huawei/Honor cihazlar ve HarmonyOS tarayıcıları HarmonyOS görünümünü alır) ve Ayarlar → Arayüz stili bölümünden elle değiştirilebilir. Açık / koyu / sistem modu desteklenir.

## Geliştirme

```bash
npm install
npx expo start          # Expo Go / geliştirme sunucusu
npm run build:web       # web çıktısı → dist/
npm run typecheck
```

Ortam değişkenleri `.env` içinde:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_KEY=...   # publishable (herkese açık) anahtar
```

## Mağaza build'leri (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile production
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios     # App Store Connect
npx eas-cli@latest submit -p android # Google Play
```

HarmonyOS NEXT (saf HarmonyOS, Android uygulamalarını çalıştırmayan sürüm) için uygulama, React Native OpenHarmony (RNOH) ile derlenir; kod `Platform.OS === 'harmony'` durumunu zaten tanır ve HarmonyOS tasarımına geçer. HarmonyOS 4 ve öncesinde Android APK'sı doğrudan çalışır ve HarmonyOS görünümü otomatik açılır.

## Supabase

Tablolar: `profiles, authors, books, shelf_entries, reading_logs, posts, likes, comments, follows, notifications, lists, list_items, messages`. Tüm tablolarda RLS açık. Sayaçlar, durum paylaşımları, bildirimler ve okuma günlükleri tetikleyicilerle tutulur. `avatars` bucket'ı profil fotoğrafları içindir.

## Yapı

```
src/app         ekranlar (Expo Router)
src/components  3D kitap, 3D raf, kapak akışı, efektler, paylaşım kartı
src/ui          platforma göre değişen temel bileşenler
src/theme       renk, şekil ve yazı tipi tokenları
src/lib         Supabase istemcisi ve veri katmanı
```
