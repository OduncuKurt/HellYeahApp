import { ref, get, set, remove, query, orderByChild, equalTo, push } from 'firebase/database';
import { database } from '../config/firebase';
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
    await set(requestRef, {
      fromUserId,
      fromUsername,
      fromDisplayName,
      fromAvatar,
      toUserId,
      status: 'pending',
      timestamp: Date.now(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Send friend request error:', error);
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
