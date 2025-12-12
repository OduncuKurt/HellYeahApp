import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { getUserBeers } from '../../services/beerService';
import { ref as dbRef, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { User, Beer, MainStackParamList } from '../../types';

type ProfileScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Profile'>;
type ProfileScreenRouteProp = RouteProp<MainStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
  route: ProfileScreenRouteProp;
}

export default function ProfileScreen({ navigation, route }: Props) {
  const { user: currentUser, logout } = useAuth();
  const userId = route.params?.userId || currentUser?.uid;
  const isOwnProfile = userId === currentUser?.uid;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async (): Promise<void> => {
    if (!userId) return;

    try {
      // Kullanıcı bilgilerini yükle
      const userRef = dbRef(database, `users/${userId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        setProfileUser({
          uid: userId,
          ...snapshot.val(),
        });
      }

      // Kullanıcının biralarını yükle
      const userBeers = await getUserBeers(userId);
      setBeers(userBeers);
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = (): void => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const renderBeerItem = ({ item }: { item: Beer }) => (
    <TouchableOpacity
      style={styles.beerPhoto}
      onPress={() => navigation.navigate('BeerDetail', { beerId: item.id })}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.photoUrl }} style={styles.beerImage} />
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

  if (!profileUser) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>User not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {isOwnProfile && (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
        {!isOwnProfile && <View style={styles.backBtn} />}
      </View>

      <FlatList
        ListHeaderComponent={
          <View>
            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{profileUser.displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.displayName}>{profileUser.displayName}</Text>
              <Text style={styles.username}>@{profileUser.username}</Text>

              {/* Stats */}
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profileUser.totalBeers || 0}</Text>
                  <Text style={styles.statLabel}>Total Beers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {Object.keys(profileUser.friends || {}).length}
                  </Text>
                  <Text style={styles.statLabel}>Friends</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{beers.length}</Text>
                  <Text style={styles.statLabel}>Photos</Text>
                </View>
              </View>
            </View>

            {/* Photos Header */}
            <View style={styles.photosHeader}>
              <Text style={styles.photosTitle}>Photos</Text>
            </View>
          </View>
        }
        data={beers}
        renderItem={renderBeerItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.photoRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyPhotos}>
            <Text style={styles.emptyText}>No photos yet</Text>
          </View>
        }
      />
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
    width: 60,
    height: 40,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 28,
    color: '#000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  profileInfo: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFF',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    color: '#999',
    marginBottom: 30,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  photosHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
  },
  photosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  photoRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  beerPhoto: {
    flex: 1,
    aspectRatio: 1,
    marginBottom: 8,
  },
  beerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPhotos: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
});
