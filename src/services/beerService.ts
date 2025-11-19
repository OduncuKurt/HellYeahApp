import { ref as dbRef, push, set, get, update, increment } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../../firebaseConfig';
import { Beer } from '../types';

/**
 * Yeni bira ekler (fotoğraf ile)
 */
export const addBeer = async (
  groupId: string,
  userId: string,
  userName: string,
  userAvatar: string,
  photoUri: string
): Promise<{ success: boolean; beerId?: string; error?: string }> => {
  try {
    // 1. Fotoğrafı Firebase Storage'a yükle
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}.jpg`;
    const photoPath = `beers/${groupId}/${filename}`;

    // Fotoğraf blob'unu oluştur
    const response = await fetch(photoUri);
    const blob = await response.blob();

    // Storage'a yükle
    const photoStorageRef = storageRef(storage, photoPath);
    await uploadBytes(photoStorageRef, blob);

    // Download URL al
    const photoUrl = await getDownloadURL(photoStorageRef);

    // 2. Bira verisini oluştur
    const beersRef = dbRef(database, `groups/${groupId}/beers`);
    const newBeerRef = push(beersRef);
    const beerId = newBeerRef.key!;

    const beerData: Omit<Beer, 'id'> = {
      userId,
      userName,
      userAvatar,
      photoUrl,
      timestamp,
    };

    await set(newBeerRef, beerData);

    // 3. Kullanıcının bira sayısını artır
    const memberBeerCountRef = dbRef(database, `groups/${groupId}/members/${userId}/beerCount`);
    await set(memberBeerCountRef, increment(1));

    // 4. Grup toplam bira sayısını artır
    const groupTotalBeersRef = dbRef(database, `groups/${groupId}/totalBeers`);
    await set(groupTotalBeersRef, increment(1));

    // 5. Kullanıcının toplam bira sayısını artır (global)
    const userTotalBeersRef = dbRef(database, `users/${userId}/totalBeers`);
    await set(userTotalBeersRef, increment(1));

    return { success: true, beerId };
  } catch (error: any) {
    console.error('Add beer error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gruptaki tüm biraları getirir
 */
export const getGroupBeers = async (groupId: string): Promise<Beer[]> => {
  try {
    const beersRef = dbRef(database, `groups/${groupId}/beers`);
    const snapshot = await get(beersRef);

    if (!snapshot.exists()) {
      return [];
    }

    const beersData = snapshot.val();
    const beers: Beer[] = Object.keys(beersData).map((beerId) => ({
      id: beerId,
      ...beersData[beerId],
    }));

    // Zamana göre sırala (yeniden eskiye)
    return beers.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Get group beers error:', error);
    return [];
  }
};

/**
 * Bira siler (sadece kendi birasını silebilir)
 */
export const deleteBeer = async (
  groupId: string,
  beerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Bira sahibini kontrol et
    const beerRef = dbRef(database, `groups/${groupId}/beers/${beerId}`);
    const snapshot = await get(beerRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'Bira bulunamadı.' };
    }

    const beerData = snapshot.val();
    if (beerData.userId !== userId) {
      return { success: false, error: 'Sadece kendi biranı silebilirsin.' };
    }

    // Bira sil
    await set(beerRef, null);

    // Sayaçları azalt
    const memberBeerCountRef = dbRef(database, `groups/${groupId}/members/${userId}/beerCount`);
    await set(memberBeerCountRef, increment(-1));

    const groupTotalBeersRef = dbRef(database, `groups/${groupId}/totalBeers`);
    await set(groupTotalBeersRef, increment(-1));

    const userTotalBeersRef = dbRef(database, `users/${userId}/totalBeers`);
    await set(userTotalBeersRef, increment(-1));

    return { success: true };
  } catch (error: any) {
    console.error('Delete beer error:', error);
    return { success: false, error: error.message };
  }
};
