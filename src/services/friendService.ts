import { get, ref, update, query, orderByKey, startAt, endAt, limitToFirst } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { FriendRequest, User } from '../types';

// Kullanıcı ara (username ile - partial match destekler)
export const searchUsersByUsername = async (searchQuery: string): Promise<User[]> => {
  try {
    const q = query(
      ref(database, 'usernames'),
      orderByKey(),
      startAt(searchQuery.toLowerCase()),
      endAt(searchQuery.toLowerCase() + '\uf8ff'),
      limitToFirst(10)
    );
    const snapshot = await get(q);

    if (!snapshot.exists()) {
      return [];
    }

    const userIds = Object.values(snapshot.val()) as string[];
    const uniqueIds = Array.from(new Set(userIds));
    
    // Paralel okuma — sıralı await yerine Promise.all
    const userPromises = uniqueIds.map(async (userId) => {
      const userRef = ref(database, `users/${userId}`);
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        return {
          uid: userId,
          ...userSnapshot.val(),
        } as User;
      }
      return null;
    });

    const users = await Promise.all(userPromises);
    return users.filter((u): u is User => u !== null);
  } catch (error) {
    console.error('Search user error:', error);
    return [];
  }
};

// Arkadaşlık isteği gönder
export const sendFriendRequest = async (
  fromUserId: string,
  fromUsername: string,
  fromDisplayName: string,
  fromAvatar: string,
  toUserId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Auth kontrolü
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return { 
        success: false, 
        error: 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.' 
      };
    }

    // FIX H-03: İstek oluşturma yalnız fromUserId === auth.uid olmalı
    if (currentUser.uid !== fromUserId) {
      return { 
        success: false, 
        error: 'Kullanıcı kimliği uyuşmuyor. Lütfen tekrar giriş yapın.' 
      };
    }

    // Auth token kontrolü
    try {
      await currentUser.getIdToken();
    } catch (tokenError) {
      console.error('Token error:', tokenError);
      return { 
        success: false, 
        error: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' 
      };
    }

    // Kendine istek göndermesini engelle
    if (fromUserId === toUserId) {
      return { success: false, error: 'Kendine arkadaşlık isteği gönderemezsin.' };
    }

    // Zaten arkadaş mı kontrol et
    const friendRef = ref(database, `users/${fromUserId}/friends/${toUserId}`);
    const friendSnapshot = await get(friendRef);
    if (friendSnapshot.exists()) {
      return { success: false, error: 'Zaten arkadaşsınız.' };
    }

    // Bekleyen istek var mı kontrol et (her iki yönde)
    const requestRef = ref(database, `friendRequests/${toUserId}/${fromUserId}`);
    const requestSnapshot = await get(requestRef);
    if (requestSnapshot.exists()) {
      return { success: false, error: 'Zaten bir istek göndermişsiniz.' };
    }

    // Karşı taraftan gelen istek var mı kontrol et
    const reverseRequestRef = ref(database, `friendRequests/${fromUserId}/${toUserId}`);
    const reverseRequestSnapshot = await get(reverseRequestRef);
    if (reverseRequestSnapshot.exists()) {
      return { success: false, error: 'Bu kullanıcıdan zaten bir istek var. İsteklerini kontrol et.' };
    }

    // İstek gönder — FIX H-03: fromUserId === auth.uid doğrulaması rules'da yapılır
    const requestData = {
      fromUserId,
      fromUsername: fromUsername || 'unknown',
      fromDisplayName,
      fromAvatar,
      toUserId,
      status: 'pending',
      timestamp: Date.now(),
    };

    const updates: Record<string, any> = {
      [`friendRequests/${toUserId}/${fromUserId}`]: requestData,
    };

    await update(ref(database), updates);

    return { success: true };
  } catch (error: any) {
    console.error('Send friend request error:', error);
    
    // Daha anlamlı hata mesajları
    if (error.code === 'PERMISSION_DENIED' || error.message?.includes('Permission denied')) {
      return { 
        success: false, 
        error: 'Firebase izin hatası. Güvenlik kurallarını kontrol edin veya tekrar giriş yapın.' 
      };
    }
    
    return { success: false, error: error.message };
  }
};

// Gelen arkadaşlık isteklerini getir
export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const requestsRef = ref(database, `friendRequests/${userId}`);
    const snapshot = await get(requestsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const requests: FriendRequest[] = [];
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.status === 'pending') {
        requests.push({
          id: child.key!,
          ...data,
        });
      }
    });

    return requests.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Get friend requests error:', error);
    return [];
  }
};

/**
 * Arkadaşlık isteğini kabul et
 * 
 * FIX C-04: Atomik multi-path update — iki taraflı friends + istek silme tek işlemde
 * FIX H-05: Sıralı set() yerine tek update() çağrısı
 */
export const acceptFriendRequest = async (
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Güvenlik: Kabul eden kişi gerçekten alıcı mı?
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      return { success: false, error: 'Yetkilendirme hatası.' };
    }

    // İstek var mı kontrol et
    const requestRef = ref(database, `friendRequests/${userId}/${friendId}`);
    const requestSnapshot = await get(requestRef);
    if (!requestSnapshot.exists()) {
      return { success: false, error: 'Arkadaşlık isteği bulunamadı.' };
    }

    const now = Date.now();

    // FIX C-04 + H-05: Atomik multi-path update
    // İki taraflı friends yazma + istek silme tek işlemde
    const updates: Record<string, any> = {
      [`users/${userId}/friends/${friendId}`]: now,
      [`users/${friendId}/friends/${userId}`]: now,
      [`friendRequests/${userId}/${friendId}`]: null,
    };

    await update(ref(database), updates);

    return { success: true };
  } catch (error: any) {
    console.error('Accept friend request error:', error);
    return { success: false, error: error.message };
  }
};

// Arkadaşlık isteğini reddet
export const rejectFriendRequest = async (
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updates: Record<string, any> = {
      [`friendRequests/${userId}/${friendId}`]: null,
    };
    await update(ref(database), updates);
    return { success: true };
  } catch (error: any) {
    console.error('Reject friend request error:', error);
    return { success: false, error: error.message };
  }
};

// Arkadaşları getir — paralel okuma ile optimize edildi
export const getFriends = async (userId: string): Promise<User[]> => {
  try {
    const userRef = ref(database, `users/${userId}/friends`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return [];
    }

    const friendIds = Object.keys(snapshot.val());

    // Paralel okuma — sıralı await yerine Promise.all
    const friendPromises = friendIds.map(async (friendId) => {
      const friendRef = ref(database, `users/${friendId}`);
      const friendSnapshot = await get(friendRef);
      if (friendSnapshot.exists()) {
        return {
          uid: friendId,
          ...friendSnapshot.val(),
        } as User;
      }
      return null;
    });

    const friends = await Promise.all(friendPromises);
    return friends.filter((f): f is User => f !== null);
  } catch (error) {
    console.error('Get friends error:', error);
    return [];
  }
};

/**
 * Arkadaşlıktan çıkar
 * 
 * FIX C-04: Atomik multi-path update — iki taraflı silme tek işlemde
 * FIX H-05: Sıralı remove() yerine tek update() çağrısı
 */
export const removeFriend = async (
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // FIX C-04 + H-05: Atomik multi-path update
    const updates: Record<string, any> = {
      [`users/${userId}/friends/${friendId}`]: null,
      [`users/${friendId}/friends/${userId}`]: null,
    };

    await update(ref(database), updates);
    return { success: true };
  } catch (error: any) {
    console.error('Remove friend error:', error);
    return { success: false, error: error.message };
  }
};
