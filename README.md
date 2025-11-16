# Hell Yeah App - React Native (Expo)

Firebase entegreli React Native Expo kamera ve sayaç uygulaması.

## Özellikler

- ✅ Sayaç fonksiyonu
- 📷 Kamera entegrasyonu (Expo Camera & Image Picker)
- 🔥 Firebase Realtime Database
- ☁️ Firebase Storage (Fotoğraf yükleme)
- 📱 Cihaz bazlı veri saklama
- 🌐 Web, iOS ve Android desteği

## Teknolojiler

- **React Native** - Mobil uygulama framework
- **Expo** - React Native geliştirme platformu
- **Firebase** - Backend servisleri (Realtime Database & Storage)
- **Expo Camera** - Kamera fonksiyonları
- **Expo Image Picker** - Galeri ve kamera erişimi
- **Expo Device** - Cihaz bilgileri

## Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn
- Expo CLI
- Visual Studio Code (önerilen)
- Android Studio veya Xcode (native build için)
- Firebase hesabı ve proje yapılandırması

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
cd hell_yeah_app_rn
npm install
```

veya

```bash
yarn install
```

### 2. Firebase Yapılandırması

1. [Firebase Console](https://console.firebase.google.com/) üzerinden yeni bir proje oluşturun
2. Realtime Database ve Storage servislerini aktif edin
3. Web uygulaması ekleyin ve config bilgilerini alın
4. `src/config/firebase.js` dosyasındaki Firebase config bilgilerini güncelleyin:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. **Android için:** `google-services.json` dosyasını proje kök dizinine ekleyin
6. **iOS için:** `GoogleService-Info.plist` dosyasını proje kök dizinine ekleyin

### 3. Expo CLI Kurulumu (Gerekirse)

```bash
npm install -g expo-cli
```

## VS Code'da Çalıştırma

### Yöntem 1: Terminal Komutları

```bash
# Development server'ı başlat
npm start

# veya
npx expo start

# Android'de çalıştır
npm run android

# iOS'ta çalıştır
npm run ios

