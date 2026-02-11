import { get, ref, remove, set } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { FriendRequest, User } from '../types';

// Kullanıcı ara (username ile)
export const searchUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const usernameRef = ref(database, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernameRef);

    if (!snapshot.exists()) {
      return null;
    }

    const userId = snapshot.val();
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      return {
        uid: userId,
        ...userSnapshot.val(),
      } as User;
    }

    return null;
  } catch (error) {
    console.error('Search user error:', error);
    return null;
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
    console.log('🔐 Auth Status:', {
      isAuthenticated: !!currentUser,
      currentUserId: currentUser?.uid,
      requestFromUserId: fromUserId,
      userMatch: currentUser?.uid === fromUserId
    });

    if (!currentUser) {
      return { 
        success: false, 
        error: 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.' 
      };
    }

    if (currentUser.uid !== fromUserId) {
      return { 
        success: false, 
        error: 'Kullanıcı kimliği uyuşmuyor. Lütfen tekrar giriş yapın.' 
      };
    }

    // Auth token kontrolü
    try {
      const token = await currentUser.getIdToken();
      console.log('🎫 Auth Token:', token ? 'Valid' : 'Invalid');
    } catch (tokenError) {
      console.error('❌ Token error:', tokenError);
      return { 
        success: false, 
        error: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' 
      };
    }

    // Debug: Auth durumunu kontrol et
    console.log('🔍 Friend Request Debug:', {
      fromUserId,
      fromUsername,
      toUserId,
      timestamp: new Date().toISOString()
    });

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

    // Bekleyen istek var mı kontrol et
    const requestRef = ref(database, `friendRequests/${toUserId}/${fromUserId}`);
    const requestSnapshot = await get(requestRef);
    if (requestSnapshot.exists()) {
      return { success: false, error: 'Zaten bir istek göndermişsiniz.' };
    }

    // İstek gönder
    console.log('📤 Sending friend request to path:', `friendRequests/${toUserId}/${fromUserId}`);
    await set(requestRef, {
      fromUserId,
      fromUsername: fromUsername || 'unknown',
      fromDisplayName,
      fromAvatar,
      toUserId,
      status: 'pending',
      timestamp: Date.now(),
    });

    console.log('✅ Friend request sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Send friend request error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
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

// Arkadaşlık isteğini kabul et
export const acceptFriendRequest = async (
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const now = Date.now();

    // Her iki kullanıcının da friends listesine ekle
    await set(ref(database, `users/${userId}/friends/${friendId}`), now);
    await set(ref(database, `users/${friendId}/friends/${userId}`), now);

    // İsteği sil
    await remove(ref(database, `friendRequests/${userId}/${friendId}`));

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
    await remove(ref(database, `friendRequests/${userId}/${friendId}`));
    return { success: true };
  } catch (error: any) {
    console.error('Reject friend request error:', error);
    return { success: false, error: error.message };
  }
};

// Arkadaşları getir
export const getFriends = async (userId: string): Promise<User[]> => {
  try {
    const userRef = ref(database, `users/${userId}/friends`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return [];
    }

    const friendIds = Object.keys(snapshot.val());
    const friends: User[] = [];

    for (const friendId of friendIds) {
      const friendRef = ref(database, `users/${friendId}`);
      const friendSnapshot = await get(friendRef);

      if (friendSnapshot.exists()) {
        friends.push({
          uid: friendId,
          ...friendSnapshot.val(),
        });
      }
    }

    return friends;
  } catch (error) {
    console.error('Get friends error:', error);
    return [];
  }
};

// Arkadaşlıktan çıkar
export const removeFriend = async (
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await remove(ref(database, `users/${userId}/friends/${friendId}`));
    await remove(ref(database, `users/${friendId}/friends/${userId}`));
    return { success: true };
  } catch (error: any) {
    console.error('Remove friend error:', error);
    return { success: false, error: error.message };
  }
};
