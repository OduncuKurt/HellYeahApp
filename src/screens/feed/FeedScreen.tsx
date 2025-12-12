import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { getFriendsFeed, addBeer } from '../../services/beerService';
import { getFriends } from '../../services/friendService';
import { Beer, MainStackParamList } from '../../types';

type FeedScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Feed'>;

interface Props {
  navigation: FeedScreenNavigationProp;
}

export default function FeedScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
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
      Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermelisiniz.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const addResult = await addBeer(
          user.uid,
          user.displayName,
          user.avatar,
          result.assets[0].uri
        );
        setUploading(false);

        if (addResult.success) {
          loadFeed();
        } else {
          Alert.alert('Hata', addResult.error || 'Bira eklenemedi.');
        }
      }
    } catch (error) {
      console.error('Add beer error:', error);
      Alert.alert('Hata', 'Fotoğraf çekilemedi.');
      setUploading(false);
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}dk`;
    if (hours < 24) return `${hours}sa`;
    return `${days}g`;
  };

  const renderBeerItem = ({ item }: { item: Beer }) => (
    <TouchableOpacity
      style={styles.beerCard}
      onPress={() => navigation.navigate('BeerDetail', { beerId: item.id })}
      activeOpacity={0.98}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.beerPhoto}>
        <Image source={{ uri: item.photoUrl }} style={styles.beerPhotoImage} />
      </View>

      <View style={styles.cardFooter}>
        {item.reactions && Object.keys(item.reactions).length > 0 && (
          <Text style={styles.reactionsText}>
            {Object.keys(item.reactions).length} reactions
          </Text>
        )}
        {item.comments && item.comments.length > 0 && (
          <Text style={styles.commentsText}>
            {item.comments.length} {item.comments.length === 1 ? 'comment' : 'comments'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No beers yet</Text>
      <Text style={styles.emptySubtext}>
        Add your first beer or connect with friends
      </Text>
    </View>
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hell Yeah</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => navigation.navigate('Friends')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Board</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', {})} style={styles.profileBtn}>
            <Text style={styles.profileBtnText}>{user?.displayName.charAt(0).toUpperCase()}</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#000" />
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddBeer}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.addButtonText}>+</Text>
        )}
      </TouchableOpacity>
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
