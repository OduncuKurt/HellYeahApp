import { ref as dbRef, get, increment, push, set, query, orderByChild, limitToLast } from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { database, storage } from '../config/firebase';
import { Beer, Comment } from '../types';

/**
 * Yeni bira ekler (fotoğraf ile)
 */
export const addBeer = async (
  userId: string,
  userName: string,
  userAvatar: string,
  photoUri: string
): Promise<{ success: boolean; beerId?: string; error?: string }> => {
  try {
    // 1. Fotoğrafı Firebase Storage'a yükle
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const filename = `${userId}_${timestamp}.jpg`;
    const photoPath = `beers/${year}/${filename}`;

    // Fotoğraf blob'unu oluştur
    const response = await fetch(photoUri);
    const blob = await response.blob();

    // Storage'a yükle
    const photoStorageRef = storageRef(storage, photoPath);
    await uploadBytes(photoStorageRef, blob);

    // Download URL al
    const photoUrl = await getDownloadURL(photoStorageRef);

    // 2. Bira verisini oluştur
    const beersRef = dbRef(database, 'beers');
    const newBeerRef = push(beersRef);
    const beerId = newBeerRef.key!;

    const beerData: Omit<Beer, 'id'> = {
      userId,
      userName,
      userAvatar,
      photoUrl,
      timestamp,
      year,
      reactions: {},
      comments: [],
    };

    await set(newBeerRef, beerData);

    // 3. Kullanıcının toplam bira sayısını artır
    const userTotalBeersRef = dbRef(database, `users/${userId}/totalBeers`);
    await set(userTotalBeersRef, increment(1));

    // 4. Kullanıcının yıllık bira sayısını artır
    const userYearBeersRef = dbRef(database, `users/${userId}/beersByYear/${year}`);
    await set(userYearBeersRef, increment(1));

    return { success: true, beerId };
  } catch (error: any) {
    console.error('Add beer error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Arkadaşlarının biralarını getirir (feed için)
 */
export const getFriendsFeed = async (userId: string, friendIds: string[]): Promise<Beer[]> => {
  try {
    const beersRef = dbRef(database, 'beers');
    const snapshot = await get(beersRef);

    if (!snapshot.exists()) {
      return [];
    }

    const beersData = snapshot.val();
    const allUserIds = [userId, ...friendIds];

    const beers: Beer[] = Object.keys(beersData)
      .filter((beerId) => allUserIds.includes(beersData[beerId].userId))
      .map((beerId) => ({
        id: beerId,
        ...beersData[beerId],
      }));

    // Zamana göre sırala (yeniden eskiye)
    return beers.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Get friends feed error:', error);
    return [];
  }
};

/**
 * Kullanıcının biralarını getirir
 */
export const getUserBeers = async (userId: string): Promise<Beer[]> => {
  try {
    const beersRef = dbRef(database, 'beers');
    const snapshot = await get(beersRef);

    if (!snapshot.exists()) {
      return [];
    }

    const beersData = snapshot.val();
    const beers: Beer[] = Object.keys(beersData)
      .filter((beerId) => beersData[beerId].userId === userId)
      .map((beerId) => ({
        id: beerId,
        ...beersData[beerId],
      }));

    return beers.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Get user beers error:', error);
    return [];
  }
};

/**
 * Tek bir birayı getirir
 */
export const getBeer = async (beerId: string): Promise<Beer | null> => {
  try {
    const beerRef = dbRef(database, `beers/${beerId}`);
    const snapshot = await get(beerRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: beerId,
      ...snapshot.val(),
    };
  } catch (error) {
    console.error('Get beer error:', error);
    return null;
  }
};

/**
 * Bira siler (sadece kendi birasını silebilir)
 */
export const deleteBeer = async (
  beerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Bira sahibini kontrol et
    const beerRef = dbRef(database, `beers/${beerId}`);
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
    const userTotalBeersRef = dbRef(database, `users/${userId}/totalBeers`);
    await set(userTotalBeersRef, increment(-1));

    const userYearBeersRef = dbRef(database, `users/${userId}/beersByYear/${beerData.year}`);
    await set(userYearBeersRef, increment(-1));

    return { success: true };
  } catch (error: any) {
    console.error('Delete beer error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Biraya emoji reaksiyonu ekler veya günceller
 */
export const addReaction = async (
  beerId: string,
  userId: string,
  emoji: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const reactionRef = dbRef(database, `beers/${beerId}/reactions/${userId}`);
    await set(reactionRef, emoji);
    return { success: true };
  } catch (error: any) {
    console.error('Add reaction error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Kullanıcının reaksiyonunu kaldırır
 */
export const removeReaction = async (
  beerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const reactionRef = dbRef(database, `beers/${beerId}/reactions/${userId}`);
    await set(reactionRef, null);
    return { success: true };
  } catch (error: any) {
    console.error('Remove reaction error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Biraya yorum ekler
 */
export const addComment = async (
  beerId: string,
  userId: string,
  userName: string,
  userAvatar: string,
  text: string
): Promise<{ success: boolean; commentId?: string; error?: string }> => {
  try {
    const commentsRef = dbRef(database, `beers/${beerId}/comments`);
    const newCommentRef = push(commentsRef);
    const commentId = newCommentRef.key!;

    const commentData: Omit<Comment, 'id'> = {
      userId,
      userName,
      userAvatar,
      text,
      timestamp: Date.now(),
    };

    await set(newCommentRef, commentData);
    return { success: true, commentId };
  } catch (error: any) {
    console.error('Add comment error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Yorum siler (sadece kendi yorumunu silebilir)
 */
export const deleteComment = async (
  beerId: string,
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const commentRef = dbRef(database, `beers/${beerId}/comments/${commentId}`);
    const snapshot = await get(commentRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'Yorum bulunamadı.' };
    }

    const commentData = snapshot.val();
    if (commentData.userId !== userId) {
      return { success: false, error: 'Sadece kendi yorumunu silebilirsin.' };
    }

    await set(commentRef, null);
    return { success: true };
  } catch (error: any) {
    console.error('Delete comment error:', error);
    return { success: false, error: error.message };
  }
};
