import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { ref as dbRef, get } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserBeers } from '../../services/beerService';
import { Beer, MainStackParamList, User } from '../../types';

type ProfileScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Profile'>;
type ProfileScreenRouteProp = RouteProp<MainStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
  route: ProfileScreenRouteProp;
}

export default function ProfileScreen({ navigation, route }: Props) {
  const { user: currentUser, logout } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
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

  const isGuinness = (beer: Beer): boolean => {
    return beer.isGuinness === true;
  };

  const renderBeerItem = ({ item }: { item: Beer }) => (
    <TouchableOpacity
      style={styles.beerPhoto}
      onPress={() => navigation.navigate('BeerDetail', { beerId: item.id })}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.photoUrl }} style={styles.beerImage} />
      {isGuinness(item) && (
        <View style={[styles.guinnessIndicator, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
          <Text style={{ fontSize: 14 }}>🍀</Text>
        </View>
      )}
    </TouchableOpacity>
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

  if (!profileUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        {isOwnProfile && (
          Platform.OS === 'web' ? (
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
            </Pressable>
          ) : (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
            </TouchableOpacity>
          )
        )}
        {!isOwnProfile && <View style={styles.backBtn} />}
      </View>

      <FlatList
        ListHeaderComponent={
          <View>
            {/* Profile Info */}
            <View style={[styles.profileInfo, { backgroundColor: colors.card }]}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.background }]}>{profileUser.displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[styles.displayName, { color: colors.text }]}>{profileUser.displayName}</Text>
              <Text style={[styles.username, { color: colors.textSecondary }]}>@{profileUser.username}</Text>

              {isOwnProfile && (
                <TouchableOpacity
                  style={[styles.themeToggle, { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' }]}
                  onPress={toggleTheme}
                >
                  <Text style={[styles.themeToggleText, { color: colors.text }]}>
                    {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Stats */}
                <View style={[styles.stats, { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5', borderColor: colors.border }]}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>{profileUser.totalBeers || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Beers</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  
                  {/* NEW: Guinness Stat */}
                  <View style={styles.statItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                      <Text style={[styles.statNumber, { color: colors.text }]}>
                        {profileUser.totalGuinnessBeers || 0}
                      </Text>
                      <Text style={{ fontSize: 16 }}>🍀</Text>
                    </View>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Guinness</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                      {Object.keys(profileUser.friends || {}).length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Friends</Text>
                  </View>
                </View>
            </View>

            {/* Photos Header */}
            <View style={[styles.photosHeader, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <Text style={[styles.photosTitle, { color: colors.text }]}>Photos</Text>
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
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No photos yet</Text>
          </View>
        }
        style={Platform.OS === 'web' ? { height: '100%' } : undefined}
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
    marginBottom: 20,
  },
  themeToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  themeToggleText: {
    fontSize: 14,
    fontWeight: '600',
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
  guinnessIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
