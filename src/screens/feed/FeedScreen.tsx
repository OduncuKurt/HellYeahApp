import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { addBeer, getFriendsFeed } from '../../services/beerService';
import { getFriends } from '../../services/friendService';
import { Beer, MainStackParamList } from '../../types';

type FeedScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Feed'>;

interface Props {
  navigation: FeedScreenNavigationProp;
}

export default function FeedScreen({ navigation }: Props) {
  const { user, refreshUserData } = useAuth();
  const { colors, theme } = useTheme();
  const { showError, showCustomConfirm } = useModal();
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  const loadFeed = async (): Promise<void> => {
    if (!user) return;

    try {
      const friends = await getFriends(user.uid);
      const friendIds = friends.map((f) => f.uid);
      const feedBeers = await getFriendsFeed(user.uid, friendIds);
      setBeers(feedBeers);
    } catch (error) {
      console.error('Load feed error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [user])
  );

  const handleRefresh = (): void => {
    setRefreshing(true);
    loadFeed();
  };

  const handleAddBeer = async (): Promise<void> => {
    if (!user) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showError('Permission Required', 'Camera permission is required.');
      return;
    }

    try {
      // iOS: action sheet kapanma animasyonunu bekle (hata olmaması için Profile'daki gibi eklendi)
      await new Promise(resolve => setTimeout(resolve, 350));

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        let imageUri = result.assets[0].uri;
        
        // EXIF verisinden ön kamera (selfie) kullanılıp kullanılmadığını tespit et
        const exif = result.assets[0].exif;
        const isFrontCamera = exif?.LensModel?.toLowerCase().includes('front') || false;

        // Eğer iOS'taysa ve ön kamerayla çekildiyse, asimetri (ters dönme) olmaması için ayna efekti uygula
        if (Platform.OS === 'ios' && isFrontCamera) {
          const flipped = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ flip: ImageManipulator.FlipType.Horizontal }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );
          imageUri = flipped.uri;
        }

        // Show Guinness selection dialog
        showCustomConfirm(
          'Beer Type',
          'Is this a Guinness beer? 🍀',
          'Yes',
          'No',
          () => uploadBeer(imageUri, true),
          () => uploadBeer(imageUri, false)
        );
      }
    } catch (error) {
      console.error('Add beer error:', error);
      showError('Error', 'Failed to take photo.');
    }
  };

  const uploadBeer = async (photoUri: string, isGuinness: boolean): Promise<void> => {
    if (!user) return;
    
    setUploading(true);
    const addResult = await addBeer(
      user.uid,
      user.displayName,
      user.avatar,
      photoUri,
      isGuinness
    );
    setUploading(false);

    if (addResult.success) {
      loadFeed();
      await refreshUserData(); // Refresh to update stats
    } else {
      showError('Error', addResult.error || 'Failed to add beer.');
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const isGuinness = (beer: Beer): boolean => {
    return beer.isGuinness === true;
  };

  const renderBeerItem = ({ item }: { item: Beer }) => (
    <TouchableOpacity
      style={[styles.beerCard, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('BeerDetail', { beerId: item.id })}
      activeOpacity={0.98}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            {item.userAvatar ? (
              <Image source={{ uri: item.userAvatar }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.background }]}>{item.userName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.userName, { color: colors.text }]}>{item.userName}</Text>
              {isGuinness(item) && <Text style={{ fontSize: 16 }}>🍀</Text>}
            </View>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.beerPhoto, { backgroundColor: colors.border }]}>
        <Image source={{ uri: item.photoUrl }} style={styles.beerPhotoImage} />
      </View>

      <View style={styles.cardFooter}>
        {item.reactions && Object.keys(item.reactions).length > 0 && (
          <Text style={[styles.reactionsText, { color: colors.text }]}>
            {Object.keys(item.reactions).length} reactions
          </Text>
        )}
        {item.comments && item.comments.length > 0 && (
          <Text style={[styles.commentsText, { color: colors.textSecondary }]}>
            {item.comments.length} {item.comments.length === 1 ? 'comment' : 'comments'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.border }]} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No beers yet</Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Add your first beer or connect with friends
      </Text>
    </View>
  );

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Hell Yeah</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => navigation.navigate('Friends')} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: colors.textSecondary }]}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: colors.textSecondary }]}>Board</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', {})} style={[styles.profileBtn, { backgroundColor: colors.primary }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.profileBtnImage} />
            ) : (
              <Text style={[styles.profileBtnText, { color: colors.background }]}>{user?.displayName.charAt(0).toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed */}
      <FlatList
        data={beers}
        renderItem={renderBeerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        style={Platform.OS === 'web' ? { height: '100%' } : undefined}
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary, shadowColor: colors.text }]}
        onPress={handleAddBeer}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <Text style={[styles.addButtonText, { color: colors.background }]}>+</Text>
        )}
      </TouchableOpacity>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  profileBtnImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  feedContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  beerCard: {
    backgroundColor: '#FFF',
    marginTop: 12,
    borderRadius: 0,
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  beerPhoto: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
  },
  beerPhotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  cardFooter: {
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  reactionsText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
  commentsText: {
    fontSize: 13,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 120,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFF',
  },
});
