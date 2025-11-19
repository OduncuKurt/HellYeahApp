import { ref, set, get, update, push, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { Group, GroupMember } from '../types';
import { generateInviteCode } from '../utils/inviteCode';

/**
 * Yeni grup oluşturur
 */
export const createGroup = async (
  groupName: string,
  userId: string,
  userName: string,
  userAvatar: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; groupId?: string; inviteCode?: string; error?: string }> => {
  try {
    // Benzersiz invite code oluştur
    let inviteCode = generateInviteCode();
    let isUnique = false;

    // Kod benzersiz olana kadar dene
    while (!isUnique) {
      const exists = await checkInviteCodeExists(inviteCode);
      if (!exists) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
      }
    }

    // Yeni grup ID'si oluştur
    const groupsRef = ref(database, 'groups');
    const newGroupRef = push(groupsRef);
    const groupId = newGroupRef.key!;

    const now = new Date().toISOString();

    const groupData: Omit<Group, 'id'> = {
      name: groupName,
      createdBy: userId,
      createdAt: now,
      totalBeers: 0,
      inviteCode,
      startDate,
      endDate,
      members: {
        [userId]: {
          joinedAt: now,
          displayName: userName,
          avatar: userAvatar,
          beerCount: 0,
        },
      },
    };

    // Grubu kaydet
    await set(newGroupRef, groupData);

    // Kullanıcının groups listesine ekle
    const userGroupRef = ref(database, `users/${userId}/groups/${groupId}`);
    await set(userGroupRef, true);

    return { success: true, groupId, inviteCode };
  } catch (error: any) {
    console.error('Create group error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Invite code ile gruba katıl
 */
export const joinGroupByInviteCode = async (
  inviteCode: string,
  userId: string,
  userName: string,
  userAvatar: string
): Promise<{ success: boolean; groupId?: string; error?: string }> => {
  try {
    // Invite code ile grubu bul
    const groupsRef = ref(database, 'groups');
    const inviteQuery = query(groupsRef, orderByChild('inviteCode'), equalTo(inviteCode));
    const snapshot = await get(inviteQuery);

    if (!snapshot.exists()) {
      return { success: false, error: 'Geçersiz davet kodu.' };
    }

    const groupId = Object.keys(snapshot.val())[0];
    const groupData = snapshot.val()[groupId];

    // Kullanıcı zaten üye mi kontrol et
    if (groupData.members && groupData.members[userId]) {
      return { success: false, error: 'Zaten bu grubun üyesisiniz.' };
    }

    // Gruba üye ekle
    const memberData: GroupMember = {
      joinedAt: new Date().toISOString(),
      displayName: userName,
      avatar: userAvatar,
      beerCount: 0,
    };

    const memberRef = ref(database, `groups/${groupId}/members/${userId}`);
    await set(memberRef, memberData);

    // Kullanıcının groups listesine ekle
    const userGroupRef = ref(database, `users/${userId}/groups/${groupId}`);
    await set(userGroupRef, true);

    return { success: true, groupId };
  } catch (error: any) {
    console.error('Join group error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Kullanıcının gruplarını getir
 */
export const getUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    const userGroupsRef = ref(database, `users/${userId}/groups`);
    const snapshot = await get(userGroupsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const groupIds = Object.keys(snapshot.val());
    const groups: Group[] = [];

    for (const groupId of groupIds) {
      const groupRef = ref(database, `groups/${groupId}`);
      const groupSnapshot = await get(groupRef);

      if (groupSnapshot.exists()) {
        groups.push({
          id: groupId,
          ...groupSnapshot.val(),
        });
      }
    }

    return groups;
  } catch (error) {
    console.error('Get user groups error:', error);
    return [];
  }
};

/**
 * Grup detayını getir
 */
export const getGroupDetails = async (groupId: string): Promise<Group | null> => {
  try {
    const groupRef = ref(database, `groups/${groupId}`);
    const snapshot = await get(groupRef);

    if (snapshot.exists()) {
      return {
        id: groupId,
        ...snapshot.val(),
      };
    }

    return null;
  } catch (error) {
    console.error('Get group details error:', error);
    return null;
  }
};

/**
 * Kullanıcının grup sayısını getir
 */
const getUserGroupCount = async (userId: string): Promise<number> => {
  try {
    const userGroupsRef = ref(database, `users/${userId}/groups`);
    const snapshot = await get(userGroupsRef);

    if (snapshot.exists()) {
      return Object.keys(snapshot.val()).length;
    }

    return 0;
  } catch (error) {
    console.error('Get user group count error:', error);
    return 0;
  }
};

/**
 * Invite code'un var olup olmadığını kontrol et
 */
const checkInviteCodeExists = async (inviteCode: string): Promise<boolean> => {
  try {
    const groupsRef = ref(database, 'groups');
    const inviteQuery = query(groupsRef, orderByChild('inviteCode'), equalTo(inviteCode));
    const snapshot = await get(inviteQuery);

    return snapshot.exists();
  } catch (error) {
    console.error('Check invite code error:', error);
    return false;
  }
};

/**
 * Gruptan ayrıl
 */
export const leaveGroup = async (
  groupId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Grup üyeliğini sil
    const memberRef = ref(database, `groups/${groupId}/members/${userId}`);
    await set(memberRef, null);

    // Kullanıcının groups listesinden çıkar
    const userGroupRef = ref(database, `users/${userId}/groups/${groupId}`);
    await set(userGroupRef, null);

    return { success: true };
  } catch (error: any) {
    console.error('Leave group error:', error);
    return { success: false, error: error.message };
  }
};
