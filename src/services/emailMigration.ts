import { ref as dbRef, get, set } from 'firebase/database';
import { database } from '../config/firebase';
import { encodeEmail } from './userService';

/**
 * Mevcut kullanıcılar için email-to-UID mapping oluşturur
 * Bu fonksiyon sadece bir kere çalıştırılmalı (migration için)
 * 
 * KULLANIM:
 * 1. Bu dosyayı import edin
 * 2. migrateEmailMappings() fonksiyonunu çağırın
 * 3. Migration tamamlandıktan sonra bu kodu silebilirsiniz
 */
export const migrateEmailMappings = async (): Promise<{ success: boolean; migratedCount: number; error?: string }> => {
  try {
    console.log('Starting email mapping migration...');
    
    // Tüm users'ı al
    const usersRef = dbRef(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      return { success: false, migratedCount: 0, error: 'No users found' };
    }
    
    const usersData = snapshot.val();
    let migratedCount = 0;
    
    // Her kullanıcı için email mapping oluştur
    for (const uid in usersData) {
      const userData = usersData[uid];
      
      if (userData.email) {
        // Email'i encode et (nokta -> virgül)
        const encodedEmail = encodeEmail(userData.email);
        const emailMappingRef = dbRef(database, `emails/${encodedEmail}`);
        
        // Email mapping'i kaydet
        await set(emailMappingRef, uid);
        migratedCount++;
        
        console.log(`Migrated email mapping for: ${encodedEmail} -> ${uid}`);
      } else {
        console.warn(`User ${uid} has no email, skipping...`);
      }
    }
    
    console.log(`Migration completed! Migrated ${migratedCount} email mappings.`);
    return { success: true, migratedCount };
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return { success: false, migratedCount: 0, error: error.message };
  }
};
