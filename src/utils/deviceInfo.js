import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Cihaz ID'sini al
 * Flutter projesindeki getDeviceId fonksiyonunun karşılığı
 */
export const getDeviceId = async () => {
  try {
    // Android için
    if (Platform.OS === 'android') {
      const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown_android';
      // Firebase Realtime Database için nokta karakterlerini değiştir
      return deviceId.replace(/\./g, '_');
    }

    // iOS için
    if (Platform.OS === 'ios') {
      const deviceId = await Device.getIosIdForVendorAsync() || 'unknown_ios';
      return deviceId.replace(/\./g, '_');
    }

    // Web veya diğer platformlar için
    return 'unknown_platform';
  } catch (error) {
    console.error('Cihaz ID alınırken hata:', error);
    return 'unknown_device';
  }
};

/**
 * Güvenli device ID - Firebase key olarak kullanılabilir
 */
export const getSafeDeviceId = async () => {
  const deviceId = await getDeviceId();
  // Firebase key'lerde kullanılamayan karakterleri değiştir
  return deviceId.replace(/[.#$\[\]]/g, '_');
};
