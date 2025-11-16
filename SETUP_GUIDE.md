# Hell Yeah App - Hızlı Başlangıç Kılavuzu

Bu doküman projenin hızlı bir şekilde kurulması ve çalıştırılması için adım adım talimatlar içerir.

## 🚀 Hızlı Başlangıç (5 Dakika)

### Adım 1: Bağımlılıkları Yükle

```bash
cd hell_yeah_app_rn
npm install
```

### Adım 2: Firebase Config'i Güncelle

Firebase yapılandırması zaten `src/config/firebase.js` dosyasında mevcut. Eğer kendi Firebase projenizi kullanmak isterseniz config bilgilerini güncelleyin.

### Adım 3: Uygulamayı Başlat

```bash
npm start
```

### Adım 4: Cihazda Test Et

- **Android:** Expo Go uygulamasını yükleyin ve QR kodu tarayın
- **iOS:** Kamera ile QR kodu tarayın ve Expo Go'da açın
- **Web:** Terminal'de `w` tuşuna basın

## 📱 VS Code'da Geliştirme

### İlk Açılış

1. Projeyi VS Code'da açın:
   ```bash
   code .
   ```

2. Önerilen eklentileri yükleyin (sağ altta bildirim çıkacak)

3. Terminal'i açın: **Ctrl+`**

4. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

### Çalıştırma Yöntemleri

#### Yöntem 1: Terminal (Önerilen)
```bash
npm start
```

#### Yöntem 2: VS Code Tasks
1. **Ctrl+Shift+P** tuşlarına basın
2. "Tasks: Run Task" yazın
3. "Expo: Start" seçin

#### Yöntem 3: Debug Panel
1. **F5** tuşuna basın
2. "Expo: Start" seçin

## 🔧 Geliştirme İpuçları

### Hot Reload
Kod değişiklikleriniz otomatik olarak yansır. Dosyayı kaydettiğinizde (**Ctrl+S**) uygulama güncellenir.

### Cache Temizleme
Eğer değişiklikler yansımıyorsa:
```bash
npm start -- -c
```
veya VS Code'da "Expo: Start (Clear Cache)" task'ını çalıştırın.

### Kısayollar
- **m** - Dev menüyü aç/kapat
- **r** - Uygulamayı reload et
- **a** - Android'de çalıştır
- **i** - iOS'ta çalıştır
- **w** - Web'de çalıştır

## 🐛 Sık Karşılaşılan Sorunlar

### Problem: Metro Bundler başlamıyor
**Çözüm:**
```bash
npx expo start -c
```

### Problem: Firebase bağlantı hatası
**Çözüm:**
1. `src/config/firebase.js` dosyasındaki config'i kontrol edin
2. Firebase Console'da Database ve Storage'ın aktif olduğundan emin olun

### Problem: Kamera açılmıyor
**Çözüm:**
1. Telefon ayarlarından uygulama izinlerini kontrol edin
2. Expo Go uygulamasının kamera izninin olduğundan emin olun

### Problem: Module not found hatası
**Çözüm:**
```bash
rm -rf node_modules
npm install
```

## 📦 Production Build

### Android APK (EAS Build)

1. EAS CLI'yi yükleyin:
   ```bash
   npm install -g eas-cli
   ```

2. Giriş yapın:
   ```bash
   eas login
   ```

3. Projeyi yapılandırın:
   ```bash
   eas build:configure
   ```

4. Build'i başlatın:
   ```bash
   eas build --platform android
   ```

### iOS Build (Mac gerekli)

```bash
eas build --platform ios
```

## 🎯 Sonraki Adımlar

1. ✅ Projeyi VS Code'da açın
2. ✅ Bağımlılıkları yükleyin
3. ✅ Firebase config'i güncelleyin (isteğe bağlı)
4. ✅ Uygulamayı başlatın
5. ✅ Expo Go ile test edin
6. 🎉 Geliştirmeye başlayın!

## 📚 Faydalı Linkler

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [React Native Express](https://www.reactnative.express/)

## 💡 Pro İpuçları

1. **VS Code Extensions:** Önerilen eklentileri mutlaka yükleyin
2. **Format on Save:** `settings.json` içinde zaten aktif
3. **ESLint:** Kod kalitesi için otomatik kontrol yapılır
4. **Prettier:** Kod formatlaması otomatik
5. **Error Lens:** Hatalar satır içinde gösterilir

## 🎨 Proje Özelleştirme

### Uygulama Adı ve İkon
`app.json` dosyasını düzenleyin:
```json
{
  "expo": {
    "name": "Yeni Uygulama Adı",
    "slug": "yeni-slug",
    "icon": "./assets/icon.png"
  }
}
```

### Renkler ve Stiller
`src/screens/CounterWithCamera.js` dosyasındaki `styles` objesini düzenleyin.

Keyifli kodlamalar! 🚀
