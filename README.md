# Hell Yeah App 🍺

Social beer tracking app — arkadaşlarınla bira paylaş, Guinness istatistiklerini takip et, liderlik tablosunda yarış!

## Özellikler

- 📸 **Bira Paylaşımı** — Kameranı aç, biranı çek, paylaş
- 🍀 **Guinness Takibi** — Guinness biralarını ayrıca işaretle
- 👥 **Arkadaşlık** — Kullanıcı adıyla ara, istek gönder, arkadaş ol
- 📊 **Liderlik Tablosu** — Yıllık bira sayısına göre arkadaş sıralaması
- 👤 **Profil** — Avatar, istatistikler, bira grid'i
- 💬 **Yorum & Reaksiyon** — Arkadaşlarının biralarına emoji at, yorum yap
- 📍 **Konum** — Biranı nerede içtiğini paylaş (opsiyonel)
- 🌙 **Dark Mode** — Otomatik ve manuel tema desteği

## Teknoloji Stack

| Katman | Teknoloji |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Dil | TypeScript |
| Auth | Firebase Authentication |
| Database | Firebase Realtime Database |
| Storage | Firebase Storage |
| Navigation | React Navigation (Stack) |
| State | React Context |

## Klasör Yapısı

```
src/
├── components/       # Paylaşılan UI bileşenleri
│   ├── CommentSection.tsx
│   ├── CustomModal.tsx
│   ├── EmojiPicker.tsx
│   └── ReactionBar.tsx
├── config/           # Firebase yapılandırması
│   └── firebase.ts
├── contexts/         # React Context providers
│   ├── AuthContext.tsx
│   ├── ModalContext.tsx
│   └── ThemeContext.tsx
├── navigation/       # Stack navigator
│   └── AppNavigator.tsx
├── screens/          # Ekranlar
│   ├── auth/         # Login, Register, ForgotPassword, EmailVerification
│   ├── beer/         # BeerDetailScreen
│   ├── feed/         # FeedScreen (ana sayfa)
│   ├── friends/      # FriendsScreen (arama, istekler, liste)
│   ├── leaderboard/  # LeaderboardScreen
│   └── profile/      # ProfileScreen
├── services/         # Firebase servis katmanı
│   ├── beerService.ts
│   ├── friendService.ts
│   └── userService.ts
├── theme/            # Renk token'ları
│   └── colors.ts
├── types/            # TypeScript tip tanımları
│   └── index.ts
└── utils/            # Yardımcı fonksiyonlar
```

## Gereksinimler

- **Node.js** >= 18
- **npm** (paket yöneticisi — yarn değil)
- **Expo CLI** (`npx expo`)
- **Firebase** projesi (Auth + RTDB + Storage aktif)

## Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Environment değişkenlerini ayarla

```bash
cp .env.example .env
```

`.env` dosyasını Firebase Console > Project Settings > Your App değerleriyle doldur:

```env
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_DATABASE_URL=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

### 3. Firebase Rules deploy

```bash
# Realtime Database kurallarını deploy et
firebase deploy --only database

# Storage kurallarını deploy et
firebase deploy --only storage
```

> ⚠️ Deploy öncesi `database.rules.json` ve `storage.rules` dosyalarını inceleyin.
> Mevcut production verisi varsa backup alın.

### 4. Geliştirme sunucusunu başlat

```bash
npx expo start
```

- **iOS**: `i` tuşu veya Expo Go
- **Android**: `a` tuşu veya Expo Go
- **Web**: `w` tuşu

## Geliştirme Komutları

```bash
npm run start          # Expo dev server
npm run android        # Android cihazda çalıştır
npm run ios            # iOS cihazda çalıştır
npm run web            # Web'de çalıştır
npm run lint           # ESLint kontrolü
npm run typecheck      # TypeScript tip kontrolü
npm run check          # lint + typecheck birlikte
```

## Firebase Güvenlik Kuralları

### Realtime Database (`database.rules.json`)
- Kullanıcı sadece kendi profilini güncelleyebilir (alan bazlı kısıtlama)
- Sayaçlar (totalBeers, beersByYear vs.) yalnız increment ile değiştirilebilir
- Bira kaydını yalnız sahibi oluşturabilir/silebilir
- Yorum: herkes kendi userId'siyle oluşturabilir, sadece sahibi silebilir
- Reaksiyon: herkes kendi UID düğümünü yazabilir
- Arkadaşlık: atomik multi-path update ile iki taraflı yazma
- Email doğrulama: kritik yazma yollarında `email_verified === true` zorunlu

### Storage (`storage.rules`)
- `avatars/{userId}/{fileName}` — sadece kendi klasörüne yükleme
- `beers/{userId}/{fileName}` — sadece kendi klasörüne yükleme
- Boyut limiti: avatarlar 5MB, bira fotoğrafları 10MB
- Sadece image MIME type kabul edilir

## EAS Build

```bash
# Development build
eas build --profile development --platform android

# Preview build
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all
```

## Lisans

Private project.
