import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { ref, get, update, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../config/firebase';
import { getSafeDeviceId } from '../utils/deviceInfo';

export default function CounterWithCamera() {
  const [counter, setCounter] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  // Uygulamayı başlat - Firebase'den sayaç değerini al
  const initializeApp = async () => {
    try {
      // Kamera izni iste
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Kamera kullanımı için izin gereklidir.');
      }

      // Cihaz ID'sini al
      const id = await getSafeDeviceId();
      setDeviceId(id);

      // Firebase'den sayaç değerini yükle
      await loadCounterFromFirebase(id);
    } catch (error) {
      console.error('Uygulama başlatma hatası:', error);
      Alert.alert('Hata', 'Uygulama başlatılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Firebase'den sayaç değerini yükle
  const loadCounterFromFirebase = async (id) => {
    try {
      const dbRef = ref(database, `devices/${id}/counter`);
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        setCounter(snapshot.val());
      } else {
        // Sayaç yoksa 0 olarak başlat
        const deviceRef = ref(database, `devices/${id}`);
        await set(deviceRef, { counter: 0 });
        setCounter(0);
      }
    } catch (error) {
      console.error('Sayaç yükleme hatası:', error);
      Alert.alert('Hata', 'Sayaç değeri yüklenirken hata oluştu.');
    }
  };

  // Fotoğraf çek
  const capturePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
        // Sayacı artır
        setCounter((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Fotoğraf çekme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  // Fotoğrafı Firebase Storage'a yükle ve sayacı güncelle
  const uploadPhotoToFirebase = async () => {
    if (!capturedImage || !deviceId) {
      Alert.alert('Uyarı', 'Yüklenecek fotoğraf bulunamadı.');
      return;
    }

    setUploading(true);

    try {
      // Fotoğrafı blob'a çevir
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Firebase Storage'a yükle
      const fileName = `${Date.now()}.jpg`;
      const imageRef = storageRef(storage, `images/${deviceId}/${fileName}`);
      await uploadBytes(imageRef, blob);

      // Download URL al
      const downloadURL = await getDownloadURL(imageRef);
      console.log('Fotoğraf yüklendi:', downloadURL);

      // Firebase Realtime Database'i güncelle
      const deviceRef = ref(database, `devices/${deviceId}`);
      await update(deviceRef, {
        counter: counter,
      });

      // Log ekle
      const logRef = ref(database, `devices/${deviceId}/logs/${Date.now()}`);
      await set(logRef, {
        timestamp: new Date().toISOString(),
        photoUrl: downloadURL,
      });

      Alert.alert('Başarılı', 'Fotoğraf yüklendi ve sayaç güncellendi!');
      setCapturedImage(null);
    } catch (error) {
      console.error('Yükleme hatası:', error);
      Alert.alert('Hata', `Fotoğraf yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sayaç & Kamera</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Sayaç değeri:</Text>
          <Text style={styles.counterText}>{counter}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={capturePhoto}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Sayaç + Kamera Aç</Text>
          </TouchableOpacity>

          {capturedImage && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: capturedImage }} style={styles.image} />
              <TouchableOpacity
                style={[styles.button, styles.uploadButton]}
                onPress={uploadPhotoToFirebase}
                disabled={uploading}
                activeOpacity={0.7}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Fotoğrafı Firebase'e Yükle</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {deviceId && (
            <Text style={styles.deviceIdText}>Cihaz ID: {deviceId}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  label: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  counterText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  imageContainer: {
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#34C759',
  },
  deviceIdText: {
    marginTop: 30,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
