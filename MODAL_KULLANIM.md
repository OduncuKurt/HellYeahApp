# Custom Modal Kullanım Rehberi

## 🎨 Tasarım Kimliği

Projeniz için özel olarak tasarlanmış modern, minimalist ve animasyonlu modal sistemi.

## 📦 Kurulum

Modal sistemi zaten projenize entegre edildi:

- ✅ `CustomModal` component'i oluşturuldu
- ✅ `ModalContext` ve `useModal` hook'u eklendi
- ✅ `App.tsx`'e `ModalProvider` eklendi

## 🚀 Kullanım

### 1. Hook'u Import Edin

```typescript
import { useModal } from '../../contexts/ModalContext';
```

### 2. Hook'u Kullanın

```typescript
const { showSuccess, showError, showWarning, showConfirm } = useModal();
```

### 3. Modal Tiplerini Kullanın

#### ✅ Success Modal

```typescript
showSuccess('Başarılı', 'İşlem başarıyla tamamlandı!', () => {
  // Opsiyonel: Onaylandıktan sonra çalışacak kod
  console.log("Kullanıcı OK'e tıkladı");
});
```

#### ❌ Error Modal

```typescript
showError('Hata', 'İşlem sırasında bir hata oluştu.', () => {
  // Opsiyonel callback
});
```

#### ⚠️ Warning Modal

```typescript
showWarning('Uyarı', 'Bu işlem geri alınamaz!', () => {
  // Opsiyonel callback
});
```

#### ❓ Confirm Modal (İki Butonlu)

```typescript
showConfirm(
  'Emin misin?',
  'Bu işlemi gerçekleştirmek istediğine emin misin?',
  () => {
    // Evet butonuna tıklandığında
    console.log('Onaylandı');
  },
  () => {
    // Opsiyonel: İptal butonuna tıklandığında
    console.log('İptal edildi');
  }
);
```

## 📝 Gerçek Örnekler

### Logout İşlemi (ProfileScreen)

```typescript
const handleLogout = (): void => {
  showConfirm('Çıkış Yap', 'Çıkış yapmak istediğine emin misin?', async () => {
    await logout();
  });
};
```

### Başarılı Kayıt (RegisterScreen)

```typescript
const result = await register(email, password, username, displayName);
if (!result.success) {
  showError('Kayıt Hatası', result.error || 'Kayıt oluşturulamadı.');
} else {
  showSuccess('Başarılı', 'Hesabınız oluşturuldu!');
}
```

### Arkadaşlık İsteği (FriendsScreen)

```typescript
const result = await sendFriendRequest(...);
if (result.success) {
  showSuccess('Başarılı', 'Arkadaşlık isteği gönderildi!');
} else {
  showError('Hata', result.error || 'İstek gönderilemedi.');
}
```

### Guinness Seçimi (FeedScreen)

```typescript
showConfirm(
  'Guinness mu?',
  'Bu bir Guinness bira mı?',
  () => {
    // Evet - Guinness
    handleAddBeer(true);
  },
  () => {
    // Hayır - Normal bira
    handleAddBeer(false);
  }
);
```

### Yorum Silme (BeerDetailScreen)

```typescript
const handleDeleteComment = (commentId: string) => {
  showConfirm('Yorumu Sil', 'Bu yorumu silmek istediğine emin misin?', async () => {
    const result = await deleteComment(beerId, commentId);
    if (result.success) {
      showSuccess('Başarılı', 'Yorum silindi.');
      loadBeer();
    } else {
      showError('Hata', result.error || 'Yorum silinemedi.');
    }
  });
};
```

## 🎨 Modal Tipleri ve Renkleri

| Tip       | İkon | Renk              | Kullanım                 |
| --------- | ---- | ----------------- | ------------------------ |
| `success` | ✓    | Yeşil (#34C759)   | Başarılı işlemler        |
| `error`   | ✕    | Kırmızı (#FF3B30) | Hata mesajları           |
| `warning` | ⚠    | Turuncu (#FF9500) | Uyarılar                 |
| `confirm` | ?    | Primary           | Onay gerektiren işlemler |
| `info`    | ℹ    | Mavi (#007AFF)    | Bilgilendirme            |

## 🔧 Gelişmiş Kullanım

### Custom İkon ve Metin

```typescript
const { showModal } = useModal();

showModal({
  type: 'success',
  title: 'Özel Başlık',
  message: 'Özel mesaj',
  icon: '🎉', // Custom emoji icon
  confirmText: 'Harika!',
  cancelText: 'Kapat',
  onConfirm: () => console.log('Confirmed'),
  onCancel: () => console.log('Cancelled'),
});
```

## ✨ Özellikler

- ✅ **Animasyonlu**: Spring animation ile smooth açılış/kapanış
- ✅ **Tema Desteği**: Light/Dark mode otomatik uyum
- ✅ **Responsive**: Tüm ekran boyutlarında çalışır
- ✅ **Kolay Kullanım**: Tek satırda modal gösterme
- ✅ **Tip Güvenli**: TypeScript desteği
- ✅ **Tutarlı Tasarım**: Projenin tasarım diline uygun

## 🔄 Alert'ten Geçiş

### Eski Yöntem (Alert)

```typescript
Alert.alert('Başlık', 'Mesaj', [
  { text: 'İptal', style: 'cancel' },
  { text: 'Tamam', onPress: () => console.log('OK') },
]);
```

### Yeni Yöntem (Custom Modal)

```typescript
showConfirm('Başlık', 'Mesaj', () => console.log('OK'));
```

## 📱 Platform Desteği

- ✅ iOS
- ✅ Android
- ✅ Web

## 🎯 Yapılacaklar

Tüm `Alert.alert` kullanımlarını custom modal ile değiştirin:

- [x] ProfileScreen - Logout
- [ ] FeedScreen - Guinness seçimi
- [ ] FeedScreen - Kamera izni
- [ ] BeerDetailScreen - Yorum silme
- [ ] BeerDetailScreen - Bira silme
- [ ] FriendsScreen - Arkadaş ekleme/silme
- [ ] RegisterScreen - Kayıt mesajları
- [ ] LoginScreen - Giriş hataları
- [ ] ForgotPasswordScreen - Şifre sıfırlama

## 💡 İpuçları

1. **Kısa ve Öz**: Başlıkları kısa tutun (max 2-3 kelime)
2. **Açıklayıcı**: Mesajları net ve anlaşılır yazın
3. **Doğru Tip**: İşleme uygun modal tipini seçin
4. **Callback**: Önemli işlemlerde callback kullanın
5. **Tutarlılık**: Benzer işlemler için benzer mesajlar kullanın
