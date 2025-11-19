import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { getGroupDetails, leaveGroup } from '../../services/groupService';
import { addBeer, getGroupBeers } from '../../services/beerService';
import { Group, Beer, MainStackParamList } from '../../types';

type GroupDetailScreenNavigationProp = StackNavigationProp<MainStackParamList, 'GroupDetail'>;
type GroupDetailScreenRouteProp = RouteProp<MainStackParamList, 'GroupDetail'>;

interface Props {
  navigation: GroupDetailScreenNavigationProp;
  route: GroupDetailScreenRouteProp;
}

export default function GroupDetailScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    loadGroupDetails();
  }, [groupId]);

  const loadGroupDetails = async (): Promise<void> => {
    try {
      const [groupData, beersData] = await Promise.all([
        getGroupDetails(groupId),
        getGroupBeers(groupId),
      ]);
      setGroup(groupData);
      setBeers(beersData);
    } catch (error) {
      console.error('Load group details error:', error);
      Alert.alert('Hata', 'Grup bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeer = async (): Promise<void> => {
    if (!user || !group) return;

    // Yarışma bitmiş mi kontrol et
    const now = new Date();
    const endDate = new Date(group.endDate);
    if (now > endDate) {
      Alert.alert('Yarışma Bitti', 'Bu grubun yarışması sona erdi.');
      return;
    }

    // İzin iste
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermelisiniz.');
      return;
    }

    // Kamera veya galeri seçeneği sun
    Alert.alert(
      'Bira Ekle',
      'Fotoğrafını nasıl eklemek istersin?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Kamera',
          onPress: () => takePicture(),
        },
        {
          text: 'Galeri',
          onPress: () => pickImage(),
        },
      ]
    );
  };

  const takePicture = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadBeerPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Take picture error:', error);
      Alert.alert('Hata', 'Fotoğraf çekilemedi.');
    }
  };

  const pickImage = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadBeerPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Hata', 'Fotoğraf seçilemedi.');
    }
  };

  const uploadBeerPhoto = async (photoUri: string): Promise<void> => {
    if (!user || !group) return;

    setUploading(true);

    const result = await addBeer(
      groupId,
      user.uid,
      user.displayName,
      user.avatar,
      photoUri
    );

    setUploading(false);

    if (result.success) {
      Alert.alert('Başarılı!', 'Bira eklendi! 🍺');
      // Grubu yeniden yükle
      loadGroupDetails();
    } else {
      Alert.alert('Hata', result.error || 'Bira eklenemedi.');
    }
  };

  const handleShareInvite = async (): Promise<void> => {
    if (!group) return;

    try {
      await Share.share({
        message: `Hell Yeah App'te "${group.name}" grubuna katıl! 🍺\n\nDavet Kodu: ${group.inviteCode}\n\nveya linke tıkla: hellyeahapp://invite/${group.inviteCode}`,
        title: `${group.name} grubuna katıl!`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleLeaveGroup = (): void => {
    if (!user || !group) return;

    Alert.alert(
      'Gruptan Ayrıl',
      `"${group.name}" grubundan ayrılmak istediğine emin misin?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            const result = await leaveGroup(groupId, user.uid);
            if (result.success) {
              Alert.alert('Başarılı', 'Gruptan ayrıldın.');
              navigation.goBack();
            } else {
              Alert.alert('Hata', result.error || 'Gruptan ayrılırken hata oluştu.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0F0F0F', '#1A1A1A', '#0F0F0F']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9500" />
            <Text style={styles.loadingText}>Grup yükleniyor...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0F0F0F', '#1A1A1A', '#0F0F0F']} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>😕</Text>
            <Text style={styles.errorText}>Grup bulunamadı</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <LinearGradient
                colors={['#FF9500', '#FF7A00']}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Geri Dön</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const members = Object.entries(group.members || {});
  const isCreator = user?.uid === group.createdBy;

  // Leaderboard - Üyeleri bira sayısına göre sırala
  const leaderboard = members.sort((a, b) => (b[1].beerCount || 0) - (a[1].beerCount || 0));

  // Yarışma durumu
  const now = new Date();
  const startDate = new Date(group.startDate);
  const endDate = new Date(group.endDate);
  const isActive = now >= startDate && now <= endDate;
  const isFinished = now > endDate;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0F0F0F', '#1A1A1A', '#0F0F0F']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Grup Detayları</Text>
          {isActive && !uploading && (
            <TouchableOpacity onPress={handleAddBeer} style={styles.addBeerBtn}>
              <Text style={styles.addBeerIcon}>📷</Text>
            </TouchableOpacity>
          )}
          {!isActive && <View style={styles.backBtn} />}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Group Info Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(255, 149, 0, 0.1)', 'rgba(255, 149, 0, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.groupIconContainer}>
                <LinearGradient colors={['#FF9500', '#FFB84D']} style={styles.groupIcon}>
                  <Text style={styles.groupIconEmoji}>🍺</Text>
                </LinearGradient>
              </View>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupStats}>
                {group.totalBeers || 0} bira içildi • {members.length} kişi
              </Text>
            </LinearGradient>
          </View>

          {/* Invite Code Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Davet Kodu</Text>
              <TouchableOpacity onPress={handleShareInvite}>
                <Text style={styles.shareButton}>Paylaş 🔗</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCode}>{group.inviteCode}</Text>
            </View>
            <Text style={styles.inviteHint}>Bu kodu arkadaşlarınla paylaş</Text>
          </View>

          {/* Competition Status */}
          {isFinished && leaderboard.length > 0 && (
            <View style={styles.card}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.cardGradient}
              >
                <Text style={styles.winnerTitle}>🏆 Kazanan</Text>
                <View style={styles.winnerContainer}>
                  <Text style={styles.winnerAvatar}>{leaderboard[0][1].avatar}</Text>
                  <Text style={styles.winnerName}>{leaderboard[0][1].displayName}</Text>
                  <Text style={styles.winnerCount}>{leaderboard[0][1].beerCount} bira 🍺</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Leaderboard Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏅 Liderlik Tablosu</Text>
            {leaderboard.map(([memberId, memberData], index) => (
              <View key={memberId} style={styles.leaderboardItem}>
                <View style={styles.leaderRank}>
                  <Text style={styles.rankNumber}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </Text>
                </View>
                <Text style={styles.leaderAvatar}>{memberData.avatar}</Text>
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>
                    {memberData.displayName}
                    {memberId === group.createdBy && (
                      <Text style={styles.creatorBadge}> 👑</Text>
                    )}
                  </Text>
                  <Text style={styles.leaderBeerCount}>{memberData.beerCount || 0} bira</Text>
                </View>
                {memberId === user?.uid && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>Sen</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Beer Feed */}
          {beers.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📸 Biralar ({beers.length})</Text>
              {beers.map((beer) => (
                <View key={beer.id} style={styles.beerItem}>
                  <View style={styles.beerHeader}>
                    <Text style={styles.beerAvatar}>{beer.userAvatar}</Text>
                    <View style={styles.beerUserInfo}>
                      <Text style={styles.beerUserName}>{beer.userName}</Text>
                      <Text style={styles.beerDate}>
                        {new Date(beer.timestamp).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <Image source={{ uri: beer.photoUrl }} style={styles.beerPhoto} />
                </View>
              ))}
            </View>
          )}

          {uploading && (
            <View style={styles.uploadingCard}>
              <ActivityIndicator size="large" color="#FF9500" />
              <Text style={styles.uploadingText}>Bira ekleniyor... 🍺</Text>
            </View>
          )}

          {/* Leave Group Button */}
          {!isCreator && (
            <TouchableOpacity
              onPress={handleLeaveGroup}
              activeOpacity={0.9}
              style={styles.leaveButtonWrapper}
            >
              <LinearGradient
                colors={['#FF3B30', '#CC2E26']}
                style={styles.leaveButton}
              >
                <Text style={styles.leaveButtonText}>Gruptan Ayrıl</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {isCreator && (
            <View style={styles.creatorNote}>
              <Text style={styles.creatorNoteText}>
                👑 Grup kurucusu olarak gruptan ayrılamazsın
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#FF9500',
    fontWeight: '300',
  },
  addBeerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  addBeerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  card: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  groupIconContainer: {
    marginBottom: 16,
    overflow: 'hidden',
    borderRadius: 24,
  },
  groupIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  groupIconEmoji: {
    fontSize: 40,
  },
  groupName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -1,
    textAlign: 'center',
  },
  groupStats: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  shareButton: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9500',
  },
  inviteCodeContainer: {
    backgroundColor: 'rgba(15, 15, 15, 0.6)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF9500',
    letterSpacing: 4,
  },
  inviteHint: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  winnerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  winnerContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  winnerAvatar: {
    fontSize: 64,
    marginBottom: 12,
  },
  winnerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  winnerCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  leaderRank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  leaderAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  leaderBeerCount: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  youBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  youBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9500',
  },
  creatorBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  beerItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  beerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  beerAvatar: {
    fontSize: 28,
    marginRight: 12,
  },
  beerUserInfo: {
    flex: 1,
  },
  beerUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  beerDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  beerPhoto: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  uploadingCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF9500',
    fontWeight: '600',
  },
  leaveButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  leaveButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  creatorNote: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  creatorNoteText: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '600',
  },
});
