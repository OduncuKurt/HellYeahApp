import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
    acceptFriendRequest,
    getFriendRequests,
    getFriends,
    rejectFriendRequest,
    removeFriend,
    searchUserByUsername,
    sendFriendRequest,
} from '../../services/friendService';
import { FriendRequest, MainStackParamList, User } from '../../types';

type FriendsScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Friends'>;

interface Props {
  navigation: FriendsScreenNavigationProp;
}

export default function FriendsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  const loadFriends = async (): Promise<void> => {
    if (!user) return;
    const friendsList = await getFriends(user.uid);
    setFriends(friendsList);
  };

  const loadRequests = async (): Promise<void> => {
    if (!user) return;
    const requestsList = await getFriendRequests(user.uid);
    setRequests(requestsList);
  };

  const handleSearch = async (): Promise<void> => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    const result = await searchUserByUsername(searchQuery.trim());
    setSearchResult(result);
    setSearching(false);
  };

  const handleSendRequest = async (toUserId: string): Promise<void> => {
    if (!user) return;

    setLoading(true);
    const result = await sendFriendRequest(
      user.uid,
      user.username,
      user.displayName,
      user.avatar,
      toUserId
    );
    setLoading(false);

    if (result.success) {
      Alert.alert('Başarılı', 'Arkadaşlık isteği gönderildi!');
      setSearchResult(null);
      setSearchQuery('');
    } else {
      Alert.alert('Hata', result.error || 'İstek gönderilemedi.');
    }
  };

  const handleAcceptRequest = async (friendId: string): Promise<void> => {
    if (!user) return;

    const result = await acceptFriendRequest(user.uid, friendId);
    if (result.success) {
      Alert.alert('Başarılı', 'Arkadaşlık isteği kabul edildi!');
      loadFriends();
      loadRequests();
    } else {
      Alert.alert('Hata', result.error || 'İstek kabul edilemedi.');
    }
  };

  const handleRejectRequest = async (friendId: string): Promise<void> => {
    if (!user) return;

    const result = await rejectFriendRequest(user.uid, friendId);
    if (result.success) {
      loadRequests();
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string): Promise<void> => {
    if (!user) return;

    Alert.alert(
      'Arkadaşlıktan Çıkar',
      `${friendName} ile arkadaşlığı sonlandırmak istediğine emin misin?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            const result = await removeFriend(user.uid, friendId);
            if (result.success) {
              loadFriends();
            }
          },
        },
      ]
    );
  };

  const renderFriendItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => navigation.navigate('Profile', { userId: item.uid })}
      onLongPress={() => handleRemoveFriend(item.uid, item.displayName)}
      activeOpacity={0.8}
    >
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.displayName}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
      </View>
      <Text style={styles.friendBeers}>{item.totalBeers || 0} beers</Text>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{item.fromDisplayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.fromDisplayName}</Text>
        <Text style={styles.friendUsername}>@{item.fromUsername}</Text>
      </View>
      <View style={styles.requestButtons}>
        <TouchableOpacity
          style={[styles.requestBtn, styles.acceptBtn]}
          onPress={() => handleAcceptRequest(item.fromUserId)}
        >
          <Text style={styles.requestBtnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestBtn, styles.rejectBtn]}
          onPress={() => handleRejectRequest(item.fromUserId)}
        >
          <Text style={styles.requestBtnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Friends</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: activeTab === 'friends' ? colors.primary : theme === 'dark' ? '#2C2C2C' : '#F5F5F5' }]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'friends' ? colors.background : colors.textSecondary }]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: activeTab === 'requests' ? colors.primary : theme === 'dark' ? '#2C2C2C' : '#F5F5F5' }]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'requests' ? colors.background : colors.textSecondary }]}>
            Requests ({requests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: activeTab === 'search' ? colors.primary : theme === 'dark' ? '#2C2C2C' : '#F5F5F5' }]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'search' ? colors.background : colors.textSecondary }]}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Profile', { userId: item.uid })}
              onLongPress={() => handleRemoveFriend(item.uid, item.displayName)}
              activeOpacity={0.8}
            >
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.background }]}>{item.displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={[styles.friendName, { color: colors.text }]}>{item.displayName}</Text>
                <Text style={[styles.friendUsername, { color: colors.textSecondary }]}>@{item.username}</Text>
              </View>
              <Text style={[styles.friendBeers, { color: colors.textSecondary }]}>{item.totalBeers || 0} beers</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No friends yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Search to add friends</Text>
            </View>
          }
        />
      )}

      {activeTab === 'requests' && (
        <FlatList
          data={requests}
          renderItem={({ item }) => (
            <View style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.background }]}>{item.fromDisplayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={[styles.friendName, { color: colors.text }]}>{item.fromDisplayName}</Text>
                <Text style={[styles.friendUsername, { color: colors.textSecondary }]}>@{item.fromUsername}</Text>
              </View>
              <View style={styles.requestButtons}>
                <TouchableOpacity
                  style={[styles.requestBtn, styles.acceptBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleAcceptRequest(item.fromUserId)}
                >
                  <Text style={[styles.requestBtnText, { color: colors.background }]}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.requestBtn, styles.rejectBtn, { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5' }]}
                  onPress={() => handleRejectRequest(item.fromUserId)}
                >
                  <Text style={[styles.requestBtnText, { color: colors.text }]}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No friend requests</Text>
            </View>
          }
        />
      )}

      {activeTab === 'search' && (
        <ScrollView contentContainerStyle={styles.searchContent}>
          <View style={styles.searchBox}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Search by username..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={[styles.searchBtn, { backgroundColor: colors.primary }]}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={[styles.searchBtnText, { color: colors.background }]}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {searchResult && (
            <View style={[styles.searchResultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.background }]}>{searchResult.displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={[styles.friendName, { color: colors.text }]}>{searchResult.displayName}</Text>
                <Text style={[styles.friendUsername, { color: colors.textSecondary }]}>@{searchResult.username}</Text>
              </View>
              <TouchableOpacity
                style={[styles.sendRequestBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleSendRequest(searchResult.uid)}
                disabled={loading}
              >
                <Text style={[styles.sendRequestBtnText, { color: colors.background }]}>
                  {loading ? '...' : 'Add Friend'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {searchResult === null && searchQuery && !searching && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>User not found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: '#FFF',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  friendUsername: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  friendBeers: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  requestBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#000',
  },
  rejectBtn: {
    backgroundColor: '#F5F5F5',
  },
  requestBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  searchContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  searchBox: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  searchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  sendRequestBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sendRequestBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
  },
});
