import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useModal } from '../contexts/ModalContext';
import { useTheme } from '../contexts/ThemeContext';
import { Comment } from '../types';

interface CommentSectionProps {
  comments?: { [commentId: string]: Comment };
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments = {},
  currentUserId,
  currentUserAvatar,
  onAddComment,
  onDeleteComment,
}) => {
  const { colors, theme } = useTheme();
  const { showConfirm } = useModal();
  const [commentText, setCommentText] = useState('');
  const [expanded, setExpanded] = useState(false);

  const commentArray: Comment[] = Object.entries(comments).map(([id, comment]) => ({
    ...comment,
    id,
  }));

  // Zamana göre sırala (eskiden yeniye)
  const sortedComments = commentArray.sort((a, b) => a.timestamp - b.timestamp);

  const displayedComments = expanded ? sortedComments : sortedComments.slice(0, 2);
  const hasMoreComments = sortedComments.length > 2;

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText('');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    showConfirm(
      'Yorumu Sil',
      'Bu yorumu silmek istediğinizden emin misiniz?',
      () => onDeleteComment(commentId)
    );
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes}d`;
    if (hours < 24) return `${hours}s`;
    return `${days}g`;
  };

  return (
    <View style={styles.container}>
      {/* Yorumlar Listesi */}
      {sortedComments.length > 0 && (
        <View style={styles.commentsContainer}>
          {displayedComments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.avatar}>{comment.userAvatar}</Text>
              <View style={[styles.commentContent, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#F5F5F5' }]}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.userName, { color: colors.text }]}>{comment.userName}</Text>
                  <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                    {formatTimestamp(comment.timestamp)}
                  </Text>
                </View>
                <Text style={[styles.commentText, { color: colors.textSecondary }]}>{comment.text}</Text>
              </View>
              {comment.userId === currentUserId && (
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.error }]}
                  onPress={() => handleDeleteComment(comment.id)}
                >
                  <Text style={[styles.deleteButtonText, { color: colors.background }]}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {hasMoreComments && !expanded && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setExpanded(true)}
            >
              <Text style={[styles.viewAllText, { color: colors.textSecondary }]}>
                Tüm {sortedComments.length} yorumu görüntüle
              </Text>
            </TouchableOpacity>
          )}

          {expanded && hasMoreComments && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setExpanded(false)}
            >
              <Text style={[styles.viewAllText, { color: colors.textSecondary }]}>Daha az göster</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Yorum Input */}
      <View style={[styles.inputContainer, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#F5F5F5' }]}>
        <Text style={styles.inputAvatar}>{currentUserAvatar}</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Yorum yaz..."
          placeholderTextColor={colors.textSecondary}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            !commentText.trim() && { backgroundColor: theme === 'dark' ? '#4a4a4a' : '#E0E0E0' },
          ]}
          onPress={handleAddComment}
          disabled={!commentText.trim()}
        >
          <Text style={[styles.sendButtonText, { color: colors.background }]}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  commentsContainer: {
    marginBottom: 12,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    fontSize: 28,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
  },
  deleteButton: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  viewAllButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputAvatar: {
    fontSize: 24,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#4a4a4a',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CommentSection;
