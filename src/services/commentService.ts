import { ref as dbRef, get, push, set } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { Comment } from '../types';

/**
 * Biraya yeni yorum ekler
 */
export const addComment = async (
  groupId: string,
  beerId: string,
  userId: string,
  userName: string,
  userAvatar: string,
  text: string
): Promise<{ success: boolean; commentId?: string; error?: string }> => {
  try {
    const commentsRef = dbRef(database, `groups/${groupId}/beers/${beerId}/comments`);
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
 * Yorumu siler (sadece yorum sahibi silebilir)
 */
export const deleteComment = async (
  groupId: string,
  beerId: string,
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Yorum sahibini kontrol et
    const commentRef = dbRef(database, `groups/${groupId}/beers/${beerId}/comments/${commentId}`);
    const snapshot = await get(commentRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'Yorum bulunamadı.' };
    }

    const commentData = snapshot.val();
    if (commentData.userId !== userId) {
      return { success: false, error: 'Sadece kendi yorumunu silebilirsin.' };
    }

    // Yorumu sil
    await set(commentRef, null);
    return { success: true };
  } catch (error: any) {
    console.error('Delete comment error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Bir biranın tüm yorumlarını getirir
 */
export const getComments = async (
  groupId: string,
  beerId: string
): Promise<Comment[]> => {
  try {
    const commentsRef = dbRef(database, `groups/${groupId}/beers/${beerId}/comments`);
    const snapshot = await get(commentsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const commentsData = snapshot.val();
    const comments: Comment[] = Object.keys(commentsData).map((commentId) => ({
      id: commentId,
      ...commentsData[commentId],
    }));

    // Zamana göre sırala (eskiden yeniye)
    return comments.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Get comments error:', error);
    return [];
  }
};
