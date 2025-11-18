import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyCA8VkKdG-gstNeUByWeFI4CAV_HXYLgkQ",
  authDomain: "hell-yeah-fd32f.firebaseapp.com",
  databaseURL: "https://hell-yeah-fd32f-default-rtdb.firebaseio.com",
  projectId: "hell-yeah-fd32f",
  storageBucket: "hell-yeah-fd32f.firebasestorage.app",
  messagingSenderId: "759199260044",
  appId: "1:759199260044:android:2e53863fc7a35cb9228aa9"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Auth'u React Native AsyncStorage persistence ile başlat
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Database ve Storage referanslarını export et
export const database = getDatabase(app);
export const storage = getStorage(app);
export default app;
