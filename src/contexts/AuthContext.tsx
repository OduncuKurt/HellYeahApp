import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ActionCodeSettings,
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    onAuthStateChanged,
    reload,
    sendEmailVerification,
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
  const [emailVerified, setEmailVerified] = useState<boolean>(false);

  // Hell Yeah markasına uygun action code settings
  const actionCodeSettings: ActionCodeSettings = {
    url: 'https://hell-yeah-fd32f.firebaseapp.com/__/auth/action',
    handleCodeInApp: false,
  };

  useEffect(() => {
    // Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Email doğrulama durumunu güncelle
        setEmailVerified(firebaseUser.emailVerified);
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
        setEmailVerified(false);
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

      // FIX 3.2: Username normalizasyonu ve doğrulaması
      const normalizedUsername = username.trim().toLowerCase();
      
      // Format doğrulaması: sadece a-z, 0-9, nokta ve alt çizgi
      if (!/^[a-z0-9._]+$/.test(normalizedUsername)) {
        return { success: false, error: 'Kullanıcı adı sadece harf (a-z), rakam, nokta ve alt çizgi içerebilir.' };
      }
      if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
        return { success: false, error: 'Kullanıcı adı 3-30 karakter arasında olmalıdır.' };
      }

      // Username kontrolü
      const isAvailable = await checkUsernameAvailability(normalizedUsername);
      if (!isAvailable) {
        return { success: false, error: 'Bu kullanıcı adı zaten alınmış.' };
      }

      // Firebase Auth ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;

      // Display name güncelle
      await updateProfile(userCredential.user, { displayName });

      // Email doğrulama emaili gönder (Hell Yeah markasına uygun)
      try {
        await sendEmailVerification(userCredential.user, actionCodeSettings);
      } catch (verifyError) {
        // Email gönderilemese bile kayıt tamamlansın
        console.warn('Email verification send failed:', verifyError);
      }

      // Username'i kaydet (normalize edilmiş)
      const usernameRef = ref(database, `usernames/${normalizedUsername}`);
      await set(usernameRef, uid);

      // Kullanıcı verisini database'e kaydet
      const userRef = ref(database, `users/${uid}`);
      const userData: Omit<User, 'uid' | 'email'> = {
        username: normalizedUsername,
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
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  };

  // Doğrulama emailini tekrar gönder
  const resendVerificationEmail = async (): Promise<AuthResult> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'Kullanıcı oturumu bulunamadı.' };
      }
      // Önce en güncel durumu al
      await reload(currentUser);
      if (currentUser.emailVerified) {
        setEmailVerified(true);
        return { success: true };
      }
      await sendEmailVerification(currentUser, actionCodeSettings);
      return { success: true };
    } catch (error: any) {
      console.error('Resend verification error:', error);
      // Firebase rate limit hatası
      if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin.' };
      }
      return { success: false, error: 'Email gönderilemedi. Lütfen tekrar deneyin.' };
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

  // Email doğrulama durumunu manuel kontrol et (polling için)
  // FIX C-06: Token refresh ile doğrulama state'ini güvenilir şekilde güncelle
  const checkEmailVerified = async (): Promise<boolean> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      await reload(currentUser);
      const verified = currentUser.emailVerified;
      setEmailVerified(verified);
      
      // Doğrulandıysa token'ı yenile — backend kuralları güncel token'a ihtiyaç duyar
      if (verified) {
        await currentUser.getIdToken(true); // force refresh
      }
      
      return verified;
    } catch {
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    initializing,
    emailVerified,
    register,
    login,
    logout,
    resetPassword,
    resendVerificationEmail,
    checkUsernameAvailability,
    refreshUserData,
    checkEmailVerified,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
