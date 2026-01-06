import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { addComment, addReaction, deleteComment, getBeer, removeReaction, toggleGuinness } from '../../services/beerService';
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
  const { user, refreshUserData } = useAuth();
  const { colors, theme } = useTheme();
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

  const handleToggleGuinness = async (): Promise<void> => {
    if (!user || !beer || beer.userId !== user.uid) return;

    const currentState = beer.isGuinness ? 'Guinness' : 'normal';
    const newState = beer.isGuinness ? 'normal' : 'Guinness';

    Alert.alert(
      'Guinness Bayrağını Değiştir',
      `Bu birayı ${currentState} biradan ${newState} biraya çevirmek istediğine emin misin?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Değiştir',
          onPress: async () => {
            const result = await toggleGuinness(beerId, user.uid);
            if (result.success) {
              loadBeer(); // Reload beer data
              if (refreshUserData) await refreshUserData(); // Update stats
            } else {
              Alert.alert('Hata', result.error || 'İşlem başarısız oldu.');
            }
          },
        },
      ]
    );
  };



  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!beer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Beer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isGuinness = (beer: Beer): boolean => {
    return beer.isGuinness === true;
  };

  const userReaction = user ? beer.reactions?.[user.uid] : undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerUser}>
            <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.headerAvatarText, { color: colors.background }]}>{beer.userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.headerName, { color: colors.text }]}>{beer.userName}</Text>
              {isGuinness(beer) && <Text style={{ fontSize: 16 }}>🍀</Text>}
            </View>
          </View>
          <View style={styles.backBtn} />
        </View>

        {/* Photo */}
        <View style={[styles.photoContainer, { backgroundColor: colors.background }]}>
          <Image source={{ uri: beer.photoUrl }} style={[styles.photo, { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F0F0F0' }]} />
        </View>

        {/* Reactions */}
        <View style={[styles.reactionsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {REACTION_EMOJIS.map((emoji) => {
            const count = beer.reactions
              ? Object.values(beer.reactions).filter((r) => r === emoji).length
              : 0;
            const isActive = userReaction === emoji;

            return (
              <TouchableOpacity
                key={emoji}
                style={[
                    styles.reactionBtn,
                    { backgroundColor: isActive ? colors.primary : theme === 'dark' ? '#2C2C2C' : '#F5F5F5' }
                ]}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 0 && <Text style={[styles.reactionCount, { color: isActive ? colors.background : colors.text }]}>{count}</Text>}
              </TouchableOpacity>
            );
          })}
          
          {/* Guinness Toggle (Only for beer owner) */}
          {user && beer.userId === user.uid && (
            <TouchableOpacity
              style={[
                styles.guinnessToggleBtn,
                { backgroundColor: beer.isGuinness ? '#34C759' : theme === 'dark' ? '#2C2C2C' : '#F5F5F5' }
              ]}
              onPress={handleToggleGuinness}
            >
              <Text style={styles.guinnessToggleIcon}>🍀</Text>
              <Text style={[
                styles.guinnessToggleText,
                { color: beer.isGuinness ? '#FFF' : colors.text }
              ]}>
                {beer.isGuinness ? 'Guinness' : 'Normal'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Comment Input - MOVED TO TOP */}
        <View style={[styles.commentInputContainer, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.commentInput, { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5', color: colors.text }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textSecondary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={200}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn, 
              { backgroundColor: colors.primary },
              !commentText.trim() && { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#E0E0E0' }
            ]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={[styles.sendBtnText, { color: colors.background }]}>Send</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Comments - INVERTED FOR KEYBOARD FIX */}
        <FlatList
          inverted
          data={beer.comments || []}
          renderItem={({ item }: { item: Comment }) => (
            <TouchableOpacity
              style={styles.commentCard}
              onLongPress={() => handleDeleteComment(item.id, item.userId)}
              activeOpacity={0.9}
            >
              <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.commentAvatarText, { color: colors.background }]}>{item.userName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.commentContent}>
                <Text style={[styles.commentUser, { color: colors.text }]}>{item.userName}</Text>
                <Text style={[styles.commentText, { color: colors.textSecondary }]}>{item.text}</Text>
                <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                  {new Date(item.timestamp).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.commentsContent, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={[styles.emptyCommentsText, { color: colors.textSecondary }]}>No comments yet</Text>
            </View>
          }
        />
    </SafeAreaView>
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
    paddingTop: 12,
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
  guinnessToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    marginLeft: 'auto', // Push to right
  },
  guinnessToggleIcon: {
    fontSize: 14,
  },
  guinnessToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
