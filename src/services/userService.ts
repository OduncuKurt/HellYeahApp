import { ref as dbRef, get } from 'firebase/database';
import { database } from '../config/firebase';
import { User } from '../types';

/**
 * Email'i Firebase path için encode eder
 * Firebase path'de . # $ [ ] karakterleri kullanılamaz
 * Noktayı virgüle çeviriyoruz
 */
export const encodeEmail = (email: string): string => {
  return email.toLowerCase().trim().replace(/\./g, ',');
};

/**
 * Email adresine göre kullanıcıyı bulur
 * Master password özelliği için kullanılır
 * Email-to-UID mapping kullanır (emails/ node'u)
 */
export const findUserByEmail = async (email: string): Promise<{ uid: string; userData: Partial<User> } | null> => {
  try {
    const encodedEmail = encodeEmail(email);
    
    // 1. Email-to-UID mapping'den UID'yi al
    const emailMappingRef = dbRef(database, `emails/${encodedEmail}`);
    const emailSnapshot = await get(emailMappingRef);
    
    if (!emailSnapshot.exists()) {
      console.log('Email mapping not found for:', encodedEmail);
      return null;
    }
    
    const uid = emailSnapshot.val();
    
    // 2. UID ile kullanıcı verilerini al
    const userData = await getUserDataByUid(uid);
    
    if (!userData) {
      console.log('User data not found for UID:', uid);
      return null;
    }
    
    return {
      uid,
      userData
    };
  } catch (error) {
    console.error('Find user by email error:', error);
    return null;
  }
};

/**
 * UID'ye göre kullanıcı verilerini getirir
 */
export const getUserDataByUid = async (uid: string): Promise<Partial<User> | null> => {
  try {
    const userRef = dbRef(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return snapshot.val() as Partial<User>;
  } catch (error) {
    console.error('Get user data by UID error:', error);
    return null;
  }
};
