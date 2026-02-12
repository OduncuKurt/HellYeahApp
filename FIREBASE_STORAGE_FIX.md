# Firebase Storage Kuralları - Manuel Kurulum

## 🚨 HATA: storage/unauthorized

Bu hata, Firebase Storage kurallarının henüz deploy edilmediği anlamına gelir.

## ✅ Çözüm: Manuel Kurulum (5 dakika)

### Adım 1: Firebase Console'u Aç

1. https://console.firebase.google.com/ adresine git
2. Projenizi seçin

### Adım 2: Storage'ı Kontrol Et

1. Sol menüden **Build** → **Storage** seç
2. Eğer Storage başlatılmamışsa:
   - **Get Started** butonuna tıkla
   - **Start in production mode** seç
   - Location seç (örn: europe-west1)
   - **Done** tıkla

### Adım 3: Kuralları Ekle

1. Storage sayfasında **Rules** sekmesine tıkla
2. Aşağıdaki kuralları kopyala ve yapıştır:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Avatar fotoğrafları için kurallar
    match /avatars/{fileName} {
      // Herkes okuyabilir (profil fotoğraflarını görmek için)
      allow read: if true;

      // Sadece giriş yapmış kullanıcılar yazabilir
      // Dosya boyutu max 5MB olmalı
      // Sadece image dosyaları kabul edilir
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Beer fotoğrafları için kurallar
    match /beers/{fileName} {
      // Herkes okuyabilir
      allow read: if true;

      // Sadece giriş yapmış kullanıcılar yazabilir
      // Dosya boyutu max 10MB olmalı
      // Sadece image dosyaları kabul edilir
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

3. **Publish** butonuna tıkla
4. ✅ Tamamlandı!

### Adım 4: Test Et

1. Uygulamayı yeniden başlat
2. Profil fotoğrafı eklemeyi dene
3. Artık çalışmalı! 🎉

---

## 🔍 Sorun Devam Ederse

### Kontrol 1: Auth Durumu

- Kullanıcı giriş yapmış mı?
- Firebase Authentication çalışıyor mu?

### Kontrol 2: Storage Rules

- Firebase Console → Storage → Rules
- Kurallar yayınlandı mı? (Published yazmalı)

### Kontrol 3: Storage Location

- Firebase Console → Storage → Files
- Bucket adı doğru mu?

---

**NOT:** Storage kuralları olmadan profil fotoğrafı yüklenemez!