# Web'de çalıştır
npm run web
```

### Yöntem 2: VS Code Tasks (Ctrl+Shift+P > Tasks: Run Task)

- **Expo: Start** - Development server'ı başlat
- **Expo: Start (Clear Cache)** - Cache temizleyerek başlat
- **Expo: Android** - Android'de çalıştır
- **Expo: iOS** - iOS'ta çalıştır
- **Expo: Web** - Web tarayıcıda çalıştır
- **npm: Install Dependencies** - Bağımlılıkları yükle

### Yöntem 3: Debug Paneli (F5)

1. VS Code'un sol tarafındaki "Run and Debug" sekmesine tıklayın (Ctrl+Shift+D)
2. Açılır menüden istediğiniz yapılandırmayı seçin:
   - `Expo: Start` - Geliştirme sunucusunu başlat
   - `Expo: Android` - Android'de çalıştır
   - `Expo: iOS` - iOS'ta çalıştır
   - `Expo: Web` - Web'de çalıştır
3. Yeşil "Play" butonuna tıklayın

## Expo Go ile Test Etme

1. Mobil cihazınıza Expo Go uygulamasını yükleyin:
   - [Android - Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/us/app/expo-go/id982107779)

2. Terminal'de `npm start` komutuyla development server'ı başlatın

3. QR kodu tarayın:
   - **Android:** Expo Go uygulamasıyla QR kodu tarayın
   - **iOS:** Kamera uygulamasıyla QR kodu tarayın ve Expo Go'da açın

## Proje Yapısı

```
hell_yeah_app_rn/
├── .vscode/                    # VS Code yapılandırmaları
│   ├── settings.json           # Workspace ayarları
│   ├── launch.json             # Debug yapılandırmaları
│   ├── tasks.json              # Görev tanımları
│   └── extensions.json         # Önerilen eklentiler
├── src/
│   ├── config/
│   │   └── firebase.js         # Firebase yapılandırması
│   ├── screens/
│   │   └── CounterWithCamera.js # Ana ekran
│   ├── components/             # Yeniden kullanılabilir bileşenler
│   └── utils/
│       └── deviceInfo.js       # Cihaz bilgileri utility
├── App.js                      # Ana uygulama dosyası
├── app.json                    # Expo yapılandırması
├── package.json                # Bağımlılıklar
├── babel.config.js             # Babel yapılandırması
└── README.md                   # Bu dosya
```

## Önemli Dosyalar

### `src/config/firebase.js`
Firebase başlatma ve yapılandırma dosyası. Database ve Storage referanslarını export eder.

### `src/utils/deviceInfo.js`
Cihaz ID'sini almak için utility fonksiyonları. Firebase key'ler için güvenli ID üretir.

### `src/screens/CounterWithCamera.js`
Ana ekran bileşeni. Sayaç, kamera ve Firebase entegrasyonunu içerir.

## Kullanım

1. Uygulamayı başlattığınızda, Firebase'den mevcut sayaç değeri yüklenir
2. "Sayaç + Kamera Aç" butonuna basarak fotoğraf çekin
3. Fotoğraf çekildikten sonra sayaç otomatik olarak artar
4. "Fotoğrafı Firebase'e Yükle" butonuna basarak fotoğrafı Storage'a yükleyin
5. Sayaç değeri ve fotoğraf URL'si Firebase'e kaydedilir

## Build

### Android APK Oluşturma

```bash
npx expo build:android
```

veya EAS Build ile:

```bash
npx eas build --platform android
```

### iOS Build

```bash
npx expo build:ios
```

veya EAS Build ile:

```bash
npx eas build --platform ios
```

## Sorun Giderme

### Metro Bundler Cache Temizleme

```bash
npx expo start -c
```

### Node Modules Yeniden Yükleme

```bash
rm -rf node_modules
npm install
```

### Expo Cache Temizleme

```bash
expo r -c
```

### Firebase Bağlantı Sorunları

1. Firebase config bilgilerinin doğru olduğundan emin olun
2. Firebase Console'da Database ve Storage kurallarını kontrol edin
3. Internet bağlantınızı kontrol edin

### Kamera İzni Sorunları

1. Uygulama ayarlarından kamera iznini kontrol edin
2. `app.json` dosyasında kamera permission'ların ekli olduğundan emin olun

## Faydalı Komutlar

```bash
# Development server'ı başlat
npm start

# QR kodu göster
npx expo start

# Android'de çalıştır
npm run android

# iOS'ta çalıştır (Mac gerekli)
npm run ios

# Web'de çalıştır
npm run web

# Bağımlılıkları güncelle
npm update

# Cache temizle
npx expo start -c

# Expo doctor (sorun tespiti)
npx expo-doctor
```

## VS Code Eklentileri

Projeyi açtığınızda şu eklentileri yüklemeniz önerilir:

- **React Native Tools** - React Native geliştirme desteği
- **ES7+ React/Redux/React-Native snippets** - Code snippets
- **Prettier** - Code formatter
- **ESLint** - JavaScript linter
- **Error Lens** - Inline hata gösterimi
- **Auto Rename Tag** - HTML/JSX tag rename
- **Material Icon Theme** - Dosya ikonları

## Kısayollar

- **Ctrl+Shift+P** - Komut paleti
- **Ctrl+Shift+D** - Debug paneli
- **Ctrl+`** - Terminal aç/kapat
- **F5** - Debug başlat
- **Shift+F5** - Debug durdur

## Firebase Realtime Database Yapısı

```json
{
  "devices": {
    "device_id": {
      "counter": 5,
      "logs": {
        "timestamp_1": {
          "timestamp": "2024-01-01T12:00:00.000Z",
          "photoUrl": "https://firebasestorage.googleapis.com/..."
        }
      }
    }
  }
}
```

## Firebase Storage Yapısı

```
images/
  └── device_id/
      ├── 1704110400000.jpg
      ├── 1704110500000.jpg
      └── ...
```

## Lisans

Bu proje özel bir projedir.

## Daha Fazla Bilgi

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Express](https://www.reactnative.express/)
