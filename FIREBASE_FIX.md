# Firebase Permission Denied Hatası Çözümü

## Sorun

Arkadaş ekleme işleminde "Permission denied" hatası alıyorsunuz.

## Neden Oluyor?

Firebase Realtime Database güvenlik kurallarınız `friendRequests` path'ine yazma izni vermiyor.

## Çözüm Adımları

### 1. Firebase Console'a Giriş

1. Tarayıcınızda https://console.firebase.google.com/ adresine gidin
2. **hell-yeah-fd32f** projenizi seçin

### 2. Realtime Database Güvenlik Kurallarını Güncelleme

1. Sol menüden **"Build"** > **"Realtime Database"** seçin
2. Üst menüden **"Rules"** (Kurallar) sekmesine tıklayın
3. Mevcut kuralları silin ve aşağıdaki kuralları yapıştırın:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid",
        "friends": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    },
    "usernames": {
      ".read": true,
      "$username": {
        ".write": "auth != null && !data.exists()"
      }
    },
    "beers": {
      ".read": "auth != null",
      "$beerId": {
        ".write": "auth != null"
      }
    },
    "friendRequests": {
      "$toUserId": {
        ".read": "$toUserId === auth.uid || auth != null",
        "$fromUserId": {
          ".write": "auth != null && ($fromUserId === auth.uid || $toUserId === auth.uid)"
        }
      }
    }
  }
}
```

4. **"Publish"** (Yayınla) butonuna tıklayın
5. Onay mesajını bekleyin

### 3. Uygulamayı Test Etme

1. Uygulamayı tamamen kapatın
2. Uygulamayı yeniden başlatın
3. Arkadaş ekleme işlemini tekrar deneyin

### 4. Debug Loglarını Kontrol Etme

Konsolda şu logları göreceksiniz:

- 🔐 **Auth Status**: Kullanıcının oturum açıp açmadığını gösterir
- 🎫 **Auth Token**: Token'ın geçerli olup olmadığını gösterir
- 🔍 **Friend Request Debug**: İstek detaylarını gösterir
- 📤 **Sending friend request**: Firebase path'ini gösterir
- ✅ **Success**: İşlem başarılı olduğunda
- ❌ **Error**: Hata detaylarını gösterir

## Önemli Notlar

### Güvenlik Kuralları Açıklaması

- **users**: Kullanıcılar kendi profillerini okuyabilir ve yazabilir
- **friends**: Tüm oturum açmış kullanıcılar arkadaş listelerini okuyabilir ve yazabilir
- **usernames**: Tüm oturum açmış kullanıcılar username'leri okuyabilir, sadece mevcut olmayanları yazabilir
- **beers**: Tüm oturum açmış kullanıcılar beer'ları okuyabilir ve yazabilir
- **friendRequests**: Kullanıcılar sadece kendilerine gelen istekleri okuyabilir, kendi gönderdikleri veya kendilerine gelen istekleri yazabilir

### Hala Sorun Yaşıyorsanız

1. **Kullanıcı Oturumu**: Uygulamadan çıkış yapıp tekrar giriş yapın
2. **Cache Temizleme**: Uygulamayı tamamen kapatıp yeniden başlatın
3. **Firebase Bağlantısı**: İnternet bağlantınızı kontrol edin
4. **Debug Logları**: Konsol loglarını kontrol edin ve hatayı paylaşın

### Alternatif: Firebase CLI ile Deploy

Eğer Firebase CLI kullanıyorsanız:

```bash
# Firebase CLI'yi yükleyin (eğer yoksa)
npm install -g firebase-tools

# Firebase'e giriş yapın
firebase login

# Projeyi başlatın
firebase init database

# database.rules.json dosyasını deploy edin
firebase deploy --only database
```

## Ek Bilgiler

### Username Boş Sorunu

Debug loglarında `fromUsername` boş görünüyor. Bu, kullanıcı verisinde bir sorun olduğunu gösterebilir. Eğer sorun devam ederse:

1. Firebase Console > Realtime Database > Data sekmesi
2. `users/{yourUserId}` path'ine gidin
3. `username` field'ının dolu olduğundan emin olun

### Firebase Console Erişim Kontrolü

Eğer Firebase Console'a erişiminiz yoksa:

- Proje sahibinden admin yetkisi isteyin
- Veya proje sahibinden güvenlik kurallarını güncellemesini isteyin
