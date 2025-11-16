# Firebase Authentication Kurulumu

## ⚠️ ÖNEMLİ: Firebase Console Ayarları

Uygulamayı çalıştırmadan önce Firebase Console'da Authentication'ı aktif etmelisiniz!

### Adımlar:

1. **Firebase Console'a gidin**: https://console.firebase.google.com
2. **Projenizi seçin**: "hell-yeah-fd32f"
3. **Sol menüden "Authentication"a tıklayın**
4. **"Get Started" butonuna basın**
5. **"Sign-in method" sekmesine gidin**
6. **"Email/Password"ı aktif edin**:
   - Email/Password satırına tıkla
   - Toggle'ı açık konuma getir (Enable)
   - "Save" butonuna bas

### Tamamlandı! 🎉

Artık uygulama kullanıcı kaydı ve girişi yapabilir.

---

## 🎯 Faz 1 Tamamlandı!

### ✅ Eklenen Özellikler:

1. **Kullanıcı Sistemi**
   - Email/Password ile kayıt ol
   - Giriş yap
   - Çıkış yap
   - Otomatik oturum hatırlama

2. **Modern UI/UX**
   - Dark theme
   - Güzel animasyonlar
   - Loading states
   - Form validation

3. **Firebase Entegrasyonu**
   - Firebase Authentication
   - User data'yı Realtime Database'e kaydetme
   - Güvenli auth flow

### 📱 Ekran Yapısı:

```
AuthStack (Giriş yapmadıysa)
├── Login Screen
└── Register Screen

MainStack (Giriş yaptıysa)
└── GroupList Screen (şimdilik boş)
```

---

## 📦 Sonraki Adım: Grup Sistemi

Sırada:
1. Grup oluşturma ekranı
2. Invite code generation
3. Gruba katılma (deep linking)
4. Grup listesi
5. Grup detay sayfası

---

## 🚀 Test Etmek İçin:

```bash
npm start
```

1. Expo Go ile QR kodu okut
2. "Hesap Oluştur" butonuna bas
3. Bilgilerini gir ve kayıt ol
4. Giriş yap!
