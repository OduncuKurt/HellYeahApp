import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { User, AuthContextType, AuthResult } from '../types';

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
          displayName: firebaseUser.displayName || userData?.displayName || '',
          avatar: userData?.avatar || '🍺',
          totalBeers: userData?.totalBeers || 0,
          createdAt: userData?.createdAt || new Date().toISOString(),
          groups: userData?.groups || {},
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

  // Kayıt ol
  const register = async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    try {
      setLoading(true);

      // Firebase Auth ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;

      // Display name güncelle
      await updateProfile(userCredential.user, { displayName });

      // Kullanıcı verisini database'e kaydet
      const userRef = ref(database, `users/${uid}`);
      const userData: Omit<User, 'uid' | 'email'> = {
        displayName,
        avatar: '🍺', // Default avatar
        totalBeers: 0,
        createdAt: new Date().toISOString(),
        groups: {},
      };
      await set(userRef, userData);

      // State'i güncelle
      setUser({
        uid,
        email,
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
      return { success: false, error: error.message };
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
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
