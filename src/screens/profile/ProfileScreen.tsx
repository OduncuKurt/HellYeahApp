import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { ref as dbRef, get, update } from 'firebase/database';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
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
import { useModal } from '../../contexts/ModalContext';
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
  const { user: currentUser, logout, refreshUserData } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const { showConfirm, showActionSheet, showError, showSuccess } = useModal();
  const userId = route.params?.userId || currentUser?.uid;
  const isOwnProfile = userId === currentUser?.uid;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

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

  const handleProfilePhotoPress = (): void => {
    if (!isOwnProfile) return;

    showActionSheet(
      'Profile Photo',
      'How would you like to update your profile photo?',
      [
        {
          label: 'Take Photo',
          onPress: () => pickImageFromCamera(),
        },
        {
          label: 'Choose from Gallery',
          onPress: () => pickImageFromGallery(),
        },
      ]
    );
  };

  const pickImageFromCamera = async (): Promise<void> => {
    try {
      const permResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permResult.status !== 'granted') {
        if (!permResult.canAskAgain) {
          showError(
            'Camera Access Denied',
            'Camera access is permanently denied. Please enable it in Settings > Expo Go > Camera.'
          );
        } else {
          showError('Permission Required', 'Camera permission is required to take photos.');
        }
        return;
      }

      // iOS: action sheet kapanma animasyonunu bekle
      await new Promise(resolve => setTimeout(resolve, 350));

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        cameraFacing: 'front',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        let imageUri = result.assets[0].uri;

        // iOS'ta ön kamera varsayılan olarak görüntüyü ters kaydeder (asimetrik yapar).
        // Kullanıcının preview'da gördüğü gibi kalması için yatay çeviriyoruz.
        if (Platform.OS === 'ios') {
          const flipped = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ flip: ImageManipulator.FlipType.Horizontal }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );
          imageUri = flipped.uri;
        }

        await uploadProfilePhoto(imageUri);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      showError('Camera Error', error?.message || 'An error occurred while opening the camera.');
    }
  };

  const pickImageFromGallery = async (): Promise<void> => {
    try {
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      const hasAccess = permResult.status === 'granted' || permResult.status === 'limited';

      if (!hasAccess) {
        if (!permResult.canAskAgain) {
          // iOS: kalıcı reddedilmiş → doğrudan Ayarlar'a aç
          showConfirm(
            'Photo Library Access Denied',
            'Photo access is permanently denied for Expo Go. Open Settings to enable it?',
            () => Linking.openSettings()
          );
        } else {
          showError('Permission Required', 'Photo library permission is required to choose photos.');
        }
        return;
      }

      // iOS: action sheet kapanma animasyonunu bekle
      await new Promise(resolve => setTimeout(resolve, 350));

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Gallery error:', error);
      showError('Gallery Error', error?.message || 'An error occurred while opening the gallery.');
    }
  };

  const uploadProfilePhoto = async (uri: string): Promise<void> => {
    if (!currentUser?.uid) return;

    setUploadingPhoto(true);
    try {
      // Fetch the image
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storage = getStorage();
      const filename = `profile_${currentUser.uid}_${Date.now()}.jpg`;
      const imageRef = storageRef(storage, `avatars/${filename}`);
      
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      // Update user profile in database
      const userRef = dbRef(database, `users/${currentUser.uid}`);
      await update(userRef, {
        avatar: downloadURL,
      });

      // Refresh user data
      await refreshUserData();
      await loadProfile();

      showSuccess('Success!', 'Your profile photo has been updated.');
    } catch (error) {
      console.error('Upload error:', error);
      showError('Error', 'An error occurred while uploading the photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = (): void => {
    showConfirm(
      'Logout',
      'Are you sure you want to logout?',
      async () => {
        await logout();
      }
    );
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
              {/* Background Image with Blur */}
              {profileUser.avatar && (
                <View style={styles.backgroundImageContainer}>
                  <Image 
                    source={{ uri: profileUser.avatar }} 
                    style={styles.backgroundImage}
                    blurRadius={5}
                  />
                  <View style={[styles.backgroundOverlay, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }]} />
                </View>
              )}
              
              {/* Profile Content */}
              <TouchableOpacity
                style={[styles.avatarCircle, { backgroundColor: colors.primary }]}
                onPress={handleProfilePhotoPress}
                disabled={!isOwnProfile || uploadingPhoto}
                activeOpacity={isOwnProfile ? 0.7 : 1}
              >
                {profileUser.avatar ? (
                  <Image source={{ uri: profileUser.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.background }]}>
                    {(profileUser.displayName || profileUser.username || '?').charAt(0).toUpperCase()}
                  </Text>
                )}
                {isOwnProfile && (
                  <View style={styles.cameraIconContainer}>
                    {uploadingPhoto ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.cameraIcon}>+</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[styles.displayName, { color: colors.text }]}>{profileUser.displayName || profileUser.username || 'User'}</Text>
              <Text style={[styles.username, { color: colors.textSecondary }]}>@{profileUser.username || ''}</Text>

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
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  cameraIcon: {
    fontSize: 20,
    fontWeight: '400',
    color: '#000',
    lineHeight: 20,
    textAlign: 'center',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    zIndex: 1,
  },
  username: {
    fontSize: 15,
    color: '#999',
    marginBottom: 20,
    zIndex: 1,
  },
  themeToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    zIndex: 1,
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
    zIndex: 1,
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
