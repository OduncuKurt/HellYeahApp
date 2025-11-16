import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getReactNativePersistence, initializeAuth, Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCA8VkKdG-gstNeUByWeFI4CAV_HXYLgkQ",
  authDomain: "hell-yeah-fd32f.firebaseapp.com",
  databaseURL: "https://hell-yeah-fd32f-default-rtdb.firebaseio.com",
  projectId: "hell-yeah-fd32f",
  storageBucket: "hell-yeah-fd32f.firebasestorage.app",
  messagingSenderId: "759199260044",
  appId: "1:759199260044:android:2e53863fc7a35cb9228aa9"
};

// Firebase'in birden fazla kez initialize olmasını önle
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} else {
  app = getApps()[0];
  console.log('✅ Using existing Firebase app');
}

// React Native için Auth'u AsyncStorage persistence ile initialize et
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
} catch (error: any) {
  console.log('⚠️ Auth already initialized, using existing instance');
  // Auth zaten initialize edilmişse, getAuth kullan
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}

export { auth };

export const database: Database = getDatabase(app);
export const storage: FirebaseStorage = getStorage(app);
