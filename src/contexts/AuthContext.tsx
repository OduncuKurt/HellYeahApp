import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { get, ref, set } from 'firebase/database';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth, database } from '../config/firebase';
import { AuthContextType, AuthResult, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    // Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Kullanıcı giriş yapmış
        const userData = await getUserData(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: userData?.username || '',
          displayName: firebaseUser.displayName || userData?.displayName || '',
          avatar: userData?.avatar || '🍺',
          totalBeers: userData?.totalBeers || 0,
          totalGuinnessBeers: userData?.totalGuinnessBeers || 0, // NEW
          beersByYear: userData?.beersByYear || {},
          guinnessByYear: userData?.guinnessByYear || {}, // NEW
          friends: userData?.friends || {},
          createdAt: userData?.createdAt || new Date().toISOString(),
        });
      } else {
        // Kullanıcı çıkış yapmış
        setUser(null);
      }

      if (initializing) {
        setInitializing(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Firebase'den kullanıcı verilerini al
  const getUserData = async (userId: string): Promise<Partial<User> | null> => {
    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return snapshot.val() as Partial<User>;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Kullanıcı adı kontrolü
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const usernameRef = ref(database, `usernames/${username.toLowerCase()}`);
      const snapshot = await get(usernameRef);
      return !snapshot.exists();
    } catch (error) {
      console.error('Username check error:', error);
      return false;
    }
  };

  // Kayıt ol
  const register = async (email: string, password: string, username: string, displayName: string): Promise<AuthResult> => {
    try {
      setLoading(true);

      // Username kontrolü
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        return { success: false, error: 'Bu kullanıcı adı zaten alınmış.' };
      }

      // Firebase Auth ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;

      // Display name güncelle
      await updateProfile(userCredential.user, { displayName });

      // Username'i kaydet (lowercase olarak)
      const usernameRef = ref(database, `usernames/${username.toLowerCase()}`);
      await set(usernameRef, uid);

      // Kullanıcı verisini database'e kaydet
      const userRef = ref(database, `users/${uid}`);
      const userData: Omit<User, 'uid' | 'email'> = {
        username: username.toLowerCase(),
        displayName,
        avatar: '🍺', // Default avatar
        totalBeers: 0,
        totalGuinnessBeers: 0, // NEW
        beersByYear: {},
        guinnessByYear: {}, // NEW
        friends: {},
        createdAt: new Date().toISOString(),
      };
      await set(userRef, userData);

      // State'i güncelle
      setUser({
        uid,
        email, // Email from Firebase Auth
        ...userData,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Giriş yap
  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Giriş yapılamadı. Lütfen tekrar deneyin.';
      if (
        error.code === 'auth/invalid-login-credentials' || 
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/user-not-found'
      ) {
        errorMessage = 'E-posta veya şifre hatalı.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla başarısız deneme yapıldı. Lütfen daha sonra tekrar deneyin.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz bir e-posta adresi girdiniz.';
      } else if (error.message) {
        // Diğer hatalar için (Firebase yazısını temizleyerek)
        errorMessage = error.message.replace('Firebase: ', '');
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yap
  const logout = async (): Promise<AuthResult> => {
    try {
      setLoading(true);
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      setUser(null);
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Şifre sıfırlama
  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  };

  // Kullanıcı verilerini yenile
  const refreshUserData = async (): Promise<void> => {
    if (user?.uid) {
      const userData = await getUserData(user.uid);
      setUser({
        ...user,
        ...userData,
      } as User);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    initializing,
    register,
    login,
    logout,
    resetPassword,
    checkUsernameAvailability,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
