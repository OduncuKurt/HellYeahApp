import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { getBeer, addReaction, removeReaction, addComment, deleteComment } from '../../services/beerService';
import { Beer, Comment, MainStackParamList } from '../../types';

type BeerDetailScreenNavigationProp = StackNavigationProp<MainStackParamList, 'BeerDetail'>;
type BeerDetailScreenRouteProp = RouteProp<MainStackParamList, 'BeerDetail'>;

interface Props {
  navigation: BeerDetailScreenNavigationProp;
  route: BeerDetailScreenRouteProp;
}

const REACTION_EMOJIS = ['🍻', '🔥', '👏', '❤️', '😂', '🎉'];

export default function BeerDetailScreen({ navigation, route }: Props) {
  const { beerId } = route.params;
  const { user } = useAuth();
  const [beer, setBeer] = useState<Beer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadBeer();
  }, [beerId]);

  const loadBeer = async (): Promise<void> => {
    const beerData = await getBeer(beerId);
    setBeer(beerData);
    setLoading(false);
  };

  const handleReaction = async (emoji: string): Promise<void> => {
    if (!user || !beer) return;

    const currentReaction = beer.reactions?.[user.uid];

    if (currentReaction === emoji) {
      // Same emoji - remove
      await removeReaction(beerId, user.uid);
    } else {
      // Add/update reaction
      await addReaction(beerId, user.uid, emoji);
    }

    loadBeer();
  };

  const handleAddComment = async (): Promise<void> => {
    if (!user || !commentText.trim()) return;

    setSubmitting(true);
    const result = await addComment(beerId, user.uid, user.displayName, user.avatar, commentText.trim());
    setSubmitting(false);

    if (result.success) {
      setCommentText('');
      loadBeer();
    } else {
      Alert.alert('Hata', result.error || 'Yorum eklenemedi.');
    }
  };

  const handleDeleteComment = (commentId: string, commentUserId: string): void => {
    if (!user || commentUserId !== user.uid) return;

    Alert.alert('Yorumu Sil', 'Bu yorumu silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteComment(beerId, commentId, user.uid);
          loadBeer();
        },
      },
    ]);
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <TouchableOpacity
      style={styles.commentCard}
      onLongPress={() => handleDeleteComment(item.id, item.userId)}
      activeOpacity={0.9}
    >
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>{item.userName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.commentUser}>{item.userName}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        <Text style={styles.commentTime}>
          {new Date(item.timestamp).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </View>
    );
  }

  if (!beer) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Beer not found</Text>
        </View>
      </View>
    );
  }

  const userReaction = user ? beer.reactions?.[user.uid] : undefined;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerUser}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{beer.userName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.headerName}>{beer.userName}</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        {/* Photo */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: beer.photoUrl }} style={styles.photo} />
        </View>

        {/* Reactions */}
        <View style={styles.reactionsBar}>
          {REACTION_EMOJIS.map((emoji) => {
            const count = beer.reactions
              ? Object.values(beer.reactions).filter((r) => r === emoji).length
              : 0;
            const isActive = userReaction === emoji;

            return (
              <TouchableOpacity
                key={emoji}
                style={[styles.reactionBtn, isActive && styles.activeReactionBtn]}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 0 && <Text style={styles.reactionCount}>{count}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Comments */}
        <FlatList
          data={beer.comments || []}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.commentsContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
            </View>
          }
        />

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={200}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 28,
    color: '#000',
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  headerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  photoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  reactionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    gap: 4,
  },
  activeReactionBtn: {
    backgroundColor: '#000',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  commentsContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFF',
  },
  commentCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 11,
    color: '#999',
  },
  emptyComments: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 14,
    color: '#999',
  },
  commentInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    maxHeight: 100,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  sendBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
});
