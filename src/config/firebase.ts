import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCA8VkKdG-gstNeUByWeFI4CAV_HXYLgkQ",
  authDomain: "hell-yeah-fd32f.firebaseapp.com",
  databaseURL: "https://hell-yeah-fd32f-default-rtdb.firebaseio.com",
  projectId: "hell-yeah-fd32f",
  storageBucket: "hell-yeah-fd32f.firebasestorage.app",
  messagingSenderId: "759199260044",
  appId: "1:759199260044:android:2e53863fc7a35cb9228aa9"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

export { auth };
export const database = getDatabase(app);
export const storage = getStorage(app);
export default app;
