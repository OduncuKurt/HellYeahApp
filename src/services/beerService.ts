import { ref as dbRef, get, increment, push, update } from 'firebase/database';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { database, storage } from '../config/firebase';
import { Beer, Comment, PaginatedBeers } from '../types';

export const FEED_PAGE_SIZE = 20;

/**
 * Beer verisini parse eder (comments object → array dönüşümü dahil)
 */
const parseBeerData = (beerId: string, beerData: any): Beer => {
  let comments: Comment[] = [];
  if (beerData.comments) {
    comments = Object.keys(beerData.comments).map((commentId) => ({
      id: commentId,
      ...beerData.comments[commentId],
    }));
    comments.sort((a, b) => b.timestamp - a.timestamp);
  }
  return {
    id: beerId,
    ...beerData,
    isGuinness: beerData.isGuinness || false,
    comments,
  };
};

/**
 * Yeni bira ekler (fotoğraf ile)
 * 
 * FIX C-01: Upload path artık `beers/${userId}/${filename}` — Storage rules ile uyumlu
 * FIX H-05: Tüm DB yazmaları tek atomik `update()` ile yapılır
 */
export const addBeer = async (
  userId: string,
  userName: string,
  userAvatar: string,
  photoUri: string,
  isGuinness: boolean = false,
  location?: string
): Promise<{ success: boolean; beerId?: string; error?: string }> => {
  try {
    // 1. Fotoğrafı Firebase Storage'a yükle
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const filename = `${userId}_${timestamp}.jpg`;
    // FIX C-01: beers/${year}/ → beers/${userId}/ (Storage rules uyumu)
    const photoPath = `beers/${userId}/${filename}`;

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
      isGuinness,
      ...(location ? { location } : {}),
      reactions: {},
      comments: [],
    };

    // FIX H-05: Atomik fan-out update — bira + tüm sayaçlar tek işlemde
    const updates: Record<string, any> = {
      [`beers/${beerId}`]: beerData,
      [`users/${userId}/totalBeers`]: increment(1),
      [`users/${userId}/beersByYear/${year}`]: increment(1),
    };

    if (isGuinness) {
      updates[`users/${userId}/totalGuinnessBeers`] = increment(1);
      updates[`users/${userId}/guinnessByYear/${year}`] = increment(1);
    }

    await update(dbRef(database), updates);

    return { success: true, beerId };
  } catch (error: any) {
    console.error('Add beer error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Arkadaşlarının biralarını getirir (feed için)
 * Server-side filtreleme + cursor-based pagination
 */
export const getFriendsFeed = async (
  userId: string,
  friendIds: string[],
  pageSize: number = FEED_PAGE_SIZE,
  beforeTimestamp?: number
): Promise<PaginatedBeers> => {
  try {
    const { query, orderByChild, equalTo } = await import('firebase/database');
    const allUserIds = [userId, ...friendIds];

    // Her kullanıcı için ayrı sorgu — paralel çalışır (server-side filtered)
    const queryPromises = allUserIds.map(async (uid) => {
      const beersQuery = query(
        dbRef(database, 'beers'),
        orderByChild('userId'),
        equalTo(uid)
      );
      const snapshot = await get(beersQuery);
      if (!snapshot.exists()) return [];

      const beersData = snapshot.val();
      return Object.keys(beersData).map((beerId) =>
        parseBeerData(beerId, beersData[beerId])
      );
    });

    const results = await Promise.all(queryPromises);
    let allBeers = results.flat();

    // Zamana göre sırala (yeniden eskiye)
    allBeers.sort((a, b) => b.timestamp - a.timestamp);

    // Cursor-based pagination
    if (beforeTimestamp) {
      allBeers = allBeers.filter((b) => b.timestamp < beforeTimestamp);
    }

    const hasMore = allBeers.length > pageSize;
    const paginatedBeers = allBeers.slice(0, pageSize);
    const lastTimestamp = paginatedBeers.length > 0
      ? paginatedBeers[paginatedBeers.length - 1].timestamp
      : null;

    return { beers: paginatedBeers, lastTimestamp, hasMore };
  } catch (error) {
    console.error('Get friends feed error:', error);
    return { beers: [], lastTimestamp: null, hasMore: false };
  }
};

/**
 * Kullanıcının biralarını getirir
 * Server-side filtreleme + cursor-based pagination
 */
export const getUserBeers = async (
  userId: string,
  pageSize: number = FEED_PAGE_SIZE,
  beforeTimestamp?: number
): Promise<PaginatedBeers> => {
  try {
    const { query, orderByChild, equalTo } = await import('firebase/database');
    // Server-side filter by userId (sadece bu kullanıcının biraları gelir)
    const beersQuery = query(
      dbRef(database, 'beers'),
      orderByChild('userId'),
      equalTo(userId)
    );
    const snapshot = await get(beersQuery);

    if (!snapshot.exists()) {
      return { beers: [], lastTimestamp: null, hasMore: false };
    }

    const beersData = snapshot.val();
    let beers: Beer[] = Object.keys(beersData)
      .map((beerId) => parseBeerData(beerId, beersData[beerId]));

    // Zamana göre sırala (yeniden eskiye)
    beers.sort((a, b) => b.timestamp - a.timestamp);

    // Cursor-based pagination
    if (beforeTimestamp) {
      beers = beers.filter((b) => b.timestamp < beforeTimestamp);
    }

    const hasMore = beers.length > pageSize;
    const paginatedBeers = beers.slice(0, pageSize);
    const lastTimestamp = paginatedBeers.length > 0
      ? paginatedBeers[paginatedBeers.length - 1].timestamp
      : null;

    return { beers: paginatedBeers, lastTimestamp, hasMore };
  } catch (error) {
    console.error('Get user beers error:', error);
    return { beers: [], lastTimestamp: null, hasMore: false };
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

    const beerData = snapshot.val();
    
    // Convert comments object to array if exists
    let comments: Comment[] = [];
    if (beerData.comments) {
      comments = Object.keys(beerData.comments).map((commentId) => ({
        id: commentId,
        ...beerData.comments[commentId],
      }));
      // Sort by timestamp (newest first)
      comments.sort((a, b) => b.timestamp - a.timestamp);
    }

    return {
      id: beerId,
      ...beerData,
      isGuinness: beerData.isGuinness || false, // Backward compatibility
      comments,
    };
  } catch (error) {
    console.error('Get beer error:', error);
    return null;
  }
};

/**
 * Bira siler (sadece kendi birasını silebilir)
 * 
 * FIX H-05: Atomik update + Guinness sayaç düzeltmesi
 * FIX H-05 somut bug: Guinness birası silinince totalGuinnessBeers ve guinnessByYear azaltılıyor
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

    // FIX H-05: Atomik fan-out update — bira silme + tüm sayaçlar tek işlemde
    const updates: Record<string, any> = {
      [`beers/${beerId}`]: null,
      [`users/${userId}/totalBeers`]: increment(-1),
      [`users/${userId}/beersByYear/${beerData.year}`]: increment(-1),
    };

    // FIX H-05 somut bug: Guinness birası silinince Guinness sayaçlarını da azalt
    if (beerData.isGuinness) {
      updates[`users/${userId}/totalGuinnessBeers`] = increment(-1);
      updates[`users/${userId}/guinnessByYear/${beerData.year}`] = increment(-1);
    }

    await update(dbRef(database), updates);

    // Storage görseli silmeye çalış (başarısız olursa ana akışı bozma)
    if (beerData.photoUrl) {
      try {
        const photoRef = storageRef(storage, beerData.photoUrl);
        await deleteObject(photoRef);
      } catch (storageError) {
        // Storage silme başarısız olabilir (URL formatı vs.) — loglayıp devam et
        console.warn('Failed to delete beer photo from storage:', storageError);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Delete beer error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Biranın Guinness bayrağını toggle eder (sadece sahip)
 * 
 * FIX H-05: Atomik update — bayrak + sayaçlar tek işlemde
 */
export const toggleGuinness = async (
  beerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Bira sahibini kontrol et
    const beerRef = dbRef(database, `beers/${beerId}`);
    const snapshot = await get(beerRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'Bira bulunamadı.' };
    }

    const beerData = snapshot.val();
    if (beerData.userId !== userId) {
      return { success: false, error: 'Sadece kendi biranın Guinness bayrağını değiştirebilirsin.' };
    }

    // 2. Mevcut durumu al ve toggle et
    const currentIsGuinness = beerData.isGuinness || false;
    const newIsGuinness = !currentIsGuinness;
    const year = beerData.year;
    const delta = newIsGuinness ? 1 : -1;

    // FIX H-05: Atomik update — bayrak + sayaçlar tek işlemde
    const updates: Record<string, any> = {
      [`beers/${beerId}/isGuinness`]: newIsGuinness,
      [`users/${userId}/totalGuinnessBeers`]: increment(delta),
      [`users/${userId}/guinnessByYear/${year}`]: increment(delta),
    };

    await update(dbRef(database), updates);

    return { success: true };
  } catch (error: any) {
    console.error('Toggle Guinness error:', error);
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
    // C-03 fix sayesinde artık reactions/$userId altına doğrudan yazılabilir
    const updates: Record<string, any> = {
      [`beers/${beerId}/reactions/${userId}`]: emoji,
    };
    await update(dbRef(database), updates);
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
    const updates: Record<string, any> = {
      [`beers/${beerId}/reactions/${userId}`]: null,
    };
    await update(dbRef(database), updates);
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

    // C-03 fix sayesinde yorum alt-path'ine doğrudan yazılabilir
    const updates: Record<string, any> = {
      [`beers/${beerId}/comments/${commentId}`]: commentData,
    };
    await update(dbRef(database), updates);
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

    const updates: Record<string, any> = {
      [`beers/${beerId}/comments/${commentId}`]: null,
    };
    await update(dbRef(database), updates);
    return { success: true };
  } catch (error: any) {
    console.error('Delete comment error:', error);
    return { success: false, error: error.message };
  }
};
